import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import {
  ActivateLicenseBody,
  VerifyProductKeyBody,
  RenewLicenseBody,
  DeactivateDeviceBody,
} from "@workspace/api-zod";
import {
  buildAnonymousStatus,
  getLicenseStatus,
  activateLicense,
  verifyProductKey,
  renewLicense,
  deactivateDeviceLicense,
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

// ─── Product-key activation ───────────────────────────────────────────────────

router.post(
  "/license/activate",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = ActivateLicenseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { productKey, deviceId, deviceName, os } = parsed.data;

    try {
      const outcome = await activateLicense({
        userId,
        productKey,
        deviceId,
        deviceName: deviceName ?? null,
        os: os ?? null,
      });

      if (!outcome.ok) {
        const { kind } = outcome.error;
        const status =
          kind === "malformed"
            ? 400
            : kind === "not_found"
              ? 404
              : 409;
        res.status(status).json({ error: kind });
        return;
      }

      const r = outcome.result;
      req.log.info(
        {
          userId,
          licenseId: r.licenseId,
          planName: r.planName,
          deviceId,
        },
        "License activated",
      );
      res.json({
        licenseId: r.licenseId,
        planName: r.planName,
        subscriptionStartDate: r.subscriptionStartDate.toISOString(),
        subscriptionEndDate: r.subscriptionEndDate.toISOString(),
        slotsRemaining: r.slotsRemaining,
      });
    } catch (err) {
      req.log.error({ err, userId }, "license/activate failed");
      res.status(500).json({ error: "Failed to activate license" });
    }
  },
);

// ─── Product-key verification (read-only) ─────────────────────────────────────

router.post(
  "/license/verify-product-key",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = VerifyProductKeyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const result = await verifyProductKey(parsed.data.productKey, userId);
      res.json(result);
    } catch (err) {
      req.log.error({ err, userId }, "license/verify-product-key failed");
      res.status(500).json({ error: "Failed to verify product key" });
    }
  },
);

// ─── Renewal ──────────────────────────────────────────────────────────────────

router.post(
  "/license/renew",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = RenewLicenseBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { licenseId, productKey } = parsed.data;

    try {
      const outcome = await renewLicense(userId, licenseId, productKey);
      if (!outcome.ok) {
        const { kind } = outcome.error;
        const status =
          kind === "license_not_found" || kind === "not_found"
            ? 404
            : kind === "malformed"
              ? 400
              : 409;
        res.status(status).json({ error: kind });
        return;
      }
      req.log.info(
        {
          userId,
          licenseId: outcome.result.licenseId,
          newEnd: outcome.result.subscriptionEndDate.toISOString(),
        },
        "License renewed",
      );
      res.json({
        licenseId: outcome.result.licenseId,
        subscriptionEndDate: outcome.result.subscriptionEndDate.toISOString(),
      });
    } catch (err) {
      req.log.error({ err, userId }, "license/renew failed");
      res.status(500).json({ error: "Failed to renew license" });
    }
  },
);

// ─── Device deactivation ──────────────────────────────────────────────────────

router.post(
  "/license/deactivate-device",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = DeactivateDeviceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const outcome = await deactivateDeviceLicense(
        userId,
        parsed.data.licenseId,
      );
      if (!outcome.ok) {
        res.status(404).json({ error: outcome.error.kind });
        return;
      }
      req.log.info(
        { userId, licenseId: outcome.result.licenseId },
        "Device deactivated",
      );
      res.json(outcome.result);
    } catch (err) {
      req.log.error({ err, userId }, "license/deactivate-device failed");
      res.status(500).json({ error: "Failed to deactivate device" });
    }
  },
);

export default router;
