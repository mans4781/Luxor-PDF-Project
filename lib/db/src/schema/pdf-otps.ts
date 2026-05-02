import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { pdfsTable } from "./pdfs";

export const pdfOtpsTable = pgTable("pdf_otps", {
  id: serial("id").primaryKey(),
  pdfId: integer("pdf_id")
    .notNull()
    .references(() => pdfsTable.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPdfOtpSchema = createInsertSchema(pdfOtpsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPdfOtp = z.infer<typeof insertPdfOtpSchema>;
export type PdfOtp = typeof pdfOtpsTable.$inferSelect;
