import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const userLicensesTable = pgTable("user_licenses", {
  userId: text("user_id").primaryKey(),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  trialEndDate: timestamp("trial_end_date", { withTimezone: true }).notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  planName: text("plan_name"),
  accountStatus: text("account_status").notNull().default("active"),
  // Admin-set per-customer shared monthly quota override for the metered secure
  // features. NULL = use the plan-tier default. Used for Enterprise custom
  // contracts and one-off manual increases. A sentinel of -1 means "unlimited".
  quotaOverrideSecure: integer("quota_override_secure"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserLicense = typeof userLicensesTable.$inferSelect;
export type InsertUserLicense = typeof userLicensesTable.$inferInsert;
