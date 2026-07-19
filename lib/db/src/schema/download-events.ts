import { pgTable, serial, text, date, timestamp, index } from "drizzle-orm/pg-core";

/**
 * One row per desktop-installer download, with a coarse location.
 * The downloader is identified by a salted hash of their IP (no raw IPs
 * stored). Written by the public download routes; read by the developer
 * dashboard's downloads analytics (admin-protected endpoint).
 */
export const downloadEventsTable = pgTable(
  "download_events",
  {
    id: serial("id").primaryKey(),
    /** Which product installer: "reader" | "secure". */
    app: text("app").notNull(),
    day: date("day").notNull(),
    ipHash: text("ip_hash").notNull(),
    country: text("country"),
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("download_events_app_day_idx").on(t.app, t.day),
    index("download_events_day_idx").on(t.day),
  ],
);

export type DownloadEvent = typeof downloadEventsTable.$inferSelect;
