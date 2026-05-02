import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const userLicensesTable = pgTable("user_licenses", {
  userId: text("user_id").primaryKey(),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  trialEndDate: timestamp("trial_end_date", { withTimezone: true }).notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  planName: text("plan_name"),
  accountStatus: text("account_status").notNull().default("active"),
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
