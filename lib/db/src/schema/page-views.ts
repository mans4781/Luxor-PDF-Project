import { pgTable, serial, text, date, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Daily page-view counters, one row per (page path, day).
 * Incremented by the public tracking endpoint; read by the admin dashboard.
 */
export const pageViewsTable = pgTable(
  "page_views",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("page_views_path_day_idx").on(t.path, t.day)],
);

export type PageView = typeof pageViewsTable.$inferSelect;
