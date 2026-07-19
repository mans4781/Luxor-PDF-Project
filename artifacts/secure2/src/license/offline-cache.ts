import type { LicenseStatus } from "@workspace/api-client-react";

/**
 * Persisted last-known license snapshot used when the device is offline (no
 * connectivity to the API). Lets us continue to enforce subscription expiry
 * even when the network is unavailable — critical for the Electron desktop
 * app where a user could otherwise pay for one month, expire, then unplug
 * the network and use the app forever.
 */

const KEY = "luxor.lastLicenseStatus";
const SERVER_CLOCK_KEY = "luxor.lastServerTime";

/**
 * How long we trust a cached status before forcing the user back online.
 * 7 days mirrors the "grace period" copy used elsewhere in the suite and
 * matches the spec's offline-grace requirement.
 */
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedStatus {
  /** Whole status payload as returned by GET /api/license/status. */
  status: LicenseStatus;
  /** `Date.now()` on the client when we received it. */
  cachedAt: number;
}

export function readCachedStatus(): CachedStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStatus;
    if (
      !parsed ||
      typeof parsed.cachedAt !== "number" ||
      !parsed.status ||
      typeof parsed.status !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedStatus(status: LicenseStatus): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedStatus = { status, cachedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    // Track the highest server time we've ever seen so we can detect clock
    // rewinds (a user setting the system clock back to before expiry).
    const prev = Number(window.localStorage.getItem(SERVER_CLOCK_KEY) ?? "0");
    const serverMs = Date.parse(status.serverTime);
    if (Number.isFinite(serverMs) && serverMs > prev) {
      window.localStorage.setItem(SERVER_CLOCK_KEY, String(serverMs));
    }
  } catch {
    // ignore quota errors — offline enforcement is best-effort.
  }
}

export function readHighestServerTime(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(SERVER_CLOCK_KEY);
  const n = Number(raw ?? "0");
  return Number.isFinite(n) ? n : 0;
}

/**
 * Client-side lock reasons that don't come from the server. Keeping them
 * separate from the OpenAPI `LicenseLockReason` enum avoids dragging the
 * spec into purely UI concerns.
 */
export type ClientLockReason =
  | "offline_too_long"
  | "clock_tampered";

export interface EffectiveLicenseState {
  /** Status to render — live when available, else the cached snapshot. */
  status: LicenseStatus | undefined;
  /** True when the latest live fetch failed and we're showing cached data. */
  usingCache: boolean;
  /** Set when we're forcing a lock that didn't come from the server. */
  clientLockReason: ClientLockReason | null;
  /**
   * Convenience: the effective lock reason (server's reason promoted to a
   * client-side `subscription_expired` if the cached subscription has
   * lapsed since the last fetch).
   */
  effectiveLockReason:
    | LicenseStatus["lockReason"]
    | ClientLockReason
    | undefined;
}

/**
 * Pure helper used by `LicenseProvider` to derive the effective state given
 * the latest fetched status, the cached snapshot, and the offline flag.
 *
 * Rules:
 * - When live status is available → use it; cache it. No client lock.
 * - When offline AND cached → use the cached status until grace expires:
 *     - If `subscriptionEndDate` in the cache has now passed, treat as
 *       `subscription_expired` immediately (the desktop user can no
 *       longer claim "I'm offline" to dodge a known expiry).
 *     - If cache age > 7 days → `offline_too_long` (force re-validation).
 *     - If `Date.now()` is earlier than the last server time we ever saw
 *       (system clock was rolled back) → `clock_tampered`.
 * - When offline AND no cache → no client lock (status undefined; existing
 *   behaviour preserved for first-run users with no internet).
 */
export function deriveEffectiveState(args: {
  liveStatus: LicenseStatus | undefined;
  cached: CachedStatus | null;
  offline: boolean;
  now?: number;
  highestServerTime?: number;
}): EffectiveLicenseState {
  const now = args.now ?? Date.now();
  const highestServerTime =
    args.highestServerTime ?? readHighestServerTime();

  if (args.liveStatus) {
    return {
      status: args.liveStatus,
      usingCache: false,
      clientLockReason: null,
      effectiveLockReason: args.liveStatus.lockReason,
    };
  }

  if (!args.offline || !args.cached) {
    return {
      status: undefined,
      usingCache: false,
      clientLockReason: null,
      effectiveLockReason: undefined,
    };
  }

  const cached = args.cached;

  // Detect a rolled-back system clock vs. the last server time we recorded.
  // Allow a small skew to avoid false positives.
  const SKEW_MS = 2 * 60 * 60 * 1000; // 2h
  if (highestServerTime > 0 && now + SKEW_MS < highestServerTime) {
    return {
      status: cached.status,
      usingCache: true,
      clientLockReason: "clock_tampered",
      effectiveLockReason: "clock_tampered",
    };
  }

  // Cache too old → force re-validation.
  const age = now - cached.cachedAt;
  if (age > OFFLINE_GRACE_MS) {
    return {
      status: cached.status,
      usingCache: true,
      clientLockReason: "offline_too_long",
      effectiveLockReason: "offline_too_long",
    };
  }

  // Subscription end date in the cache has now passed locally. The user
  // had a paid sub when last seen, but their plan would have lapsed by
  // wall-clock time alone. Promote to subscription_expired locally.
  // Mirrors the server's 5-day post-expiry grace window: only lock offline
  // once the grace window (end + 5 days) has also passed.
  const EXPIRY_GRACE_MS = 5 * 24 * 60 * 60 * 1000;
  const subEndIso = cached.status.subscriptionEndDate;
  if (subEndIso) {
    const subEnd = Date.parse(subEndIso);
    if (
      Number.isFinite(subEnd) &&
      subEnd + EXPIRY_GRACE_MS <= now &&
      cached.status.lockReason !== "subscription_expired"
    ) {
      return {
        status: {
          ...cached.status,
          lockReason: "subscription_expired",
          subscriptionActive: false,
          subscriptionExpired: true,
          canUsePdfTools: false,
        },
        usingCache: true,
        clientLockReason: null,
        effectiveLockReason: "subscription_expired",
      };
    }
  }

  return {
    status: cached.status,
    usingCache: true,
    clientLockReason: null,
    effectiveLockReason: cached.status.lockReason,
  };
}
