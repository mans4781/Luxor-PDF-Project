import { Router, type IRouter, type Request, type Response } from "express";
import { sql, desc, eq } from "drizzle-orm";
import { db, ticketsTable } from "@workspace/db";

const router: IRouter = Router();

// ─── Idempotent startup migration ─────────────────────────────────────────────

export async function runTicketMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      product TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
}

// ─── Per-IP throttle so the public form can't be spammed ─────────────────────

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;
const hits = new Map<string, { count: number; resetAt: number }>();

function throttle(req: Request): boolean {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    if (hits.size > 10_000) hits.clear();
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

const CATEGORIES = new Set(["general", "billing", "refund", "technical"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > max) return null;
  return s;
}

/**
 * POST /tickets — public: raise a support ticket (query, billing issue,
 * refund request, technical problem). Rate-limited per IP.
 */
router.post("/tickets", async (req: Request, res: Response): Promise<void> => {
  if (!throttle(req)) {
    res.status(429).json({ error: "Too many tickets from this device. Please try again later." });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const name = cleanStr(body["name"], 120);
  const email = cleanStr(body["email"], 254);
  const product = cleanStr(body["product"], 80);
  const subject = cleanStr(body["subject"], 200);
  const message = cleanStr(body["message"], 5000);
  const categoryRaw = cleanStr(body["category"], 40) ?? "general";
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : "general";

  if (!name || !email || !product || !subject || !message) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    const [row] = await db
      .insert(ticketsTable)
      .values({ name, email, product, category, subject, message })
      .returning({ id: ticketsTable.id });
    req.log.info({ ticketId: row?.id, category }, "support ticket created");
    res.status(201).json({ id: row?.id });
  } catch (err) {
    req.log.error({ err }, "ticket create failed");
    res.status(500).json({ error: "Could not submit your ticket. Please try again." });
  }
});

export default router;

// ─── Admin helpers (mounted from admin router) ───────────────────────────────

export async function listTickets(): Promise<(typeof ticketsTable.$inferSelect)[]> {
  return db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt)).limit(500);
}

const STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);

export async function updateTicket(
  id: number,
  patch: { status?: string; adminReply?: string },
): Promise<typeof ticketsTable.$inferSelect | null> {
  const update: Partial<typeof ticketsTable.$inferInsert> = { updatedAt: new Date() };
  if (patch.status !== undefined) {
    if (!STATUSES.has(patch.status)) return null;
    update.status = patch.status;
  }
  if (patch.adminReply !== undefined) {
    update.adminReply = patch.adminReply.slice(0, 5000);
  }
  const [row] = await db
    .update(ticketsTable)
    .set(update)
    .where(eq(ticketsTable.id, id))
    .returning();
  return row ?? null;
}
