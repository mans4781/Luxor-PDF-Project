import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { buildAnonymousStatus, getLicenseStatus } from "../lib/license";

const router: IRouter = Router();

router.get("/license/status", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth.userId ?? null;

  try {
    const status = await getLicenseStatus(userId);
    res.json(status);
  } catch (err) {
    req.log.error({ err, userId }, "license/status failed");
    // Fail closed: if we can't compute status, return a 200 with an
    // anonymous-style locked payload so the client never silently allows
    // tools. The spec advertises this endpoint as always-200.
    res.status(200).json({
      ...buildAnonymousStatus(),
      lockReason: "not_logged_in",
    });
  }
});

export default router;
