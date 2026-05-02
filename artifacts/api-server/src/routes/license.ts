import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import {
  buildAnonymousStatus,
  getLicenseStatus,
  logEvent,
} from "../lib/license";

const router: IRouter = Router();

router.get("/license/status", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth.userId ?? null;

  try {
    const status = await getLicenseStatus(userId);

    // First-time observation that the trial has lapsed for this user — log once.
    if (userId && status.licenseStatus === "trial_expired") {
      // Best-effort log; logEvent itself swallows failures.
      void logEvent(userId, "trial_expired_observed", "Status check found trial lapsed");
    }

    res.json(status);
  } catch (err) {
    req.log.error({ err, userId }, "license/status failed");
    // Fail closed: if we can't compute status, return an anonymous-style
    // payload so the client locks tools rather than silently allowing them.
    res.status(500).json({
      ...buildAnonymousStatus(),
      lockReason: "not_logged_in",
    });
  }
});

export default router;
