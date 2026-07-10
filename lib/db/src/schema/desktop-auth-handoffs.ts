import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One-shot handoff records for desktop browser-based sign-in.
 *
 * The desktop app generates a random `state`, opens the system browser to
 * the suite sign-in page, and polls for a ticket. Once the user signs in,
 * the browser page posts the state and the server stores a single-use
 * Clerk sign-in ticket here. The desktop app claims it exactly once.
 */
export const desktopAuthHandoffsTable = pgTable("desktop_auth_handoffs", {
  id: serial("id").primaryKey(),
  state: text("state").notNull().unique(),
  ticket: text("ticket").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDesktopAuthHandoffSchema = createInsertSchema(
  desktopAuthHandoffsTable,
).omit({ id: true, createdAt: true });
export type InsertDesktopAuthHandoff = z.infer<
  typeof insertDesktopAuthHandoffSchema
>;
export type DesktopAuthHandoff = typeof desktopAuthHandoffsTable.$inferSelect;
