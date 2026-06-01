import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per Team/Business organization. The buyer (`ownerUserId`, a Clerk
 * user id) is also seeded as an `admin` row in `organization_members`. Seats
 * are billed through a single Stripe subscription whose `quantity` mirrors
 * `maxSeats`. The active subscription window is
 * (`subscriptionStartDate`, `subscriptionEndDate`].
 *
 * Foreign keys are intentionally *logical* (not enforced via FK constraints)
 * to match the rest of this codebase's pattern and keep the idempotent
 * `CREATE TABLE IF NOT EXISTS` startup migration simple.
 */
export const organizationsTable = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    ownerUserId: text("owner_user_id").notNull(),
    planName: text("plan_name").notNull().default("team"),
    status: text("status").notNull().default("active"),
    maxSeats: integer("max_seats").notNull().default(1),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    subscriptionStartDate: timestamp("subscription_start_date", {
      withTimezone: true,
    }).notNull(),
    subscriptionEndDate: timestamp("subscription_end_date", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("organizations_owner_user_id_idx").on(t.ownerUserId),
    index("organizations_stripe_subscription_id_idx").on(t.stripeSubscriptionId),
  ],
);

export type Organization = typeof organizationsTable.$inferSelect;
export type InsertOrganization = typeof organizationsTable.$inferInsert;
