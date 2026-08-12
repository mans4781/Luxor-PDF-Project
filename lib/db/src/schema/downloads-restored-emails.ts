import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Delivery ledger for the "downloads are back" notification emails, one row
 * per user. Rows act as atomic per-recipient claims:
 *
 *   - status 'pending' — a worker has claimed this recipient and is sending.
 *     Stale pending claims (crashed workers) may be re-claimed after a
 *     timeout; the Resend idempotency key keeps a re-send from duplicating
 *     an email the provider already accepted.
 *   - status 'sent'    — delivery confirmed; never emailed again.
 *
 * A failed send deletes its claim so a later run can retry the recipient.
 */
export const downloadsRestoredEmailsTable = pgTable("downloads_restored_emails", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  // Fencing token: rotated on every (re)claim. mark-sent / release must
  // present the token they were issued, so a worker that lost its claim to
  // a stale-reclaim cannot touch the newer worker's row.
  claimToken: text("claim_token"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type DownloadsRestoredEmail = typeof downloadsRestoredEmailsTable.$inferSelect;
export type InsertDownloadsRestoredEmail = typeof downloadsRestoredEmailsTable.$inferInsert;
