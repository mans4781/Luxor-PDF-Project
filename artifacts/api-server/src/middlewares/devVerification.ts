import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db, developersTable, developerVerificationsTable } from "@workspace/db";

/**
 * Developer accounts (emails listed in the `developers` table) must pass a
 * passphrase step once per login session. This module holds the shared
 * lookup logic and the API-wide enforcement middleware.
 */

/**
 * Cache userId → developer? so we don't hit Clerk + DB on every request.
 * Positive results (is a developer) are cached longer; negative results use
 * a short TTL so adding an email to the `developers` table takes effect
 * within seconds, not minutes.
 */
const DEV_POSITIVE_TTL_MS = 5 * 60 * 1000;
const DEV_NEGATIVE_TTL_MS = 30 * 1000;
const devCache = new Map<string, { isDev: boolean; expiresAt: number }>();

/** Positive-only cache of session ids that already passed the passphrase. */
const verifiedSessions = new Set<string>();

export async function isDeveloperUser(userId: string): Promise<boolean> {
  const now = Date.now();
  const hit = devCache.get(userId);
  if (hit && now < hit.expiresAt) return hit.isDev;

  const user = await clerkClient.users.getUser(userId);
  const emails = user.emailAddresses
    .map((e) => e.emailAddress.trim().toLowerCase())
    .filter(Boolean);

  let isDev = false;
  if (emails.length > 0) {
    const rows = await db
      .select({ email: developersTable.email })
      .from(developersTable);
    const devEmails = new Set(rows.map((r) => r.email.trim().toLowerCase()));
    isDev = emails.some((e) => devEmails.has(e));
  }
  devCache.set(userId, {
    isDev,
    expiresAt: now + (isDev ? DEV_POSITIVE_TTL_MS : DEV_NEGATIVE_TTL_MS),
  });
  return isDev;
}

export async function isSessionDevVerified(sessionId: string): Promise<boolean> {
  if (verifiedSessions.has(sessionId)) return true;
  const rows = await db
    .select({ sessionId: developerVerificationsTable.sessionId })
    .from(developerVerificationsTable)
    .where(eq(developerVerificationsTable.sessionId, sessionId))
    .limit(1);
  if (rows.length > 0) {
    verifiedSessions.add(sessionId);
    return true;
  }
  return false;
}

export function markSessionDevVerified(sessionId: string): void {
  verifiedSessions.add(sessionId);
}

/** Clear the developer-membership cache (used after the table changes). */
export function clearDevCache(): void {
  devCache.clear();
}

/**
 * API-wide guard: a signed-in developer account whose login session has not
 * passed the passphrase step gets 403 `dev_verification_required` on every
 * user-facing API call. This makes the login-screen gate a real boundary —
 * navigating straight into an app without entering the passphrase leaves
 * the account unable to use any authenticated API feature.
 *
 * - Anonymous requests pass (public app features stay public).
 * - `/account/dev-status` and `/account/dev-verify` are exempt so the
 *   passphrase step itself can work.
 * - `/admin` routes authenticate via x-admin-token, not Clerk — exempt.
 * - If developer membership cannot be determined (Clerk/DB hiccup) the
 *   request passes with a warning — regular users are never taken down by
 *   an outage. But once an account is known to be a developer, a failed
 *   verification lookup fails closed.
 */
export function requireDevVerification() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (
      req.path.startsWith("/admin") ||
      req.path === "/account/dev-status" ||
      req.path === "/account/dev-verify"
    ) {
      next();
      return;
    }
    const { userId, sessionId } = getAuth(req);
    if (!userId || !sessionId) {
      next();
      return;
    }

    let isDev: boolean;
    try {
      isDev = await isDeveloperUser(userId);
    } catch (err) {
      req.log.warn({ err, userId }, "dev membership check failed — passing");
      next();
      return;
    }
    if (!isDev) {
      next();
      return;
    }

    try {
      if (await isSessionDevVerified(sessionId)) {
        next();
        return;
      }
    } catch (err) {
      req.log.error({ err, userId }, "dev verification lookup failed — blocking");
      res.status(403).json({
        error: "Developer verification required.",
        code: "dev_verification_required",
      });
      return;
    }

    res.status(403).json({
      error: "Developer verification required. Sign in and enter your passphrase.",
      code: "dev_verification_required",
    });
  };
}
