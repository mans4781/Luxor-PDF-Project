import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const esignWaitlistTable = pgTable("esign_waitlist", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EsignWaitlistEntry = typeof esignWaitlistTable.$inferSelect;
export type InsertEsignWaitlistEntry = typeof esignWaitlistTable.$inferInsert;
