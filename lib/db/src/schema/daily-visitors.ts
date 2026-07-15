import { pgTable, serial, text, date, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

/**
 * One row per unique visitor per day, with a coarse location.
 * The visitor is identified by a salted hash of their IP (no raw IPs stored).
 * Written by the public tracking endpoint; read by the admin analytics page.
 */
export const dailyVisitorsTable = pgTable(
  "daily_visitors",
  {
    id: serial("id").primaryKey(),
    day: date("day").notNull(),
    ipHash: text("ip_hash").notNull(),
    country: text("country"),
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_visitors_day_ip_idx").on(t.day, t.ipHash),
    index("daily_visitors_day_idx").on(t.day),
  ],
);

export type DailyVisitor = typeof dailyVisitorsTable.$inferSelect;
