import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { getAuth, clerkClient } from "@clerk/express";
import {
  InviteOrgMemberBody,
  RevokeOrgInviteBody,
  AcceptOrgInviteBody,
  RemoveOrgMemberBody,
  ActivateOrgDeviceBody,
  DeactivateOrgDeviceBody,
} from "@workspace/api-zod";
import {
  getOrgSummaryForAdmin,
  inviteMember,
  revokeInvite,
  acceptInvite,
  removeMember,
  activateOrgDevice,
  deactivateOrgDevice,
  type OrgRole,
} from "../lib/org";
import { sendInviteEmail } from "../lib/email";

const router: IRouter = Router();

function requireUserId(req: Request, res: Response): string | null {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in" });
    return null;
  }
  return auth.userId;
}

/** Best-effort Clerk primary email + display name lookup. */
async function lookupClerkIdentity(
  userId: string,
): Promise<{ email: string | null; name: string | null }> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary =
      user.emailAddresses.find((e) => e.id === primaryId) ??
      user.emailAddresses[0];
    const composed = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return { email: primary?.emailAddress ?? null, name: composed || null };
  } catch {
    return { email: null, name: null };
  }
}

/** Absolute origin (proto + host) of the current request. */
function requestOrigin(req: Request): string {
  const host = req.get("host");
  const proto =
    (req.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
    (req.secure ? "https" : "http");
  return host ? `${proto}://${host}` : "";
}

// ─── GET /org ─────────────────────────────────────────────────────────────────

router.get("/org", async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  try {
    const summary = await getOrgSummaryForAdmin(userId);
    if (!summary) {
      res.status(404).json({ error: "No organization" });
      return;
    }
    res.json(summary);
  } catch (err) {
    req.log.error({ err, userId }, "org/get failed");
    res.status(500).json({ error: "Failed to load organization" });
  }
});

// ─── POST /org/invite ─────────────────────────────────────────────────────────

router.post("/org/invite", async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = InviteOrgMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const role: OrgRole = parsed.data.role === "admin" ? "admin" : "member";

  try {
    const outcome = await inviteMember(userId, parsed.data.email, role);
    if (!outcome.ok) {
      const status = outcome.error === "no_org" ? 403 : 409;
      res.status(status).json({ error: outcome.error });
      return;
    }

    const { invite, rawToken, org } = outcome.result;
    const inviter = await lookupClerkIdentity(userId);
    const acceptUrl = `${requestOrigin(req)}/app/accept-invite?token=${encodeURIComponent(rawToken)}`;
    const emailSent = await sendInviteEmail({
      to: invite.email,
      orgName: org.name,
      inviterName: inviter.name,
      acceptUrl,
      expiresAt: invite.expiresAt.toISOString(),
    });

    req.log.info(
      { userId, orgId: org.id, inviteId: invite.id, emailSent },
      "Org invite created",
    );
    res.json({
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      emailSent,
    });
  } catch (err) {
    req.log.error({ err, userId }, "org/invite failed");
    res.status(500).json({ error: "Failed to create invite" });
  }
});

// ─── POST /org/revoke-invite ──────────────────────────────────────────────────

router.post(
  "/org/revoke-invite",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = RevokeOrgInviteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const outcome = await revokeInvite(userId, parsed.data.inviteId);
      if (!outcome.ok) {
        const status = outcome.error === "no_org" ? 403 : 404;
        res.status(status).json({ error: outcome.error });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err, userId }, "org/revoke-invite failed");
      res.status(500).json({ error: "Failed to revoke invite" });
    }
  },
);

// ─── POST /org/accept-invite ──────────────────────────────────────────────────

router.post(
  "/org/accept-invite",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = AcceptOrgInviteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const identity = await lookupClerkIdentity(userId);
      const outcome = await acceptInvite(
        parsed.data.token,
        userId,
        identity.email,
      );
      if (!outcome.ok) {
        const status = outcome.error === "seats_full" ? 409 : 400;
        res.status(status).json({ error: outcome.error });
        return;
      }
      req.log.info(
        { userId, orgId: outcome.result.org.id },
        "Org invite accepted",
      );
      res.json({
        orgName: outcome.result.org.name,
        role: outcome.result.role,
      });
    } catch (err) {
      req.log.error({ err, userId }, "org/accept-invite failed");
      res.status(500).json({ error: "Failed to accept invite" });
    }
  },
);

// ─── POST /org/remove-member ──────────────────────────────────────────────────

router.post(
  "/org/remove-member",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = RemoveOrgMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const outcome = await removeMember(userId, parsed.data.userId);
      if (!outcome.ok) {
        const status =
          outcome.error === "no_org"
            ? 403
            : outcome.error === "cannot_remove_owner"
              ? 400
              : 404;
        res.status(status).json({ error: outcome.error });
        return;
      }
      req.log.info(
        { userId, targetUserId: parsed.data.userId },
        "Org member removed",
      );
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err, userId }, "org/remove-member failed");
      res.status(500).json({ error: "Failed to remove member" });
    }
  },
);

// ─── POST /org/activate-device ────────────────────────────────────────────────

router.post(
  "/org/activate-device",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = ActivateOrgDeviceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { deviceId, deviceName, os } = parsed.data;

    try {
      const outcome = await activateOrgDevice(
        userId,
        deviceId,
        deviceName ?? null,
        os ?? null,
      );
      if (!outcome.ok) {
        const status = outcome.error === "no_membership" ? 403 : 409;
        res.status(status).json({ error: outcome.error });
        return;
      }
      res.json(outcome.result);
    } catch (err) {
      req.log.error({ err, userId }, "org/activate-device failed");
      res.status(500).json({ error: "Failed to activate device" });
    }
  },
);

// ─── POST /org/deactivate-device ──────────────────────────────────────────────

router.post(
  "/org/deactivate-device",
  async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const parsed = DeactivateOrgDeviceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const outcome = await deactivateOrgDevice(
        userId,
        parsed.data.userId,
        parsed.data.deviceId,
      );
      if (!outcome.ok) {
        const status = outcome.error === "no_org" ? 403 : 404;
        res.status(status).json({ error: outcome.error });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err, userId }, "org/deactivate-device failed");
      res.status(500).json({ error: "Failed to deactivate device" });
    }
  },
);

export default router;
