import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Ledger of successful payments, written by the billing webhooks.
 * `amountMinor` is in the smallest currency unit (cents / paise).
 * (provider, eventId) is unique so webhook replays never double-count revenue.
 */
export const paymentsTable = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    userId: text("user_id").notNull(),
    planName: text("plan_name").notNull(),
    amountMinor: integer("amount_minor"),
    currency: text("currency"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payments_provider_event_idx").on(t.provider, t.eventId)],
);

export type Payment = typeof paymentsTable.$inferSelect;
