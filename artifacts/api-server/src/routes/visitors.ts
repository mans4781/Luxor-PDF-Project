import { Router } from "express";
import { db, siteStats } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

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
