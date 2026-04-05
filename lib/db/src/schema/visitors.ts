import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";

export const siteStats = pgTable("site_stats", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteStat = typeof siteStats.$inferSelect;
