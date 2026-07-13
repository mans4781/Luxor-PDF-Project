// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./pdfs";
export * from "./pdf-otps";
export * from "./visitors";
export * from "./user-licenses";
export * from "./daily-usage";
export * from "./monthly-usage";
export * from "./license-events";
export * from "./product-keys";
export * from "./licenses";
export * from "./devices";
export * from "./organizations";
export * from "./organization-members";
export * from "./organization-invites";
export * from "./desktop-auth-handoffs";
export * from "./welcome-emails";
export * from "./developers";
