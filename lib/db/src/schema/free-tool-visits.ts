import { pgTable, serial, text, date, timestamp, index } from "drizzle-orm/pg-core";

/**
 * One row per free-tool page view, with a coarse GeoIP location.
 * Visitors are identified by a salted IP hash (no raw IPs stored).
 * Written by the public tracking endpoint whenever the viewed path is a
 * /tools/:slug page; read by the admin "Free Tools Analytics" page.
 */
export const freeToolVisitsTable = pgTable(
  "free_tool_visits",
  {
    id: serial("id").primaryKey(),
    day: date("day").notNull(),
    tool: text("tool").notNull(),
    ipHash: text("ip_hash").notNull(),
    country: text("country"),
    city: text("city"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("free_tool_visits_day_idx").on(t.day),
    index("free_tool_visits_tool_day_idx").on(t.tool, t.day),
  ],
);

export type FreeToolVisit = typeof freeToolVisitsTable.$inferSelect;
