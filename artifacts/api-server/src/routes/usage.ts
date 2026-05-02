import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { CheckUsageBody, RecordUsageBody } from "@workspace/api-zod";
import {
  getLicenseStatus,
  getTodayUsage,
  recordUsage,
  todayUtcDate,
  TRIAL_DAILY_LIMIT,
} from "../lib/license";

const router: IRouter = Router();

function requireUserId(req: Request, res: Response): string | null {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  return auth.userId;
}

router.post("/usage/check", async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = CheckUsageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const status = await getLicenseStatus(userId);
    res.json({
      allowed: status.canUsePdfTools,
      lockReason: status.lockReason,
      todayUsage: status.todayUsage,
      dailyLimit: status.dailyLimit,
    });
  } catch (err) {
    req.log.error({ err, userId }, "usage/check failed");
    res.status(500).json({ error: "Failed to check usage" });
  }
});

router.post("/usage/record", async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = RecordUsageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { actionType, fileCount } = parsed.data;

  try {
    const outcome = await recordUsage(userId, actionType, fileCount);
    if (!outcome.recorded) {
      // Action was blocked — return 403 with the same body shape so the
      // client can show the correct lock UI without parsing two payloads.
      res.status(403).json(outcome);
      return;
    }
    req.log.info(
      {
        userId,
        actionType,
        fileCount,
        todayUsage: outcome.todayUsage,
        dailyLimit: outcome.dailyLimit,
      },
      "Usage recorded",
    );
    res.json(outcome);
  } catch (err) {
    req.log.error({ err, userId, actionType }, "usage/record failed");
    res.status(500).json({ error: "Failed to record usage" });
  }
});

router.get("/usage/today", async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const status = await getLicenseStatus(userId);
    const usage = await getTodayUsage(userId);
    res.json({
      usageDate: todayUtcDate(),
      editCount: usage?.editCount ?? 0,
      convertCount: usage?.convertCount ?? 0,
      secureCount: usage?.secureCount ?? 0,
      totalCount: usage?.totalCount ?? 0,
      dailyLimit: status.dailyLimit,
    });
  } catch (err) {
    req.log.error({ err, userId }, "usage/today failed");
    res.status(500).json({
      usageDate: todayUtcDate(),
      editCount: 0,
      convertCount: 0,
      secureCount: 0,
      totalCount: 0,
      dailyLimit: TRIAL_DAILY_LIMIT,
    });
  }
});

export default router;
