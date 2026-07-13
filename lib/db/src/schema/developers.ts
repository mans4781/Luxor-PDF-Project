import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Emails that require the developer passphrase step after login.
 * Rows are added by the site owner (via SQL / future admin tooling).
 */
export const developersTable = pgTable("developers", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Records which Clerk sessions have passed the developer passphrase check.
 * Keyed by session id so every new login requires the passphrase again.
 */
export const developerVerificationsTable = pgTable("developer_verifications", {
  sessionId: text("session_id").primaryKey(),
  userId: text("user_id").notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Developer = typeof developersTable.$inferSelect;
export type DeveloperVerification = typeof developerVerificationsTable.$inferSelect;
