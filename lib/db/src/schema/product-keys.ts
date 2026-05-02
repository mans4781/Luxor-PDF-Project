import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * One row per product key minted by an admin. The raw key is NEVER stored —
 * only its SHA-256 hash (`keyHash`, unique) and a short display prefix
 * (`keyPrefix`, e.g. "LUXOR-AB23"). Activations tick `currentActivations`
 * upward until it hits `maxActivations`, at which point further redemptions
 * are refused.
 */
export const productKeysTable = pgTable(
  "product_keys",
  {
    id: serial("id").primaryKey(),
    keyHash: text("key_hash").notNull().unique(),
    keyPrefix: text("key_prefix").notNull(),
    planName: text("plan_name").notNull(),
    durationDays: integer("duration_days").notNull(),
    maxActivations: integer("max_activations").notNull().default(1),
    currentActivations: integer("current_activations").notNull().default(0),
    status: text("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    index("product_keys_key_prefix_idx").on(t.keyPrefix),
    index("product_keys_status_idx").on(t.status),
  ],
);

export type ProductKey = typeof productKeysTable.$inferSelect;
export type InsertProductKey = typeof productKeysTable.$inferInsert;
