import { Router, type Request, type Response } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  db,
  pdfsTable,
  productKeysTable,
  siteStats,
  pageViewsTable,
  dailyVisitorsTable,
  paymentsTable,
  userLicensesTable,
  licenseEventsTable,
} from "@workspace/db";
import { desc, eq, gte, sql } from "drizzle-orm";
import {
  AdminGenerateProductKeysBody,
  AdminRevokeProductKeyBody,
  AdminExtendProductKeyBody,
} from "@workspace/api-zod";
import {
  generateProductKey,
  hashProductKey,
  PLAN_DURATION_DAYS,
} from "@workspace/license-keys";
import { listTickets, updateTicket } from "./tickets";
import {
  adminListProductKeys,
  adminRevokeProductKey,
  adminExtendProductKey,
  adminListCustomers,
  adminSetQuotaOverride,
} from "../lib/license";

const router = Router();

const ADMIN_TOKEN = process.env["ADMIN_TOKEN"];
const ADMIN_PASSPHRASE = process.env["ADMIN_PASSPHRASE"];
const ADMIN_EMAIL = (process.env["ADMIN_EMAIL"] ?? "").trim().toLowerCase();
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"];

/** Constant-time string comparison (hash first to normalize lengths). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ── Simple in-memory login throttle (per IP) ─────────────────────────────────
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function throttleLogin(req: Request, res: Response): boolean {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    res.status(429).json({ error: "Too many attempts. Try again later." });
    return false;
  }
  return true;
}

function credentialsValid(email: unknown, password: unknown): boolean {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;
  if (typeof email !== "string" || typeof password !== "string") return false;
  return (
    safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL) &&
    safeEqual(password, ADMIN_PASSWORD)
  );
}

function checkAuth(req: Request, res: Response): boolean {
  if (!ADMIN_TOKEN) {
    res.status(503).json({ error: "Admin access not configured" });
    return false;
  }
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/** Month labels for the trailing 12 months (oldest first). */
function trailingMonths(now: Date): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return out;
}

// Step 1 of admin login: email + password. On success the client shows the
// "Welcome admin" screen asking for the developer passphrase.
router.post("/admin/login-credentials", (req, res): void => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    res.status(503).json({ error: "Admin access not configured" });
    return;
  }
  if (!throttleLogin(req, res)) return;
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  if (!credentialsValid(email, password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  res.json({ ok: true });
});

