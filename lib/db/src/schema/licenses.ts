import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per activation of a product key against a user+device. A single
 * user may have several rows (one per device, up to the key's
 * `maxActivations`). The active subscription window is
 * (`subscriptionStartDate`, `subscriptionEndDate`].
 *
 * Foreign keys are intentionally *logical* (not enforced via FK
 * constraints) to match the rest of this codebase's pattern and to keep
 * the idempotent `CREATE TABLE IF NOT EXISTS` startup migration simple.
 */
export const licensesTable = pgTable(
  "licenses",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    productKeyId: integer("product_key_id").notNull(),
    deviceId: text("device_id").notNull(),
    planName: text("plan_name").notNull(),
    subscriptionStartDate: timestamp("subscription_start_date", {
      withTimezone: true,
    }).notNull(),
    subscriptionEndDate: timestamp("subscription_end_date", {
      withTimezone: true,
    }).notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (t) => [
    index("licenses_user_id_idx").on(t.userId),
    index("licenses_product_key_id_idx").on(t.productKeyId),
    index("licenses_user_status_idx").on(t.userId, t.status),
  ],
);

export type License = typeof licensesTable.$inferSelect;
export type InsertLicense = typeof licensesTable.$inferInsert;
