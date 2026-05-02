import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * One row per physical install (Electron desktop, browser, etc.). The
 * `deviceId` is generated client-side (UUID) at first launch and stored
 * locally; the server treats it as opaque. A device row is upserted on
 * every activation and `lastSeenAt` is bumped on every status check.
 */
export const devicesTable = pgTable(
  "devices",
  {
    deviceId: text("device_id").primaryKey(),
    userId: text("user_id").notNull(),
    deviceName: text("device_name"),
    os: text("os"),
    firstActivatedAt: timestamp("first_activated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("devices_user_id_idx").on(t.userId)],
);

export type Device = typeof devicesTable.$inferSelect;
export type InsertDevice = typeof devicesTable.$inferInsert;