// Step 2 of admin login: email + password + developer passphrase → token.
// All three factors are re-verified server-side so step 1 cannot be skipped.
router.post("/admin/login", (req, res): void => {
  if (!ADMIN_TOKEN || !ADMIN_PASSPHRASE || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    res.status(503).json({ error: "Admin access not configured" });
    return;
  }
  if (!throttleLogin(req, res)) return;
  const { email, password, passphrase } = req.body as {
    email?: string;
    password?: string;
    passphrase?: string;
  };
  if (!credentialsValid(email, password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (typeof passphrase !== "string" || !passphrase || !safeEqual(passphrase, ADMIN_PASSPHRASE)) {
    res.status(401).json({ error: "Invalid passphrase" });
    return;
  }
  res.json({ token: ADMIN_TOKEN });
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;

  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const [visitorRow] = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.key, "visitors"));

    const pdfs = await db.select().from(pdfsTable);
    let activePdfs = 0;
    let expiredPdfs = 0;
    let totalStorageBytes = 0;
    for (const p of pdfs) {
      totalStorageBytes += p.fileSize;
      if (new Date(p.expiryDate) < today) expiredPdfs++;
      else activePdfs++;
    }

    // ── Users & plan distribution (real, from user_licenses) ────────────────
    const licenseRows = await db
      .select({
        planName: userLicensesTable.planName,
        isPaid: userLicensesTable.isPaid,
        createdAt: userLicensesTable.createdAt,
      })
      .from(userLicensesTable);
    const totalUsers = licenseRows.length;
    const planCounts: Record<string, number> = {};
    let paidUsers = 0;
    for (const r of licenseRows) {
      const key = r.isPaid ? (r.planName ?? "paid") : "free";
      if (r.isPaid) paidUsers++;
      planCounts[key] = (planCounts[key] ?? 0) + 1;
    }

    // ── Revenue (real, from payments ledger; grouped by currency) ───────────
    const paymentRows = await db
      .select({
        amountMinor: paymentsTable.amountMinor,
        currency: paymentsTable.currency,
        createdAt: paymentsTable.createdAt,
      })
      .from(paymentsTable);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalRevenue: Record<string, number> = {};
    const monthRevenue: Record<string, number> = {};
    const revenueByMonth = new Map<string, Record<string, number>>();
    for (const p of paymentRows) {
      if (p.amountMinor == null) continue;
      const cur = p.currency ?? "USD";
      const major = p.amountMinor / 100;
      totalRevenue[cur] = (totalRevenue[cur] ?? 0) + major;
      if (p.createdAt >= monthStart) {
        monthRevenue[cur] = (monthRevenue[cur] ?? 0) + major;
      }
      const mk = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const bucket = revenueByMonth.get(mk) ?? {};
      bucket[cur] = (bucket[cur] ?? 0) + major;
      revenueByMonth.set(mk, bucket);
    }

    // ── Monthly trend: signups + revenue per trailing month ─────────────────
    const months = trailingMonths(now);
    const signupsByMonth = new Map<string, number>();
    for (const r of licenseRows) {
      const mk = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
      signupsByMonth.set(mk, (signupsByMonth.get(mk) ?? 0) + 1);
    }
    const monthlyData = months.map((m) => ({
      month: m.label,
      revenue: revenueByMonth.get(m.key) ?? {},
      signups: signupsByMonth.get(m.key) ?? 0,
    }));

    // ── Daily page views per page (last 30 days) ────────────────────────────
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const pageViewRows = await db
      .select()
      .from(pageViewsTable)
      .where(gte(pageViewsTable.day, cutoff))
      .orderBy(pageViewsTable.day);
    const perPageTotals = new Map<string, number>();
    const perDayTotals = new Map<string, number>();
    for (const r of pageViewRows) {
      perPageTotals.set(r.path, (perPageTotals.get(r.path) ?? 0) + r.count);
      perDayTotals.set(r.day, (perDayTotals.get(r.day) ?? 0) + r.count);
    }
    const topPages = [...perPageTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, views]) => ({ path, views }));
    const dailyViews = [...perDayTotals.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([day, views]) => ({ day, views }));

    // ── Recent activity (real, from license events) ─────────────────────────
    const events = await db
      .select({
        id: licenseEventsTable.id,
        userId: licenseEventsTable.userId,
        eventType: licenseEventsTable.eventType,
        eventMessage: licenseEventsTable.eventMessage,
        createdAt: licenseEventsTable.createdAt,
      })
      .from(licenseEventsTable)
      .orderBy(desc(licenseEventsTable.createdAt))
      .limit(15);
    const recentActivity = events.map((e) => ({
      id: e.id,
      type: e.eventType,
      user: e.userId,
      message: e.eventMessage,
      time: e.createdAt.toISOString(),
    }));

    res.json({
      overview: {
        totalUsers,
        paidUsers,
        freeUsers: totalUsers - paidUsers,
        totalRevenue,
        monthRevenue,
        pageViews: visitorRow?.value ?? 0,
        totalPdfs: pdfs.length,
        activePdfs,
        expiredPdfs,
        totalStorageBytes,
      },
      plans: planCounts,
      monthlyData,
      topPages,
      dailyViews,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load admin stats");
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

// ─── Product-key admin endpoints ──────────────────────────────────────────────

router.post(
  "/admin/product-keys/generate",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;

    const parsed = AdminGenerateProductKeysBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const {
      planName,
      count,
      maxActivations,
      expiresAt,
      notes,
    } = parsed.data;

    const durationDays = PLAN_DURATION_DAYS[planName];
    const slots = maxActivations ?? 1;

    try {
      const minted: Array<{
        id: number;
        rawKey: string;
        keyPrefix: string;
        planName: typeof planName;
        durationDays: number;
        maxActivations: number;
        expiresAt: string | null;
      }> = [];

      for (let i = 0; i < count; i++) {
        const rawKey = generateProductKey();
        const { hash, prefix } = hashProductKey(rawKey);
        const [row] = await db
          .insert(productKeysTable)
          .values({
            keyHash: hash,
            keyPrefix: prefix,
            planName,
            durationDays,
            maxActivations: slots,
            status: "active",
            expiresAt: expiresAt ?? null,
            notes: notes ?? null,
            createdBy: "admin",
          })
          .returning({
            id: productKeysTable.id,
            keyPrefix: productKeysTable.keyPrefix,
          });
        if (!row) throw new Error("Insert returned no row");
        minted.push({
          id: row.id,
          rawKey,
          keyPrefix: row.keyPrefix,
          planName,
          durationDays,
          maxActivations: slots,
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
        });
      }

      req.log.info(
        { planName, count, maxActivations: slots },
        "Admin minted product keys",
      );
      res.json({ keys: minted });
    } catch (err) {
      req.log.error({ err, planName }, "admin/product-keys/generate failed");
      res.status(500).json({ error: "Failed to generate keys" });
    }
  },
);

router.get(
  "/admin/product-keys",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;

    try {
      const rows = await adminListProductKeys();
      res.json({
        keys: rows.map((r) => ({
          id: r.id,
          keyPrefix: r.keyPrefix,
          planName: r.planName,
          durationDays: r.durationDays,
          maxActivations: r.maxActivations,
          currentActivations: r.currentActivations,
          status: r.status,
          expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
          notes: r.notes,
          createdAt: r.createdAt.toISOString(),
          revokedAt: r.revokedAt ? r.revokedAt.toISOString() : null,
        })),
      });
    } catch (err) {
      req.log.error({ err }, "admin/product-keys list failed");
      res.status(500).json({ error: "Failed to list product keys" });
    }
  },
);

