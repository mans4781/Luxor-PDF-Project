import type { NextFunction, Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { isDeveloperUser } from "./devVerification";

const ADMIN_EMAIL = (process.env["ADMIN_EMAIL"] ?? "").trim().toLowerCase();

/** Cache userId → reserved? so we don't call Clerk on every request. */
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { reserved: boolean; expiresAt: number }>();

async function isReservedAdminUser(userId: string): Promise<boolean> {
  if (!ADMIN_EMAIL) return false;
  const now = Date.now();
  const hit = cache.get(userId);
  if (hit && now < hit.expiresAt) return hit.reserved;
  const user = await clerkClient.users.getUser(userId);
  const reserved = user.emailAddresses.some(
    (e) => e.emailAddress.trim().toLowerCase() === ADMIN_EMAIL,
  );
  cache.set(userId, { reserved, expiresAt: now + CACHE_TTL_MS });
  return reserved;
}

/**
 * The admin/developer email is reserved for the admin dashboard login and
 * must not function as a regular user account. If a Clerk session belongs
 * to that email, every user-facing API call is refused.
 *
 * Fails open on Clerk lookup errors so a transient Clerk outage cannot take
 * down the API for everyone (this is a business rule, not a security
 * boundary — admin privileges are never derived from a Clerk session).
 */
export function blockReservedAdminEmail() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // Admin dashboard routes authenticate via x-admin-token, not Clerk —
    // never block them even if a stray Clerk session cookie is present.
    if (req.path.startsWith("/admin")) {
      next();
      return;
    }
    const { userId } = getAuth(req);
    if (!userId) {
      next();
      return;
    }
    let reserved: boolean;
    try {
      reserved = await isReservedAdminUser(userId);
    } catch (err) {
      // Can't tell whether the account is reserved (Clerk hiccup). This is
      // a business rule for regular accounts, so fail open here — but the
      // developer gate below still fails closed for known developers.
      req.log.warn({ err, userId }, "reserved-admin-email check failed");
      next();
      return;
    }
    if (!reserved) {
      next();
      return;
    }
    // If the reserved email is also a registered developer account, it may
    // sign in as a user — the developer two-passphrase gate
    // (requireDevVerification) enforces the extra protection instead. A
    // failed developer lookup for the reserved account fails CLOSED.
    try {
      if (await isDeveloperUser(userId)) {
        next();
        return;
      }
    } catch (err) {
      req.log.error({ err, userId }, "developer lookup failed for reserved admin — blocking");
    }
    res.status(403).json({
      error:
        "This email is reserved for admin access and cannot be used as a user account.",
      code: "reserved_admin_email",
    });
  };
}
