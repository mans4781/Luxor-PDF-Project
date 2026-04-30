import { Router } from "express";
import { db, pdfsTable, siteStats } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const ADMIN_TOKEN = process.env["ADMIN_TOKEN"];
const ADMIN_PASSPHRASE = process.env["ADMIN_PASSPHRASE"];

function checkAuth(req: any, res: any): boolean {
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

export default router;