router.post(
  "/admin/product-keys/revoke",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;

    const parsed = AdminRevokeProductKeyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    try {
      const row = await adminRevokeProductKey(parsed.data.id);
      if (!row) {
        res.status(404).json({ error: "Product key not found" });
        return;
      }
      req.log.info({ id: row.id }, "Admin revoked product key");
      res.json(row);
    } catch (err) {
      req.log.error({ err }, "admin/product-keys/revoke failed");
      res.status(500).json({ error: "Failed to revoke product key" });
    }
  },
);

router.post(
  "/admin/product-keys/extend",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;

    const parsed = AdminExtendProductKeyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    try {
      const row = await adminExtendProductKey(
        parsed.data.id,
        parsed.data.additionalDays,
      );
      if (!row) {
        res.status(404).json({ error: "Product key not found" });
        return;
      }
      req.log.info(
        { id: row.id, additionalDays: parsed.data.additionalDays },
        "Admin extended product key duration",
      );
      res.json(row);
    } catch (err) {
      req.log.error({ err }, "admin/product-keys/extend failed");
      res.status(500).json({ error: "Failed to extend product key" });
    }
  },
);

// ─── Customer / monthly-quota admin endpoints ─────────────────────────────────

router.get(
  "/admin/customers",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;
    try {
      const customers = await adminListCustomers();
      res.json({ customers });
    } catch (err) {
      req.log.error({ err }, "admin/customers list failed");
      res.status(500).json({ error: "Failed to list customers" });
    }
  },
);

router.post(
  "/admin/customers/quota-override",
  async (req: Request, res: Response): Promise<void> => {
    if (!checkAuth(req, res)) return;

    const body = req.body as { userId?: unknown; override?: unknown };
    const userId =
      typeof body.userId === "string" ? body.userId.trim() : "";
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }
    // `override`: null clears it (tier default), -1 = unlimited, otherwise a
    // non-negative integer monthly allowance.
    let override: number | null;
    if (body.override === null || body.override === undefined) {
      override = null;
    } else if (
      typeof body.override === "number" &&
      Number.isInteger(body.override) &&
      body.override >= -1
    ) {
      override = body.override;
    } else {
      res
        .status(400)
        .json({ error: "override must be null, -1 (unlimited), or a non-negative integer" });
      return;
    }

    try {
      const customer = await adminSetQuotaOverride(userId, override);
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      req.log.info({ userId, override }, "Admin set monthly quota override");
      res.json({ customer });
    } catch (err) {
      req.log.error({ err, userId }, "admin/customers/quota-override failed");
      res.status(500).json({ error: "Failed to set quota override" });
    }
  },
);

