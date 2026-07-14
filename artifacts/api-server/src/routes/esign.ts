import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { sql, eq } from "drizzle-orm";
import { db, esignWaitlistTable } from "@workspace/db";

const router: IRouter = Router();

// ─── Idempotent startup migration ─────────────────────────────────────────────

export async function runEsignMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS esign_waitlist (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * GET /esign/waitlist — is the signed-in user already on the eSign
 * early-access waitlist?
 */
router.get("/esign/waitlist", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  try {
    const rows = await db
      .select({ userId: esignWaitlistTable.userId })
      .from(esignWaitlistTable)
      .where(eq(esignWaitlistTable.userId, auth.userId))
      .limit(1);
    res.json({ joined: rows.length > 0 });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "esign waitlist status failed");
    res.status(500).json({ error: "Failed to check waitlist status" });
  }
});

/**
 * POST /esign/waitlist — join the eSign early-access waitlist. Idempotent:
 * repeat calls are no-ops.
 */
router.post("/esign/waitlist", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";
    await db
      .insert(esignWaitlistTable)
      .values({ userId: auth.userId, email })
      .onConflictDoNothing();
    res.json({ joined: true });
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "esign waitlist join failed");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

export default router;
