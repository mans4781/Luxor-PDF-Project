import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const licenseEventsTable = pgTable("license_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(),
  eventMessage: text("event_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type LicenseEvent = typeof licenseEventsTable.$inferSelect;
export type InsertLicenseEvent = typeof licenseEventsTable.$inferInsert;