// ── Visitor analytics: daily unique visitors + locations (last N days) ───────
router.get("/admin/analytics/visitors", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  const raw = Number(req.query["days"]);
  const days = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 90) : 30;
  try {
    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const perDay = await db
      .select({
        day: dailyVisitorsTable.day,
        visitors: sql<number>`count(*)::int`,
      })
      .from(dailyVisitorsTable)
      .where(gte(dailyVisitorsTable.day, since))
      .groupBy(dailyVisitorsTable.day)
      .orderBy(dailyVisitorsTable.day);

    const byDayLocation = await db
      .select({
        day: dailyVisitorsTable.day,
        country: dailyVisitorsTable.country,
        city: dailyVisitorsTable.city,
        visitors: sql<number>`count(*)::int`,
      })
      .from(dailyVisitorsTable)
      .where(gte(dailyVisitorsTable.day, since))
      .groupBy(dailyVisitorsTable.day, dailyVisitorsTable.country, dailyVisitorsTable.city)
      .orderBy(dailyVisitorsTable.day, sql`count(*) desc`);

    const byLocation = await db
      .select({
        country: dailyVisitorsTable.country,
        city: dailyVisitorsTable.city,
        visitors: sql<number>`count(*)::int`,
      })
      .from(dailyVisitorsTable)
      .where(gte(dailyVisitorsTable.day, since))
      .groupBy(dailyVisitorsTable.country, dailyVisitorsTable.city)
      .orderBy(sql`count(*) desc`)
      .limit(100);

    // Fill in zero-visitor days so charts show a continuous range.
    const dayMap = new Map(perDay.map((d) => [d.day, d.visitors]));
    const filled: { day: string; visitors: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      filled.push({ day, visitors: dayMap.get(day) ?? 0 });
    }

    const dayLocations: Record<
      string,
      { country: string; city: string; visitors: number }[]
    > = {};
    for (const row of byDayLocation) {
      (dayLocations[row.day] ??= []).push({
        country: row.country ?? "Unknown",
        city: row.city ?? "Unknown",
        visitors: row.visitors,
      });
    }

    res.json({
      days: filled,
      locations: byLocation.map((l) => ({
        country: l.country ?? "Unknown",
        city: l.city ?? "Unknown",
        visitors: l.visitors,
      })),
      dayLocations,
    });
  } catch (err) {
    req.log.error({ err }, "admin/analytics/visitors failed");
    res.status(500).json({ error: "Failed to load visitor analytics" });
  }
});

// ─── Support tickets ─────────────────────────────────────────────────────────

// ─── Developer registration ──────────────────────────────────────────────────
// Developers (dev-passphrase gate) are keyed by email in the `developers`
// table. There is no public management UI; this admin-token route is the
// supported way to register a developer email in any environment.

router.get("/admin/developers", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  const rows = await db.execute(
    sql`SELECT email, created_at FROM developers ORDER BY created_at`,
  );
  res.json({ developers: rows.rows });
});

router.post("/admin/developers", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  await db.execute(sql`
    INSERT INTO developers (email) VALUES (${email})
    ON CONFLICT (email) DO NOTHING
  `);
  req.log.info({ email }, "developer email registered via admin route");
  res.json({ ok: true, email });
});

router.post("/admin/developers/remove", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  await db.execute(sql`DELETE FROM developers WHERE email = ${email}`);
  req.log.info({ email }, "developer email removed via admin route");
  res.json({ ok: true, email });
});

router.get("/admin/tickets", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  try {
    const tickets = await listTickets();
    res.json({ tickets });
  } catch (err) {
    req.log.error({ err }, "admin/tickets list failed");
    res.status(500).json({ error: "Failed to load tickets" });
  }
});

router.post("/admin/tickets/update", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const id = Number(body["id"]);
  const status = typeof body["status"] === "string" ? body["status"] : undefined;
  const adminReply = typeof body["adminReply"] === "string" ? body["adminReply"] : undefined;
  if (!Number.isInteger(id) || id <= 0 || (status === undefined && adminReply === undefined)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const patch: { status?: string; adminReply?: string } = {};
    if (status !== undefined) patch.status = status;
    if (adminReply !== undefined) patch.adminReply = adminReply;
    const ticket = await updateTicket(id, patch);
    if (!ticket) {
      res.status(400).json({ error: "Ticket not found or invalid status" });
      return;
    }
    res.json({ ticket });
  } catch (err) {
    req.log.error({ err }, "admin/tickets update failed");
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

export default router;
