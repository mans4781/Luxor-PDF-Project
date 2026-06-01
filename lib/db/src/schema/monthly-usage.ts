import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

/**
 * Per-user, per-billing-month usage of the two metered "secure" features:
 * Password Protect and Secure PDF (Expiry + Print/Copy restriction).
 *
 * `periodStart` is the first day of the user's current billing month (anchored
 * to their subscription start day-of-month), so monthly quotas reset
 * automatically when a new period row is created.
 */
export const monthlyUsageTable = pgTable(
  "monthly_usage",
  {
    userId: text("user_id").notNull(),
    periodStart: date("period_start").notNull(),
    passwordProtectCount: integer("password_protect_count")
      .notNull()
      .default(0),
    securePdfCount: integer("secure_pdf_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.periodStart] }),
    index("monthly_usage_user_id_idx").on(t.userId),
  ],
);

export type MonthlyUsage = typeof monthlyUsageTable.$inferSelect;
export type InsertMonthlyUsage = typeof monthlyUsageTable.$inferInsert;
