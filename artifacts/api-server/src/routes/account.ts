import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { sql } from "drizzle-orm";
import { db, welcomeEmailsTable } from "@workspace/db";
import { sendWelcomeEmail } from "../lib/email";

const router: IRouter = Router();

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
}

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

    const sent = await sendWelcomeEmail({ to: email, firstName: user.firstName });
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
