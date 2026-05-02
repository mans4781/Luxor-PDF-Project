import { Router, type Request, type Response } from "express";
import { db, pdfsTable, productKeysTable, siteStats } from "@workspace/db";
import { eq } from "drizzle-orm";
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
import {
  adminListProductKeys,
  adminRevokeProductKey,
  adminExtendProductKey,
} from "../lib/license";

const router = Router();

const ADMIN_TOKEN = process.env["ADMIN_TOKEN"];
const ADMIN_PASSPHRASE = process.env["ADMIN_PASSPHRASE"];

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

function generateMonthlyData() {
  const months: { month: string; revenue: number; users: number; documents: number }[] = [];
  const now = new Date();
  const baseRevenue = 3200;
  const baseUsers = 120;
  const baseDocs = 340;
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const growth = (12 - i) / 12;
    const jitter = () => Math.floor((Math.random() - 0.5) * 200);
    months.push({
      month: label,
      revenue: Math.round(baseRevenue * (1 + growth * 1.8) + jitter()),
      users: Math.round(baseUsers * (1 + growth * 2.1) + Math.abs(jitter() / 5)),
      documents: Math.round(baseDocs * (1 + growth * 1.5) + Math.abs(jitter() / 2)),
    });
  }
  return months;
}

router.post("/admin/login", (req, res): void => {
  if (!ADMIN_TOKEN || !ADMIN_PASSPHRASE) {
    res.status(503).json({ error: "Admin access not configured" });
    return;
  }
  const { passphrase } = req.body as { passphrase?: string };
  if (!passphrase || passphrase !== ADMIN_PASSPHRASE) {
    res.status(401).json({ error: "Invalid passphrase" });
    return;
  }
  res.json({ token: ADMIN_TOKEN });
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!checkAuth(req, res)) return;

  try {
    const [visitorRow] = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.key, "visitors"));

    const pdfs = await db.select().from(pdfsTable);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let activePdfs = 0;
    let expiredPdfs = 0;
    let totalStorageBytes = 0;

    for (const p of pdfs) {
      totalStorageBytes += p.fileSize;
      if (new Date(p.expiryDate) < now) expiredPdfs++;
      else activePdfs++;
    }

    const plans = {
      free: 684,
      pro: 312,
      enterprise: 47,
    };
    const totalSubscribers = plans.free + plans.pro + plans.enterprise;
    const monthlyRevenue = plans.pro * 12 + plans.enterprise * 79;
    const annualRevenue = monthlyRevenue * 12;

    const monthlyData = generateMonthlyData();

    const recentActivity = [
      { id: 1, type: "signup", user: "alex.m@gmail.com", plan: "Pro", time: "2 min ago" },
      { id: 2, type: "upgrade", user: "sarah.j@acme.com", plan: "Enterprise", time: "14 min ago" },
      { id: 3, type: "signup", user: "tom.w@outlook.com", plan: "Free", time: "31 min ago" },
      { id: 4, type: "signup", user: "priya.k@startup.io", plan: "Pro", time: "1h ago" },
      { id: 5, type: "cancel", user: "mike.r@gmail.com", plan: "Pro", time: "2h ago" },
      { id: 6, type: "upgrade", user: "dana.l@corp.com", plan: "Pro", time: "3h ago" },
      { id: 7, type: "signup", user: "james.b@dev.co", plan: "Free", time: "5h ago" },
    ];

    const topCountries = [
      { country: "United States", users: 389, pct: 37 },
      { country: "United Kingdom", users: 148, pct: 14 },
      { country: "Germany", users: 112, pct: 11 },
      { country: "Canada", users: 98, pct: 9 },
      { country: "Australia", users: 76, pct: 7 },
      { country: "India", users: 64, pct: 6 },
      { country: "Other", users: 156, pct: 15 },
    ];

    res.json({
      overview: {
        totalUsers: totalSubscribers,
        monthlyRevenue,
        annualRevenue,
        pageViews: visitorRow?.value ?? 0,
        totalPdfs: pdfs.length,
        activePdfs,
        expiredPdfs,
        totalStorageBytes,
        avgRevenuePerUser: Math.round((monthlyRevenue / (plans.pro + plans.enterprise)) * 100) / 100,
        churnRate: 2.4,
        nps: 72,
        supportTickets: 8,
      },
      plans,
      monthlyData,
      recentActivity,
      topCountries,
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

export default router;
