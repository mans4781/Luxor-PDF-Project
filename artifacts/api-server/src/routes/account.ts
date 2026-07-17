import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { sql } from "drizzle-orm";
import { createHash, timingSafeEqual } from "crypto";
import { db, welcomeEmailsTable, developerVerificationsTable } from "@workspace/db";
import { sendWelcomeEmail } from "../lib/email";
import {
  isDeveloperUser,
  isSessionDevVerified,
  markSessionDevVerified,
} from "../middlewares/devVerification";

const router: IRouter = Router();

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Only accounts created within this window are eligible for the welcome
 * email. Existing users who pass through the sign-up flow again (e.g. an
 * SSO callback for an account that already exists) never receive it.
 */
const NEW_ACCOUNT_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * After a failed send we release the DB claim so a later attempt can retry,
 * but we also hold a short in-memory cooldown per user so a provider outage
 * can't be turned into a rapid retry/cost loop.
 */
const RETRY_COOLDOWN_MS = 60 * 1000;
const failedSendCooldown = new Map<string, number>();

// ─── Idempotent startup migration ─────────────────────────────────────────────

export async function runWelcomeMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS welcome_emails (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS developers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS developer_verifications (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  // The admin/developer are the same person: always seed the reserved admin
  // email as a developer so it can act as a regular account (behind the
  // two-passphrase gate) in every environment, including fresh prod DBs.
  const adminEmail = (process.env["ADMIN_EMAIL"] ?? "").trim().toLowerCase();
  if (adminEmail) {
    await db.execute(sql`
      INSERT INTO developers (email) VALUES (${adminEmail})
      ON CONFLICT (email) DO NOTHING
    `);
  }
}

// ─── Developer passphrase gate ────────────────────────────────────────────────

const DEV_PASSPHRASE_1 = process.env["DEV_PASSPHRASE_1"];
const DEV_PASSPHRASE_2 = process.env["DEV_PASSPHRASE_2"];

/** Per-user throttle for failed passphrase attempts. */
const DEV_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const DEV_MAX_ATTEMPTS = 5;
const devAttempts = new Map<string, { count: number; windowStart: number }>();

function tooManyDevAttempts(userId: string): boolean {
  const now = Date.now();
  const entry = devAttempts.get(userId);
  if (!entry || now - entry.windowStart > DEV_ATTEMPT_WINDOW_MS) {
    return false;
  }
  return entry.count >= DEV_MAX_ATTEMPTS;
}

function recordDevAttempt(userId: string): void {
  const now = Date.now();
  const entry = devAttempts.get(userId);
  if (!entry || now - entry.windowStart > DEV_ATTEMPT_WINDOW_MS) {
    devAttempts.set(userId, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

/**
 * GET /account/dev-status — is the signed-in user a developer, and has the
 * current login session already passed the passphrase step?
 */
router.get("/account/dev-status", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId || !auth.sessionId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  try {
    const isDeveloper = await isDeveloperUser(auth.userId);
    if (!isDeveloper) {
      res.json({ isDeveloper: false, verified: false });
      return;
    }
    const verified = await isSessionDevVerified(auth.sessionId);
    res.json({ isDeveloper: true, verified });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "dev-status check failed");
    res.status(500).json({ error: "Failed to check developer status" });
  }
});

/**
 * POST /account/dev-verify — submit the developer passphrase. On success the
 * current login session is marked verified; a new login requires it again.
 */
router.post("/account/dev-verify", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId || !auth.sessionId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  if (!DEV_PASSPHRASE_1 || !DEV_PASSPHRASE_2) {
    req.log.error("DEV_PASSPHRASE_1 / DEV_PASSPHRASE_2 is not configured");
    res.status(500).json({ error: "Developer verification is not configured" });
    return;
  }
  if (tooManyDevAttempts(auth.userId)) {
    res.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
    return;
  }

  const body = req.body as { passphrase1?: unknown; passphrase2?: unknown };
  const passphrase1 = body?.passphrase1;
  const passphrase2 = body?.passphrase2;
  const validInput = (v: unknown): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= 512;
  if (!validInput(passphrase1) || !validInput(passphrase2)) {
    recordDevAttempt(auth.userId);
    res.json({ verified: false });
    return;
  }

  try {
    const isDeveloper = await isDeveloperUser(auth.userId);
    // Evaluate both comparisons unconditionally so a wrong first passphrase
    // doesn't short-circuit and leak which one failed via timing.
    const ok1 = safeEqual(passphrase1, DEV_PASSPHRASE_1);
    const ok2 = safeEqual(passphrase2, DEV_PASSPHRASE_2);
    if (!isDeveloper || !ok1 || !ok2) {
      recordDevAttempt(auth.userId);
      res.json({ verified: false });
      return;
    }
    await db
      .insert(developerVerificationsTable)
      .values({ sessionId: auth.sessionId, userId: auth.userId })
      .onConflictDoNothing();
    markSessionDevVerified(auth.sessionId);
    devAttempts.delete(auth.userId);
    res.json({ verified: true });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "dev-verify failed");
    res.status(500).json({ error: "Failed to verify passphrase" });
  }
});

/**
 * POST /account/welcome — send the one-time welcome email to a newly
 * signed-up user. Idempotent: the insert claims the send, so repeat calls
 * (double-clicks, both sign-up entry points firing) are no-ops.
 */
router.post("/account/welcome", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const cooldownUntil = failedSendCooldown.get(auth.userId);
  if (cooldownUntil !== undefined && Date.now() < cooldownUntil) {
    res.json({ sent: false, alreadySent: false });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(auth.userId);

    const accountAgeMs = Date.now() - user.createdAt;
    if (accountAgeMs > NEW_ACCOUNT_WINDOW_MS) {
      // Not a new account — treat as already handled, never send.
      res.json({ sent: false, alreadySent: true });
      return;
    }

    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    if (!email) {
      res.json({ sent: false, alreadySent: false });
      return;
    }

    // Claim the send atomically; if a row already exists, someone else
    // (or an earlier call) already sent it.
    const claimed = await db
      .insert(welcomeEmailsTable)
      .values({ userId: auth.userId, email })
      .onConflictDoNothing()
      .returning({ userId: welcomeEmailsTable.userId });

    if (claimed.length === 0) {
      res.json({ sent: false, alreadySent: true });
      return;
    }

    // The Clerk instance has name attributes disabled, so user.firstName is
    // usually null — the sign-up form stores the name in unsafeMetadata.
    const metadataFullName =
      typeof user.unsafeMetadata?.["fullName"] === "string"
        ? (user.unsafeMetadata["fullName"] as string).trim()
        : "";
    const firstName =
      user.firstName ?? (metadataFullName ? metadataFullName.split(/\s+/)[0] : null);

    const sent = await sendWelcomeEmail({ to: email, firstName });
    if (!sent) {
      // Release the claim so a later retry can attempt the send again,
      // but hold a short cooldown to prevent hot-retry loops.
      failedSendCooldown.set(auth.userId, Date.now() + RETRY_COOLDOWN_MS);
      await db.execute(
        sql`DELETE FROM welcome_emails WHERE user_id = ${auth.userId}`,
      );
    } else {
      failedSendCooldown.delete(auth.userId);
    }
    res.json({ sent, alreadySent: false });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "welcome email send failed");
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

export default router;
