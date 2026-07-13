import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const welcomeEmailsTable = pgTable("welcome_emails", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WelcomeEmail = typeof welcomeEmailsTable.$inferSelect;
export type InsertWelcomeEmail = typeof welcomeEmailsTable.$inferInsert;
