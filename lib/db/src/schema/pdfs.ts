import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pdfsTable = pgTable("pdfs", {
  id: serial("id").primaryKey(),
  shareToken: text("share_token").notNull().unique(),
  originalName: text("original_name").notNull(),
  storedPath: text("stored_path").notNull(),
  fileSize: integer("file_size").notNull(),
  expiryDate: text("expiry_date").notNull(),
  expiryAction: text("expiry_action").notNull().default("revoke"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPdfSchema = createInsertSchema(pdfsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfsTable.$inferSelect;
