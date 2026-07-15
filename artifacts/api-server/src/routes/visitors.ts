import { Router, type Request, type Response } from "express";
import { createHash } from "node:crypto";
import geoip from "geoip-lite";
import { db, siteStats, pageViewsTable, dailyVisitorsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const IP_HASH_SALT = process.env["SESSION_SECRET"];
if (!IP_HASH_SALT) {
  throw new Error("SESSION_SECRET must be set: it salts visitor IP hashes for privacy");
}

/** Salted one-way hash so no raw IPs are ever stored. */
function hashIp(ip: string): string {
  return createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 32);
}

/** Coarse location lookup from the offline GeoIP database. */
function lookupGeo(ip: string): { country: string | null; city: string | null } {
  try {
    const geo = geoip.lookup(ip);
    return { country: geo?.country || null, city: geo?.city || null };
  } catch {
    return { country: null, city: null };
  }
}

const router = Router();

// ── Per-IP throttle for tracking beacons ─────────────────────────────────────
const TRACK_WINDOW_MS = 60 * 1000;
const TRACK_MAX_PER_WINDOW = 60;
const trackHits = new Map<string, { count: number; resetAt: number }>();

function throttleTrack(req: Request): boolean {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const entry = trackHits.get(ip);
  if (!entry || now > entry.resetAt) {
    if (trackHits.size > 10_000) trackHits.clear();
    trackHits.set(ip, { count: 1, resetAt: now + TRACK_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= TRACK_MAX_PER_WINDOW;
}

/**
 * Normalizes a client-reported path to a safe, low-cardinality page key.
 * Rejects anything that isn't a plain absolute path; keeps at most the
 * first 3 segments so dynamic ids don't explode the table.
 */
function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const noQuery = raw.split(/[?#]/)[0] ?? "";
  if (!noQuery.startsWith("/") || noQuery.length > 200) return null;
  if (!/^[a-zA-Z0-9\-_./]*$/.test(noQuery) || noQuery.includes("..")) return null;
  const segments = noQuery.split("/").filter(Boolean).slice(0, 3);
  return "/" + segments.join("/");
}

// Records one page view for today (and bumps the legacy global counter).
router.post("/visitors/track", async (req: Request, res: Response) => {
  const path = normalizePath((req.body as { path?: unknown } | undefined)?.path);
  if (!path) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!throttleTrack(req)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    await db
      .insert(pageViewsTable)
      .values({ path, day: today, count: 1 })
      .onConflictDoUpdate({
        target: [pageViewsTable.path, pageViewsTable.day],
        set: {
          count: sql`${pageViewsTable.count} + 1`,
          updatedAt: new Date(),
        },
      });
    await ensureCounter();
    await db
      .update(siteStats)
      .set({ value: sql`${siteStats.value} + 1`, updatedAt: new Date() })
      .where(eq(siteStats.key, "visitors"));

    // Record one unique-visitor row per IP per day with a coarse location.
    const ip = req.ip;
    if (ip) {
      const { country, city } = lookupGeo(ip);
      await db
        .insert(dailyVisitorsTable)
        .values({ day: today, ipHash: hashIp(ip), country, city })
        .onConflictDoNothing();
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, path }, "Failed to record page view");
    res.status(500).json({ error: "Failed to record page view" });
  }
});

async function ensureCounter() {
  await db
    .insert(siteStats)
    .values({ key: "visitors", value: 0 })
    .onConflictDoNothing();
}

router.post("/visitors/increment", async (_req, res) => {
  try {
    await ensureCounter();
    const result = await db
      .update(siteStats)
      .set({
        value: sql`${siteStats.value} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(siteStats.key, "visitors"))
      .returning();
    res.json({ count: result[0]?.value ?? 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to increment visitor count" });
  }
});

router.get("/visitors", async (_req, res) => {
  try {
    await ensureCounter();
    const result = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.key, "visitors"));
    res.json({ count: result[0]?.value ?? 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch visitor count" });
  }
});

export default router;
