import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const dailyUsageTable = pgTable(
  "daily_usage",
  {
    userId: text("user_id").notNull(),
    usageDate: date("usage_date").notNull(),
    editCount: integer("edit_count").notNull().default(0),
    convertCount: integer("convert_count").notNull().default(0),
    secureCount: integer("secure_count").notNull().default(0),
    totalCount: integer("total_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.usageDate] }),
    index("daily_usage_user_id_idx").on(t.userId),
  ],
);

export type DailyUsage = typeof dailyUsageTable.$inferSelect;
export type InsertDailyUsage = typeof dailyUsageTable.$inferInsert;
