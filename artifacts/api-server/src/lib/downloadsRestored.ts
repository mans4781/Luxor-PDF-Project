import {
  db,
  downloadsRestoredEmailsTable,
  paymentsTable,
  licenseEventsTable,
} from "@workspace/db";
import { and, eq, gte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * "Downloads are back" notification pipeline.
 *
 * License emails sent while Secure desktop downloads were locked promised
 * customers "we'll email you as soon as the download is available again".
 * This module keeps that promise safely:
 *
 *   - findLockWindowCandidates(): every user who paid or was
 *     granted/renewed/reissued a license during the lock window.
 *   - notifyCandidates(): sends the notification with a per-recipient
 *     atomic claim in downloads_restored_emails, so concurrent runs,
 *     retries, and crashes cannot double-email anyone:
 *       1. claim   — INSERT 'pending' (or reclaim a stale 'pending' left by
 *                    a crashed worker). Exactly one worker wins per user.
 *       2. send    — with a stable Resend Idempotency-Key, so even a re-send
 *                    after a crash-between-send-and-record is deduplicated
 *                    by the provider.
 *       3. record  — mark 'sent' on success; delete the claim on failure so
 *                    a later run retries the recipient.
 */

/** How long a 'pending' claim blocks other workers before it is considered
 * abandoned (crashed worker) and may be re-claimed. */
export const STALE_CLAIM_MINUTES = 15;

/** Stable per-user provider idempotency key (Resend dedupes on it). */
export function downloadsRestoredIdempotencyKey(userId: string): string {
  return `downloads-restored/${userId}`;
}

export interface NotifyDeps {
  /** Resolve the recipient's email + display name (e.g. from Clerk). */
  lookupRecipient(
    userId: string,
  ): Promise<{ email: string | null; name: string | null }>;
  /** Send the email; must honour idempotencyKey. Returns true on success. */
  send(params: {
    to: string;
    customerName: string | null;
    downloadUrl: string;
    idempotencyKey: string;
  }): Promise<boolean>;
}

export interface NotifySummary {
  sent: number;
  failed: number;
  noEmail: number;
  /** Recipients skipped because another (possibly concurrent) worker holds
   * or completed the claim. */
  alreadyClaimed: number;
}

/** Users who bought/received a license during the lock window. */
export async function findLockWindowCandidates(lockStart: Date): Promise<string[]> {
  const paymentUsers = await db
    .selectDistinct({ userId: paymentsTable.userId })
    .from(paymentsTable)
    .where(gte(paymentsTable.createdAt, lockStart));
  const eventUsers = await db
    .selectDistinct({ userId: licenseEventsTable.userId })
    .from(licenseEventsTable)
    .where(
      and(
        gte(licenseEventsTable.createdAt, lockStart),
        sql`${licenseEventsTable.eventType} IN ('license_activated', 'license_renewed', 'license_key_reissued')`,
      ),
    );
  return [...new Set([...paymentUsers, ...eventUsers].map((r) => r.userId))];
}

/** User ids already confirmed sent (for dry-run reporting). */
export async function findAlreadyNotified(): Promise<Set<string>> {
  const rows = await db
    .select({ userId: downloadsRestoredEmailsTable.userId })
    .from(downloadsRestoredEmailsTable)
    .where(eq(downloadsRestoredEmailsTable.status, "sent"));
  return new Set(rows.map((r) => r.userId));
}

/**
 * Atomically claim a recipient. Wins when either no row exists (fresh
 * INSERT of 'pending') or an existing 'pending' claim is stale (crashed
 * worker) and gets re-claimed. Loses when the row is 'sent' or freshly
 * 'pending' — the single UPSERT makes this race-free across workers.
 *
 * Returns a fencing token unique to this claim. mark-sent / release require
 * the token, so a slow worker whose claim was re-claimed after the stale
 * timeout can no longer touch the row: its token has been rotated away.
 */
export async function claimRecipient(
  userId: string,
  email: string,
): Promise<string | null> {
  const token = randomUUID();
  const res = await db.execute(sql`
    INSERT INTO downloads_restored_emails (user_id, email, status, claim_token, claimed_at)
    VALUES (${userId}, ${email}, 'pending', ${token}, now())
    ON CONFLICT (user_id) DO UPDATE
      SET claimed_at = now(), email = ${email}, claim_token = ${token}
      WHERE downloads_restored_emails.status = 'pending'
        AND downloads_restored_emails.claimed_at < now() - (${STALE_CLAIM_MINUTES} * interval '1 minute')
    RETURNING user_id
  `);
  return (res.rowCount ?? 0) > 0 ? token : null;
}

/** Confirm delivery — only if we still own the claim (fencing token). */
export async function markSent(userId: string, token: string): Promise<void> {
  await db
    .update(downloadsRestoredEmailsTable)
    .set({ status: "sent", sentAt: new Date() })
    .where(
      and(
        eq(downloadsRestoredEmailsTable.userId, userId),
        eq(downloadsRestoredEmailsTable.status, "pending"),
        eq(downloadsRestoredEmailsTable.claimToken, token),
      ),
    );
}

/** Release OUR claim after a failed send so a later run can retry. A claim
 * that was re-claimed by another worker (token rotated) is left untouched. */
export async function releaseClaim(userId: string, token: string): Promise<void> {
  await db
    .delete(downloadsRestoredEmailsTable)
    .where(
      and(
        eq(downloadsRestoredEmailsTable.userId, userId),
        eq(downloadsRestoredEmailsTable.status, "pending"),
        eq(downloadsRestoredEmailsTable.claimToken, token),
      ),
    );
}

export async function notifyCandidates(
  candidateIds: string[],
  downloadUrl: string,
  deps: NotifyDeps,
): Promise<NotifySummary> {
  const summary: NotifySummary = {
    sent: 0,
    failed: 0,
    noEmail: 0,
    alreadyClaimed: 0,
  };

  for (const userId of candidateIds) {
    const { email, name } = await deps.lookupRecipient(userId);
    if (!email) {
      summary.noEmail++;
      continue;
    }

    const token = await claimRecipient(userId, email);
    if (!token) {
      summary.alreadyClaimed++;
      continue;
    }

    let ok = false;
    try {
      ok = await deps.send({
        to: email,
        customerName: name,
        downloadUrl,
        idempotencyKey: downloadsRestoredIdempotencyKey(userId),
      });
    } catch {
      ok = false;
    }

    if (ok) {
      await markSent(userId, token);
      summary.sent++;
    } else {
      await releaseClaim(userId, token);
      summary.failed++;
    }
  }

  return summary;
}
