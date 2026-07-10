import { and, desc, eq, ne, sql } from "drizzle-orm";
import {
  db,
  userLicensesTable,
  dailyUsageTable,
  monthlyUsageTable,
  licenseEventsTable,
  productKeysTable,
  licensesTable,
  devicesTable,
  type UserLicense,
  type DailyUsage,
  type MonthlyUsage,
  type License,
  type ProductKey,
} from "@workspace/db";
import type { PdfActionType } from "@workspace/api-zod";
import {
  hashProductKey,
  isWellFormedProductKey,
  isProductPlan,
  PLAN_DURATION_DAYS,
  type ProductPlan,
} from "@workspace/license-keys";
import { logger } from "./logger";
import { getActiveOrgMembership } from "./org";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRIAL_DAYS = 14;
export const TRIAL_DAILY_LIMIT = 2;
// Effectively unlimited for paid users — using a large finite number so the
// value serializes cleanly through JSON / zod number().
export const PAID_DAILY_LIMIT = 1_000_000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Development-only license bypass ─────────────────────────────────────────
//
// In the local dev workspace, every signed-in user is treated as fully
// licensed so developers can exercise paid features without minting keys.
//
// SAFETY: this must NEVER activate in production. `REPLIT_DEPLOYMENT` is set
// on published Replit deployments, and we additionally require NODE_ENV to
// not be "production". The NODE_ENV check alone is NOT sufficient because
// deployments may run without NODE_ENV=production — hence the double gate.
export const DEV_LICENSE_BYPASS =
  !process.env.REPLIT_DEPLOYMENT && process.env.NODE_ENV !== "production";

if (DEV_LICENSE_BYPASS) {
  logger.warn(
    "DEV license bypass ACTIVE — all signed-in users are treated as fully licensed. This never runs on published deployments.",
  );
}

// ─── Metered secure-feature monthly quotas ────────────────────────────────────
//
// Two metered buckets reset every billing month:
//   - "password": Password Protect (password_protect)
//   - "secure":   Secure PDF / Expiry (set_expiry, revoke_expiry,
//                 copy_restriction, print_restriction)
//
// `null` means unlimited. Quotas are chosen by the user's plan tier and can be
// overridden per-customer by an admin (Enterprise custom contracts / one-off
// increases). The admin override sentinel `-1` also means unlimited.
export type PlanTier = "individual" | "team" | "business" | "enterprise";
// Which monthly sub-counter a secure action increments. Both sub-counters
// share ONE monthly pool (the limit is enforced against their sum); the split
// only exists so the admin dashboard can show a per-feature breakdown.
export type MeteredFeature = "password" | "secure";

export const UNLIMITED_QUOTA_SENTINEL = -1;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LicenseStatusValue =
  | "anonymous"
  | "trial"
  | "trial_expired"
  | "active"
  | "expired"
  | "suspended";

export type LicenseLockReason =
  | "none"
  | "not_logged_in"
  | "trial_expired"
  | "subscription_required"
  | "subscription_expired"
  | "daily_limit_reached"
  | "monthly_limit_reached"
  | "account_suspended"
  | "premium_feature";

/**
 * Per-billing-month usage summary for the shared secure-features pool. All
 * secure actions (password protect + expiry + print/copy restriction) draw
 * from ONE monthly allowance: `used` (= sum of the sub-counters) is enforced
 * against `limit`. The `passwordProtectUsed` / `securePdfUsed` sub-counters are
 * carried only so the admin dashboard can show a per-feature breakdown.
 */
export interface MonthlyUsageSummary {
  /** ISO 8601 start of the current billing month; null if not signed in. */
  periodStart: string | null;
  /** ISO 8601 reset date (next billing-month anniversary); null if anonymous. */
  periodEnd: string | null;
  /** Shared-pool usage this billing month (passwordProtectUsed + securePdfUsed). */
  used: number;
  /** Shared monthly limit; null = unlimited. */
  limit: number | null;
  /** Remaining shared-pool actions; null = unlimited. */
  remaining: number | null;
  /** Breakdown: Password Protect actions this month. */
  passwordProtectUsed: number;
  /** Breakdown: Expiry / print-copy restriction actions this month. */
  securePdfUsed: number;
}

export interface LicenseStatusResult {
  loggedIn: boolean;
  trialActive: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  todayUsage: number;
  dailyLimit: number;
  isPaid: boolean;
  planName: string | null;
  subscriptionActive: boolean;
  subscriptionDaysRemaining: number | null;
  subscriptionExpired: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  licenseStatus: LicenseStatusValue;
  canUsePdfTools: boolean;
  lockReason: LicenseLockReason;
  monthlyUsage: MonthlyUsageSummary;
  serverTime: string;
  /** True only when the dev-workspace license bypass is active. */
  devBypass?: boolean;
}

export type UsageCategory = "edit" | "convert" | "secure";

// ─── Idempotent startup migration ─────────────────────────────────────────────

/**
 * Creates the license-related tables if they don't already exist. Mirrors
 * the runPdfMigrations() pattern so deployments don't need a manual
 * `drizzle-kit push` step before the API can serve license traffic.
 *
 * Order matters when (later) FKs are added: parents (user_licenses,
 * product_keys, devices) before children (licenses, license_events).
 */
export async function runLicenseMigrations(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_licenses (
        user_id TEXT PRIMARY KEY,
        trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        plan_name TEXT,
        account_status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daily_usage (
        user_id TEXT NOT NULL,
        usage_date DATE NOT NULL,
        edit_count INTEGER NOT NULL DEFAULT 0,
        convert_count INTEGER NOT NULL DEFAULT 0,
        secure_count INTEGER NOT NULL DEFAULT 0,
        total_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, usage_date)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS daily_usage_user_id_idx ON daily_usage(user_id)
    `);

    // Per-billing-month usage of the two metered secure features.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monthly_usage (
        user_id TEXT NOT NULL,
        period_start DATE NOT NULL,
        password_protect_count INTEGER NOT NULL DEFAULT 0,
        secure_pdf_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, period_start)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS monthly_usage_user_id_idx ON monthly_usage(user_id)
    `);

    // Admin-set per-customer shared monthly quota override (Enterprise custom /
    // one-off increases). NULL = use plan-tier default; -1 = unlimited.
    await db.execute(sql`
      ALTER TABLE user_licenses
        ADD COLUMN IF NOT EXISTS quota_override_secure INTEGER
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS license_events (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS license_events_user_id_idx ON license_events(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS license_events_user_event_idx
        ON license_events(user_id, event_type)
    `);

    // ─── Task #7 tables ────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_keys (
        id SERIAL PRIMARY KEY,
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        max_activations INTEGER NOT NULL DEFAULT 1,
        current_activations INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_keys_key_prefix_idx ON product_keys(key_prefix)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS product_keys_status_idx ON product_keys(status)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_name TEXT,
        os TEXT,
        first_activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS devices_user_id_idx ON devices(user_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_key_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deactivated_at TIMESTAMP WITH TIME ZONE
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS licenses_user_id_idx ON licenses(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS licenses_product_key_id_idx ON licenses(product_key_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS licenses_user_status_idx ON licenses(user_id, status)
    `);
  } catch (err) {
    logger.error({ err }, "License migration failed");
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Server-side UTC date in YYYY-MM-DD form, used as the daily-usage key. */
export function todayUtcDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function categoryFor(actionType: PdfActionType): UsageCategory {
  switch (actionType) {
    case "merge":
    case "split":
    case "extract_pages":
    case "delete_pages":
    case "insert_pages":
      return "edit";
    case "pdf_to_image":
    case "pdf_to_word":
    case "pdf_to_excel":
    case "image_to_pdf":
    case "word_to_pdf":
    case "excel_to_pdf":
      return "convert";
    case "password_protect":
    case "set_expiry":
    case "revoke_expiry":
    case "copy_restriction":
    case "print_restriction":
      return "secure";
    default: {
      // Exhaustive check; if a new action type is added without updating
      // this map, TypeScript will complain.
      const _exhaustive: never = actionType;
      void _exhaustive;
      return "edit";
    }
  }
}

/**
 * Maps a secure action to its metered monthly bucket, or null for general
 * (unlimited-for-paid) tools. Password Protect is its own bucket; expiry and
 * print/copy restrictions all count against the "secure" bucket.
 */
export function meteredFeatureFor(
  actionType: PdfActionType,
): MeteredFeature | null {
  switch (actionType) {
    case "password_protect":
      return "password";
    case "set_expiry":
    case "revoke_expiry":
    case "copy_restriction":
    case "print_restriction":
      return "secure";
    default:
      return null;
  }
}

/** Resolves a plan name to its tier. Unknown paid plans → individual. */
export function planTier(planName: string | null): PlanTier | null {
  if (!planName) return null;
  const p = planName.trim().toLowerCase();
  if (p === "team") return "team";
  if (p === "business") return "business";
  if (p === "enterprise") return "enterprise";
  // monthly / quarterly / yearly / lifetime and any other paid plan.
  return "individual";
}

/**
 * Default SHARED monthly secure-pool limit per tier. null = unlimited.
 * Individual = 10, Team = 50, Business = unlimited, Enterprise = custom
 * (unlimited by default until an admin sets a concrete override).
 */
export function quotaForTier(tier: PlanTier | null): number | null {
  switch (tier) {
    case "team":
      return 50;
    case "business":
    case "enterprise":
      return null;
    case "individual":
    default:
      return 10;
  }
}

/**
 * Resolves the effective monthly limit for a feature, applying an admin
 * override when present. Override of -1 means unlimited; null means "use the
 * tier default".
 */
export function effectiveLimit(
  override: number | null,
  tierDefault: number | null,
): number | null {
  if (override === null || override === undefined) return tierDefault;
  if (override <= UNLIMITED_QUOTA_SENTINEL) return null;
  return override;
}

function clampToMonthDay(year: number, monthIndex0: number, day: number): Date {
  // Date.UTC normalizes out-of-range month indices, so callers can pass
  // monthIndex0-1 or +1 safely. Day 0 of the next month gives this month's
  // length, which we clamp to (handles 31-day anchors in shorter months).
  const lastDay = new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
  const d = Math.min(Math.max(1, day), lastDay);
  return new Date(Date.UTC(year, monthIndex0, d, 0, 0, 0, 0));
}

/**
 * Computes the billing-month window containing `now`, anchored to the
 * day-of-month of `anchor` (the subscription start). Falls back to the 1st of
 * the calendar month when no anchor is available. `periodEnd` is the reset date
 * (the next monthly anniversary).
 */
export function currentBillingPeriod(
  anchor: Date | null,
  now: Date = new Date(),
): { periodStart: Date; periodEnd: Date } {
  const anchorDay = anchor ? anchor.getUTCDate() : 1;
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();

  let start = clampToMonthDay(y, m, anchorDay);
  if (now.getTime() < start.getTime()) {
    // Before this month's anchor — the active period began last month.
    start = clampToMonthDay(y, m - 1, anchorDay);
  }
  const end = clampToMonthDay(
    start.getUTCFullYear(),
    start.getUTCMonth() + 1,
    anchorDay,
  );
  return { periodStart: start, periodEnd: end };
}

/** YYYY-MM-DD key used for the monthly_usage primary key. */
export function billingPeriodKey(periodStart: Date): string {
  return periodStart.toISOString().slice(0, 10);
}

export async function getMonthlyUsage(
  userId: string,
  periodStart: Date,
): Promise<MonthlyUsage | null> {
  const [row] = await db
    .select()
    .from(monthlyUsageTable)
    .where(
      and(
        eq(monthlyUsageTable.userId, userId),
        eq(monthlyUsageTable.periodStart, billingPeriodKey(periodStart)),
      ),
    );
  return row ?? null;
}

/**
 * Builds the shared-pool monthly usage summary from the user's tier, admin
 * override, the current monthly_usage row, and the billing period window.
 */
export function buildMonthlyUsageSummary(
  tier: PlanTier | null,
  override: number | null,
  usage: MonthlyUsage | null,
  period: { periodStart: Date; periodEnd: Date } | null,
): MonthlyUsageSummary {
  const passwordProtectUsed = usage?.passwordProtectCount ?? 0;
  const securePdfUsed = usage?.securePdfCount ?? 0;
  const used = passwordProtectUsed + securePdfUsed;
  const limit = effectiveLimit(override, quotaForTier(tier));
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return {
    periodStart: period ? period.periodStart.toISOString() : null,
    periodEnd: period ? period.periodEnd.toISOString() : null,
    used,
    limit,
    remaining,
    passwordProtectUsed,
    securePdfUsed,
  };
}

function daysRemaining(end: Date, now: Date): number {
  // Whole days remaining, rounded down — matches the OpenAPI contract for
  // `trialDaysRemaining`. e.g. 13d 23h left → 13; 1h left → 0.
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.max(0, Math.floor(diff / MS_PER_DAY));
}

// ─── License row provisioning ─────────────────────────────────────────────────

/**
 * Returns the user's license row, creating it on first call. Trial start
 * date is set from server time at provisioning. Idempotent and safe under
 * concurrent calls (uses ON CONFLICT DO NOTHING + re-select).
 */
export async function getOrCreateLicense(userId: string): Promise<UserLicense> {
  const existing = await db
    .select()
    .from(userLicensesTable)
    .where(eq(userLicensesTable.userId, userId));

  if (existing[0]) return existing[0];

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * MS_PER_DAY);

  const [created] = await db
    .insert(userLicensesTable)
    .values({
      userId,
      trialStartDate: now,
      trialEndDate: trialEnd,
      isPaid: false,
      accountStatus: "active",
    })
    .onConflictDoNothing({ target: userLicensesTable.userId })
    .returning();

  if (created) {
    await logEvent(userId, "trial_started", "Trial provisioned on first sign-in", {
      trialStart: now.toISOString(),
      trialEnd: trialEnd.toISOString(),
    });
    return created;
  }

  // Lost the insert race — another request created the row first.
  const [row] = await db
    .select()
    .from(userLicensesTable)
    .where(eq(userLicensesTable.userId, userId));
  if (!row) {
    // Should be unreachable because both branches insert+re-select.
    throw new Error("Failed to provision user_licenses row");
  }
  return row;
}

// ─── Today's usage ────────────────────────────────────────────────────────────

export async function getTodayUsage(
  userId: string,
  now: Date = new Date(),
): Promise<DailyUsage | null> {
  const [row] = await db
    .select()
    .from(dailyUsageTable)
    .where(
      and(
        eq(dailyUsageTable.userId, userId),
        eq(dailyUsageTable.usageDate, todayUtcDate(now)),
      ),
    );
  return row ?? null;
}

// ─── Active license lookup (paid sub) ─────────────────────────────────────────

/**
 * Returns the caller's "best" active license — the one whose
 * `subscription_end_date` is the latest, among rows with status='active'
 * and end > now. Null if the caller has no active paid license.
 */
export async function getActiveLicense(
  userId: string,
  now: Date = new Date(),
): Promise<License | null> {
  const [row] = await db
    .select()
    .from(licensesTable)
    .where(
      and(
        eq(licensesTable.userId, userId),
        eq(licensesTable.status, "active"),
        sql`${licensesTable.subscriptionEndDate} > ${now}`,
      ),
    )
    .orderBy(desc(licensesTable.subscriptionEndDate))
    .limit(1);
  return row ?? null;
}

/**
 * Returns the caller's most-recent license regardless of expiry, used to
 * distinguish "trial-only" users from "had a paid sub which lapsed" users
 * for the `subscription_expired` lock reason.
 */
async function getLatestLicense(userId: string): Promise<License | null> {
  const [row] = await db
    .select()
    .from(licensesTable)
    .where(eq(licensesTable.userId, userId))
    .orderBy(desc(licensesTable.subscriptionEndDate))
    .limit(1);
  return row ?? null;
}

// ─── Status (single source of truth) ──────────────────────────────────────────

export function buildAnonymousStatus(now: Date = new Date()): LicenseStatusResult {
  return {
    loggedIn: false,
    trialActive: false,
    trialDaysRemaining: 0,
    trialExpired: false,
    trialStartDate: null,
    trialEndDate: null,
    todayUsage: 0,
    dailyLimit: TRIAL_DAILY_LIMIT,
    isPaid: false,
    planName: null,
    subscriptionActive: false,
    subscriptionDaysRemaining: null,
    subscriptionExpired: false,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    licenseStatus: "anonymous",
    canUsePdfTools: false,
    lockReason: "not_logged_in",
    monthlyUsage: buildMonthlyUsageSummary(null, null, null, null),
    serverTime: now.toISOString(),
  };
}

/**
 * Logs a `trial_expired` event the first time we observe that this user's
 * trial has lapsed. Subsequent observations do not re-log, so the events
 * table stays clean even under repeated status polling.
 */
async function maybeLogTrialExpired(userId: string): Promise<void> {
  try {
    const [existing] = await db
      .select({ id: licenseEventsTable.id })
      .from(licenseEventsTable)
      .where(
        and(
          eq(licenseEventsTable.userId, userId),
          eq(licenseEventsTable.eventType, "trial_expired"),
        ),
      )
      .limit(1);
    if (existing) return;
    await logEvent(userId, "trial_expired", "Trial period lapsed");
  } catch (err) {
    logger.warn({ err, userId }, "Failed to dedup trial_expired event");
  }
}

export async function getLicenseStatus(
  userId: string | null,
  now: Date = new Date(),
): Promise<LicenseStatusResult> {
  if (!userId) return buildAnonymousStatus(now);

  const license = await getOrCreateLicense(userId);
  const usage = await getTodayUsage(userId, now);
  const todayUsage = usage?.totalCount ?? 0;
  const activeLicense = await getActiveLicense(userId, now);
  // Team members are licensed by an active org membership (seat) rather than a
  // product key. An active membership in a currently-subscribed org grants
  // paid access just like an individual license.
  const orgMembership = activeLicense
    ? null
    : await getActiveOrgMembership(userId, now);

  const trialEnd = license.trialEndDate;
  const suspended = license.accountStatus === "suspended";

  const isPaid =
    activeLicense !== null || orgMembership !== null || DEV_LICENSE_BYPASS;
  const dailyLimit = isPaid ? PAID_DAILY_LIMIT : TRIAL_DAILY_LIMIT;
  const overLimit = todayUsage >= dailyLimit;

  // Subscription-window fields (populated whenever there's an active OR
  // expired license, so the UI can show "your plan ended on …" copy).
  let subscriptionActive = false;
  let subscriptionStartDate: string | null = null;
  let subscriptionEndDate: string | null = null;
  let subscriptionDaysRemaining: number | null = null;
  let subscriptionExpired = false;
  let planName: string | null = license.planName;

  if (activeLicense) {
    subscriptionActive = true;
    subscriptionStartDate = activeLicense.subscriptionStartDate.toISOString();
    subscriptionEndDate = activeLicense.subscriptionEndDate.toISOString();
    subscriptionDaysRemaining = daysRemaining(
      activeLicense.subscriptionEndDate,
      now,
    );
    planName = activeLicense.planName;
  } else if (orgMembership) {
    // Team member — license window mirrors the org's subscription.
    subscriptionActive = true;
    subscriptionStartDate =
      orgMembership.org.subscriptionStartDate.toISOString();
    subscriptionEndDate = orgMembership.org.subscriptionEndDate.toISOString();
    subscriptionDaysRemaining = daysRemaining(
      orgMembership.org.subscriptionEndDate,
      now,
    );
    planName = orgMembership.org.planName;
  } else {
    // No active license — but the user may have had one that lapsed.
    const latest = await getLatestLicense(userId);
    if (latest) {
      subscriptionExpired = true;
      subscriptionStartDate = latest.subscriptionStartDate.toISOString();
      subscriptionEndDate = latest.subscriptionEndDate.toISOString();
      planName = latest.planName;
    }
  }

  // Shared-pool monthly usage. The billing month is anchored to the
  // subscription start day-of-month (falls back to the calendar month for
  // users with no subscription window). The monthly limit only gates secure
  // actions and is enforced per-action in recordUsage()/usage check — it does
  // NOT set canUsePdfTools, so a user who exhausts the pool can still use the
  // general tools.
  const tier = planTier(planName);
  const override = license.quotaOverrideSecure ?? null;
  const subscriptionAnchor = subscriptionStartDate
    ? new Date(subscriptionStartDate)
    : null;
  const period = currentBillingPeriod(subscriptionAnchor, now);
  const monthlyRow = await getMonthlyUsage(userId, period.periodStart);
  const monthlyUsage = buildMonthlyUsageSummary(
    tier,
    override,
    monthlyRow,
    period,
  );
  if (DEV_LICENSE_BYPASS) {
    // Dev workspace: no monthly secure-pool cap for developers.
    monthlyUsage.limit = null;
    monthlyUsage.remaining = null;
  }

  let licenseStatus: LicenseStatusValue;
  let lockReason: LicenseLockReason;
  let canUsePdfTools: boolean;

  if (suspended) {
    licenseStatus = "suspended";
    lockReason = "account_suspended";
    canUsePdfTools = false;
  } else if (isPaid) {
    licenseStatus = "active";
    lockReason = overLimit ? "daily_limit_reached" : "none";
    canUsePdfTools = !overLimit;
  } else if (subscriptionExpired) {
    // Had a paid sub that lapsed — distinct from never-paid users so the
    // UI can offer a renewal CTA instead of a "buy first" CTA.
    licenseStatus = "expired";
    lockReason = "subscription_expired";
    canUsePdfTools = false;
  } else {
    // Logged in but never paid. The free trial has been removed — a paid plan
    // is required to use any tools.
    licenseStatus = "expired";
    lockReason = "subscription_required";
    canUsePdfTools = false;
  }

  return {
    loggedIn: true,
    // The free trial has been removed suite-wide; these fields are retained for
    // payload compatibility but always report "no trial".
    trialActive: false,
    trialDaysRemaining: 0,
    trialExpired: true,
    trialStartDate: license.trialStartDate.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    todayUsage,
    dailyLimit,
    isPaid,
    planName,
    subscriptionActive,
    subscriptionDaysRemaining,
    subscriptionExpired,
    subscriptionStartDate,
    subscriptionEndDate,
    licenseStatus,
    canUsePdfTools,
    lockReason,
    monthlyUsage,
    serverTime: now.toISOString(),
    devBypass: DEV_LICENSE_BYPASS,
  };
}

// ─── Recording usage ──────────────────────────────────────────────────────────

export interface RecordUsageOutcome {
  recorded: boolean;
  lockReason: LicenseLockReason;
  todayUsage: number;
  dailyLimit: number;
  /** Shared secure-pool usage this billing month after this action. */
  monthlyUsed: number;
  /** Shared monthly limit; null = unlimited. */
  monthlyLimit: number | null;
  /** Remaining shared-pool actions; null = unlimited. */
  monthlyRemaining: number | null;
}

/**
 * Atomically increments today's usage row. Re-checks the cap server-side
 * after the increment and rolls back if the action would have exceeded the
 * limit, so a malicious client cannot bypass the gate.
 */
export async function recordUsage(
  userId: string,
  actionType: PdfActionType,
  fileCount: number,
  now: Date = new Date(),
): Promise<RecordUsageOutcome> {
  const status = await getLicenseStatus(userId, now);

  const monthlyLimit = status.monthlyUsage.limit;
  let monthlyUsed = status.monthlyUsage.used;
  const monthlyRemainingOf = (used: number): number | null =>
    monthlyLimit === null ? null : Math.max(0, monthlyLimit - used);

  // Hard blocks that don't depend on usage counts — refuse without touching any
  // row. `subscription_required` covers never-paid users now that the free
  // trial has been removed (a paid plan is required for all tools).
  if (
    status.lockReason === "trial_expired" ||
    status.lockReason === "subscription_required" ||
    status.lockReason === "subscription_expired" ||
    status.lockReason === "account_suspended"
  ) {
    return {
      recorded: false,
      lockReason: status.lockReason,
      todayUsage: status.todayUsage,
      dailyLimit: status.dailyLimit,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: monthlyRemainingOf(monthlyUsed),
    };
  }

  const cat = categoryFor(actionType);

  // Secure actions require a paid plan (defense-in-depth; non-paid users are
  // already hard-blocked above).
  if (cat === "secure" && !status.isPaid) {
    return {
      recorded: false,
      lockReason: "premium_feature",
      todayUsage: status.todayUsage,
      dailyLimit: status.dailyLimit,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: monthlyRemainingOf(monthlyUsed),
    };
  }

  // ── Shared monthly secure-pool enforcement (paid users) ──────────────────
  // All secure actions draw from one monthly allowance. We always increment the
  // correct sub-counter (so the admin dashboard sees usage even for unlimited
  // tiers), but only block when a finite limit is exceeded — in which case we
  // roll the increment back atomically.
  // Tracks a successful monthly increment so a later daily-limit rejection can
  // roll it back too (otherwise a blocked action would still burn monthly quota).
  //
  // All counter mutations run inside a single DB transaction so that a failure
  // mid-flight (e.g. the daily upsert throwing after the monthly increment)
  // rolls back every write atomically — usage can never be partially consumed.
  // The intentional over-limit self-rollbacks below are ordinary updates that
  // commit with the transaction, leaving the counters net-unchanged.
  return await db.transaction(async (tx) => {
    let monthlyComp:
      | { periodKey: string; pwdInc: number; secInc: number }
      | null = null;

    if (cat === "secure" && status.isPaid) {
      const metered = meteredFeatureFor(actionType);
      if (metered) {
        const anchor = status.subscriptionStartDate
          ? new Date(status.subscriptionStartDate)
          : null;
        const period = currentBillingPeriod(anchor, now);
        const periodKey = billingPeriodKey(period.periodStart);
        const pwdInc = metered === "password" ? fileCount : 0;
        const secInc = metered === "secure" ? fileCount : 0;

        const [mrow] = await tx
          .insert(monthlyUsageTable)
          .values({
            userId,
            periodStart: periodKey,
            passwordProtectCount: pwdInc,
            securePdfCount: secInc,
          })
          .onConflictDoUpdate({
            target: [monthlyUsageTable.userId, monthlyUsageTable.periodStart],
            set: {
              passwordProtectCount: sql`${monthlyUsageTable.passwordProtectCount} + ${pwdInc}`,
              securePdfCount: sql`${monthlyUsageTable.securePdfCount} + ${secInc}`,
              updatedAt: new Date(),
            },
          })
          .returning();

        if (!mrow) {
          throw new Error("recordUsage monthly upsert returned no row");
        }

        const totalUsed = mrow.passwordProtectCount + mrow.securePdfCount;

        if (monthlyLimit !== null && totalUsed > monthlyLimit) {
          // Over the shared monthly cap — roll back this action's increment.
          await tx
            .update(monthlyUsageTable)
            .set({
              passwordProtectCount: sql`${monthlyUsageTable.passwordProtectCount} - ${pwdInc}`,
              securePdfCount: sql`${monthlyUsageTable.securePdfCount} - ${secInc}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(monthlyUsageTable.userId, userId),
                eq(monthlyUsageTable.periodStart, periodKey),
              ),
            );

          const usedBefore = totalUsed - fileCount;
          // Log the first time the monthly cap is hit this period.
          if (usedBefore < monthlyLimit) {
            await logEvent(
              userId,
              "monthly_limit_hit",
              "Monthly secure-features limit reached",
              {
                attemptedAction: actionType,
                fileCount,
                monthlyLimit,
                monthlyUsed: usedBefore,
              },
            );
          }

          return {
            recorded: false,
            lockReason: "monthly_limit_reached" as LicenseLockReason,
            todayUsage: status.todayUsage,
            dailyLimit: status.dailyLimit,
            monthlyUsed: usedBefore,
            monthlyLimit,
            monthlyRemaining: monthlyRemainingOf(usedBefore),
          };
        }

        monthlyUsed = totalUsed;
        // Remember this increment so the daily-limit branch below can undo it.
        monthlyComp = { periodKey, pwdInc, secInc };
      }
    }

    const today = todayUtcDate(now);
    const editInc = cat === "edit" ? fileCount : 0;
    const convertInc = cat === "convert" ? fileCount : 0;
    const secureInc = cat === "secure" ? fileCount : 0;

    // Atomic upsert with increment.
    const [row] = await tx
      .insert(dailyUsageTable)
      .values({
        userId,
        usageDate: today,
        editCount: editInc,
        convertCount: convertInc,
        secureCount: secureInc,
        totalCount: fileCount,
      })
      .onConflictDoUpdate({
        target: [dailyUsageTable.userId, dailyUsageTable.usageDate],
        set: {
          editCount: sql`${dailyUsageTable.editCount} + ${editInc}`,
          convertCount: sql`${dailyUsageTable.convertCount} + ${convertInc}`,
          secureCount: sql`${dailyUsageTable.secureCount} + ${secureInc}`,
          totalCount: sql`${dailyUsageTable.totalCount} + ${fileCount}`,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!row) {
      // Defensive — returning() should always yield the upserted row.
      throw new Error("recordUsage upsert returned no row");
    }

    // If the post-increment total exceeds the cap, roll back.
    if (row.totalCount > status.dailyLimit) {
      await tx
        .update(dailyUsageTable)
        .set({
          editCount: sql`${dailyUsageTable.editCount} - ${editInc}`,
          convertCount: sql`${dailyUsageTable.convertCount} - ${convertInc}`,
          secureCount: sql`${dailyUsageTable.secureCount} - ${secureInc}`,
          totalCount: sql`${dailyUsageTable.totalCount} - ${fileCount}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(dailyUsageTable.userId, userId),
            eq(dailyUsageTable.usageDate, today),
          ),
        );

      // Also undo the shared monthly increment so a daily-limit rejection never
      // burns monthly quota for an action that didn't actually go through.
      if (monthlyComp) {
        await tx
          .update(monthlyUsageTable)
          .set({
            passwordProtectCount: sql`${monthlyUsageTable.passwordProtectCount} - ${monthlyComp.pwdInc}`,
            securePdfCount: sql`${monthlyUsageTable.securePdfCount} - ${monthlyComp.secInc}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(monthlyUsageTable.userId, userId),
              eq(monthlyUsageTable.periodStart, monthlyComp.periodKey),
            ),
          );
        monthlyUsed = Math.max(
          0,
          monthlyUsed - monthlyComp.pwdInc - monthlyComp.secInc,
        );
      }

      // First time we hit the cap today — log it once.
      if (status.todayUsage < status.dailyLimit) {
        await logEvent(userId, "daily_limit_hit", "Daily usage limit reached", {
          attemptedAction: actionType,
          fileCount,
          dailyLimit: status.dailyLimit,
          todayUsage: row.totalCount - fileCount,
        });
      }

      return {
        recorded: false,
        lockReason: "daily_limit_reached" as LicenseLockReason,
        todayUsage: row.totalCount - fileCount,
        dailyLimit: status.dailyLimit,
        monthlyUsed,
        monthlyLimit,
        monthlyRemaining: monthlyRemainingOf(monthlyUsed),
      };
    }

    return {
      recorded: true,
      lockReason: "none" as LicenseLockReason,
      todayUsage: row.totalCount,
      dailyLimit: status.dailyLimit,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: monthlyRemainingOf(monthlyUsed),
    };
  });
}

// ─── Events / audit log ───────────────────────────────────────────────────────

export async function logEvent(
  userId: string,
  eventType: string,
  message?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(licenseEventsTable).values({
      userId,
      eventType,
      eventMessage: message ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Audit failures must not break the user-facing request.
    logger.warn({ err, userId, eventType }, "Failed to write license_events row");
  }
}

// ─── Product-key activation / verification / renewal ──────────────────────────

export type ProductKeyVerifyReason =
  | "malformed"
  | "not_found"
  | "revoked"
  | "expired"
  | "max_activations_reached";

export interface VerifyProductKeyResult {
  valid: boolean;
  planName: ProductPlan | null;
  durationDays: number | null;
  slotsAvailable: number | null;
  reason: ProductKeyVerifyReason | null;
}

/**
 * Read-only validation. Used by the activation dialog before commit.
 *
 * Every failure path emits a `verify_failed` audit event tagged with the
 * caller's userId so admins can investigate suspicious key-spraying.
 */
export async function verifyProductKey(
  rawKey: string,
  userId: string,
  now: Date = new Date(),
): Promise<VerifyProductKeyResult> {
  const { hash, prefix } = (() => {
    try {
      return hashProductKey(rawKey);
    } catch {
      return { hash: "", prefix: "" };
    }
  })();

  if (!isWellFormedProductKey(rawKey)) {
    await logEvent(userId, "verify_failed", "Malformed product key", {
      reason: "malformed",
      keyPrefix: prefix || null,
    });
    return {
      valid: false,
      planName: null,
      durationDays: null,
      slotsAvailable: null,
      reason: "malformed",
    };
  }
  const [key] = await db
    .select()
    .from(productKeysTable)
    .where(eq(productKeysTable.keyHash, hash))
    .limit(1);
  if (!key) {
    await logEvent(userId, "verify_failed", "Product key not found", {
      reason: "not_found",
      keyPrefix: prefix,
    });
    return {
      valid: false,
      planName: null,
      durationDays: null,
      slotsAvailable: null,
      reason: "not_found",
    };
  }
  const reason = checkKeyRedeemable(key, now);
  const slots = Math.max(0, key.maxActivations - key.currentActivations);
  if (reason !== null) {
    await logEvent(userId, "verify_failed", "Product key not redeemable", {
      reason,
      productKeyId: key.id,
      keyPrefix: key.keyPrefix,
    });
  }
  return {
    valid: reason === null,
    planName: isProductPlan(key.planName) ? key.planName : null,
    durationDays: key.durationDays,
    slotsAvailable: slots,
    reason,
  };
}

function checkKeyRedeemable(
  key: ProductKey,
  now: Date,
): ProductKeyVerifyReason | null {
  if (key.status === "revoked") return "revoked";
  if (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }
  if (key.currentActivations >= key.maxActivations) {
    return "max_activations_reached";
  }
  return null;
}

export interface ActivateLicenseInput {
  userId: string;
  productKey: string;
  deviceId: string;
  deviceName?: string | null;
  os?: string | null;
}

export type ActivateLicenseError =
  | { kind: "malformed" }
  | { kind: "not_found" }
  | { kind: "revoked" }
  | { kind: "expired" }
  | { kind: "max_activations_reached" };

export interface ActivateLicenseSuccess {
  licenseId: number;
  planName: string;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  slotsRemaining: number;
}

export type ActivateLicenseOutcome =
  | { ok: true; result: ActivateLicenseSuccess }
  | { ok: false; error: ActivateLicenseError };

/**
 * Atomically claim one activation slot on a product key and create a new
 * `licenses` row for (userId, deviceId).
 *
 * Race safety: the slot increment is a conditional UPDATE
 * (`SET current_activations = current_activations + 1 WHERE id = ? AND
 *  current_activations < max_activations AND status = 'active'`).
 * Two concurrent redeemers of the same key with one slot left will see
 * exactly one row affected; the loser sees `max_activations_reached`.
 */
export async function activateLicense(
  input: ActivateLicenseInput,
  now: Date = new Date(),
): Promise<ActivateLicenseOutcome> {
  if (!isWellFormedProductKey(input.productKey)) {
    return { ok: false, error: { kind: "malformed" } };
  }
  const { hash } = hashProductKey(input.productKey);

  const [key] = await db
    .select()
    .from(productKeysTable)
    .where(eq(productKeysTable.keyHash, hash))
    .limit(1);
  if (!key) {
    await logEvent(input.userId, "license_activation_failed", "Product key not found", {
      reason: "not_found",
    });
    return { ok: false, error: { kind: "not_found" } };
  }

  const upfrontReason = checkKeyRedeemable(key, now);
  if (upfrontReason) {
    await logEvent(input.userId, "license_activation_failed", "Product key not redeemable", {
      reason: upfrontReason,
      productKeyId: key.id,
    });
    return { ok: false, error: { kind: upfrontReason } };
  }

  const subscriptionStart = now;
  const subscriptionEnd = new Date(
    now.getTime() + key.durationDays * MS_PER_DAY,
  );

  // Atomic activation: slot claim → device upsert → license insert →
  // user_licenses cache update → audit event, all in one DB transaction.
  // If anything fails we roll back, so the slot counter can never drift
  // upward without a corresponding license row.
  type TxResult =
    | { kind: "ok"; licenseId: number; slotsRemaining: number }
    | { kind: "max_activations_reached" };

  const txResult: TxResult = await db.transaction(async (tx) => {
    const claimed = await tx
      .update(productKeysTable)
      .set({
        currentActivations: sql`${productKeysTable.currentActivations} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(productKeysTable.id, key.id),
          eq(productKeysTable.status, "active"),
          sql`${productKeysTable.currentActivations} < ${productKeysTable.maxActivations}`,
        ),
      )
      .returning();

    if (claimed.length === 0) {
      return { kind: "max_activations_reached" };
    }

    const claimedKey = claimed[0]!;

    await tx
      .insert(devicesTable)
      .values({
        deviceId: input.deviceId,
        userId: input.userId,
        deviceName: input.deviceName ?? null,
        os: input.os ?? null,
        firstActivatedAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: devicesTable.deviceId,
        set: {
          userId: input.userId,
          deviceName: input.deviceName ?? null,
          os: input.os ?? null,
          lastSeenAt: now,
        },
      });

    const [licenseRow] = await tx
      .insert(licensesTable)
      .values({
        userId: input.userId,
        productKeyId: key.id,
        deviceId: input.deviceId,
        planName: key.planName,
        subscriptionStartDate: subscriptionStart,
        subscriptionEndDate: subscriptionEnd,
        status: "active",
      })
      .returning();

    if (!licenseRow) {
      // Force rollback — slot counter is reverted automatically.
      throw new Error("Failed to create license row after claiming slot");
    }

    await tx
      .update(userLicensesTable)
      .set({ isPaid: true, planName: key.planName, updatedAt: now })
      .where(eq(userLicensesTable.userId, input.userId));

    // Audit event lives inside the transaction so the activation and its
    // audit row commit (or roll back) together.
    await tx.insert(licenseEventsTable).values({
      userId: input.userId,
      eventType: "license_activated",
      eventMessage: "Product key redeemed",
      metadata: {
        licenseId: licenseRow.id,
        productKeyId: key.id,
        deviceId: input.deviceId,
        planName: key.planName,
        subscriptionEnd: subscriptionEnd.toISOString(),
      },
    });

    return {
      kind: "ok",
      licenseId: licenseRow.id,
      slotsRemaining: Math.max(
        0,
        claimedKey.maxActivations - claimedKey.currentActivations,
      ),
    };
  });

  if (txResult.kind === "max_activations_reached") {
    await logEvent(
      input.userId,
      "license_activation_failed",
      "Lost race for last activation slot",
      { reason: "max_activations_reached", productKeyId: key.id },
    );
    return { ok: false, error: { kind: "max_activations_reached" } };
  }

  return {
    ok: true,
    result: {
      licenseId: txResult.licenseId,
      planName: key.planName,
      subscriptionStartDate: subscriptionStart,
      subscriptionEndDate: subscriptionEnd,
      slotsRemaining: txResult.slotsRemaining,
    },
  };
}

export type RenewLicenseError =
  | { kind: "license_not_found" }
  | { kind: "malformed" }
  | { kind: "not_found" }
  | { kind: "revoked" }
  | { kind: "expired" }
  | { kind: "max_activations_reached" };

export interface RenewLicenseSuccess {
  licenseId: number;
  subscriptionEndDate: Date;
}

export type RenewLicenseOutcome =
  | { ok: true; result: RenewLicenseSuccess }
  | { ok: false; error: RenewLicenseError };

/**
 * Apply a fresh product key to one of the caller's existing licenses,
 * extending its subscription window by the new key's `duration_days`.
 *
 * Extension semantics: if the existing window is in the past we treat
 * the renewal as if it started "now"; if it's still active we add the
 * new duration on top of the current end date so the customer doesn't
 * lose any time they've already paid for.
 */
export async function renewLicense(
  userId: string,
  licenseId: number,
  rawKey: string,
  now: Date = new Date(),
): Promise<RenewLicenseOutcome> {
  if (!isWellFormedProductKey(rawKey)) {
    return { ok: false, error: { kind: "malformed" } };
  }

  const [licenseRow] = await db
    .select()
    .from(licensesTable)
    .where(
      and(eq(licensesTable.id, licenseId), eq(licensesTable.userId, userId)),
    )
    .limit(1);
  if (!licenseRow) return { ok: false, error: { kind: "license_not_found" } };

  const { hash } = hashProductKey(rawKey);
  const [key] = await db
    .select()
    .from(productKeysTable)
    .where(eq(productKeysTable.keyHash, hash))
    .limit(1);
  if (!key) return { ok: false, error: { kind: "not_found" } };

  const upfrontReason = checkKeyRedeemable(key, now);
  if (upfrontReason) {
    return { ok: false, error: { kind: upfrontReason } };
  }

  const baseEnd =
    licenseRow.subscriptionEndDate.getTime() > now.getTime()
      ? licenseRow.subscriptionEndDate
      : now;
  const newEnd = new Date(baseEnd.getTime() + key.durationDays * MS_PER_DAY);

  // Atomic renewal: slot claim on renewal key → license window extension →
  // user_licenses cache update → audit event, all in one DB transaction.
  // If anything fails the slot claim is rolled back so counters cannot
  // diverge from the licenses table on partial failure.
  type TxResult =
    | { kind: "ok" }
    | { kind: "max_activations_reached" };

  const txResult: TxResult = await db.transaction(async (tx) => {
    const claimed = await tx
      .update(productKeysTable)
      .set({
        currentActivations: sql`${productKeysTable.currentActivations} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(productKeysTable.id, key.id),
          eq(productKeysTable.status, "active"),
          sql`${productKeysTable.currentActivations} < ${productKeysTable.maxActivations}`,
        ),
      )
      .returning();
    if (claimed.length === 0) {
      return { kind: "max_activations_reached" };
    }

    await tx
      .update(licensesTable)
      .set({
        planName: key.planName,
        subscriptionEndDate: newEnd,
        status: "active",
        updatedAt: now,
      })
      .where(eq(licensesTable.id, licenseId));

    await tx
      .update(userLicensesTable)
      .set({ isPaid: true, planName: key.planName, updatedAt: now })
      .where(eq(userLicensesTable.userId, userId));

    await tx.insert(licenseEventsTable).values({
      userId,
      eventType: "license_renewed",
      eventMessage: "License extended via product key",
      metadata: {
        licenseId,
        renewalKeyId: key.id,
        additionalDays: key.durationDays,
        newEnd: newEnd.toISOString(),
      },
    });

    return { kind: "ok" };
  });

  if (txResult.kind === "max_activations_reached") {
    return { ok: false, error: { kind: "max_activations_reached" } };
  }

  return {
    ok: true,
    result: { licenseId, subscriptionEndDate: newEnd },
  };
}

export type DeactivateDeviceError = { kind: "license_not_found" };

export interface DeactivateDeviceSuccess {
  licenseId: number;
  status: string;
  slotsRemaining: number;
}

export type DeactivateDeviceOutcome =
  | { ok: true; result: DeactivateDeviceSuccess }
  | { ok: false; error: DeactivateDeviceError };

export async function deactivateDeviceLicense(
  userId: string,
  licenseId: number,
  now: Date = new Date(),
): Promise<DeactivateDeviceOutcome> {
  // Atomic conditional update — only the request that actually transitions
  // the license from non-deactivated → deactivated will get a row back.
  // Concurrent deactivation calls are serialized at the row level by
  // PostgreSQL, so at most one of them can match `status != 'deactivated'`.
  // This is the linchpin that prevents double slot decrements.
  const transitioned = await db
    .update(licensesTable)
    .set({
      status: "deactivated",
      deactivatedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(licensesTable.id, licenseId),
        eq(licensesTable.userId, userId),
        ne(licensesTable.status, "deactivated"),
      ),
    )
    .returning();

  if (transitioned.length === 0) {
    // Either the license doesn't exist / belong to this user, or it was
    // already deactivated (possibly by a concurrent request). Re-read to
    // distinguish and respond idempotently in the already-deactivated case.
    const [licenseRow] = await db
      .select()
      .from(licensesTable)
      .where(
        and(eq(licensesTable.id, licenseId), eq(licensesTable.userId, userId)),
      )
      .limit(1);
    if (!licenseRow) return { ok: false, error: { kind: "license_not_found" } };

    const [keyRow] = await db
      .select()
      .from(productKeysTable)
      .where(eq(productKeysTable.id, licenseRow.productKeyId))
      .limit(1);
    return {
      ok: true,
      result: {
        licenseId,
        status: licenseRow.status,
        slotsRemaining: keyRow
          ? Math.max(0, keyRow.maxActivations - keyRow.currentActivations)
          : 0,
      },
    };
  }

  const licenseRow = transitioned[0]!;

  // Free up exactly one slot on the parent product key. Because only the
  // single request that successfully flipped the license status reaches this
  // line, this decrement happens at most once per (licenseId, deactivation).
  // GREATEST clamp guards against any historical counter drift.
  const [updatedKey] = await db
    .update(productKeysTable)
    .set({
      currentActivations: sql`GREATEST(${productKeysTable.currentActivations} - 1, 0)`,
      updatedAt: now,
    })
    .where(eq(productKeysTable.id, licenseRow.productKeyId))
    .returning();

  // If this user no longer has any active license, flip user_licenses.isPaid
  // back to false so the cached column reflects reality.
  const remainingActive = await getActiveLicense(userId, now);
  if (!remainingActive) {
    await db
      .update(userLicensesTable)
      .set({ isPaid: false, updatedAt: now })
      .where(eq(userLicensesTable.userId, userId));
  }

  await logEvent(userId, "device_deactivated", "License deactivated by user", {
    licenseId,
    productKeyId: licenseRow.productKeyId,
    deviceId: licenseRow.deviceId,
  });

  return {
    ok: true,
    result: {
      licenseId,
      status: "deactivated",
      slotsRemaining: updatedKey
        ? Math.max(0, updatedKey.maxActivations - updatedKey.currentActivations)
        : 0,
    },
  };
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function adminListProductKeys(): Promise<
  Array<Pick<ProductKey,
    | "id"
    | "keyPrefix"
    | "planName"
    | "durationDays"
    | "maxActivations"
    | "currentActivations"
    | "status"
    | "expiresAt"
    | "notes"
    | "createdAt"
    | "revokedAt"
  >>
> {
  const rows = await db
    .select({
      id: productKeysTable.id,
      keyPrefix: productKeysTable.keyPrefix,
      planName: productKeysTable.planName,
      durationDays: productKeysTable.durationDays,
      maxActivations: productKeysTable.maxActivations,
      currentActivations: productKeysTable.currentActivations,
      status: productKeysTable.status,
      expiresAt: productKeysTable.expiresAt,
      notes: productKeysTable.notes,
      createdAt: productKeysTable.createdAt,
      revokedAt: productKeysTable.revokedAt,
    })
    .from(productKeysTable)
    .orderBy(desc(productKeysTable.createdAt))
    .limit(500);
  return rows;
}

export async function adminRevokeProductKey(
  id: number,
  now: Date = new Date(),
): Promise<{ id: number; status: string } | null> {
  const [row] = await db
    .update(productKeysTable)
    .set({ status: "revoked", revokedAt: now, updatedAt: now })
    .where(eq(productKeysTable.id, id))
    .returning({
      id: productKeysTable.id,
      status: productKeysTable.status,
      keyPrefix: productKeysTable.keyPrefix,
    });
  if (!row) return null;

  // Audit. Emit one `license_revoked` event per affected user-license, plus
  // an admin-tagged summary row so the revocation is always auditable even
  // when no license has ever been redeemed against the key yet.
  try {
    const affectedLicenses = await db
      .select({
        userId: licensesTable.userId,
        licenseId: licensesTable.id,
      })
      .from(licensesTable)
      .where(eq(licensesTable.productKeyId, id));

    for (const lic of affectedLicenses) {
      await logEvent(lic.userId, "license_revoked", "Product key revoked by admin", {
        productKeyId: id,
        keyPrefix: row.keyPrefix,
        licenseId: lic.licenseId,
      });
    }
    await logEvent("admin", "license_revoked", "Product key revoked by admin", {
      productKeyId: id,
      keyPrefix: row.keyPrefix,
      affectedLicenses: affectedLicenses.length,
    });
  } catch (err) {
    logger.warn({ err, productKeyId: id }, "Failed to write revoke audit events");
  }

  return { id: row.id, status: row.status };
}

export async function adminExtendProductKey(
  id: number,
  additionalDays: number,
  now: Date = new Date(),
): Promise<{ id: number; durationDays: number } | null> {
  const [row] = await db
    .update(productKeysTable)
    .set({
      durationDays: sql`${productKeysTable.durationDays} + ${additionalDays}`,
      updatedAt: now,
    })
    .where(eq(productKeysTable.id, id))
    .returning({
      id: productKeysTable.id,
      durationDays: productKeysTable.durationDays,
    });
  return row ?? null;
}

// ─── Admin: customers & monthly quota ─────────────────────────────────────────

export interface AdminCustomerRow {
  userId: string;
  planName: string | null;
  tier: PlanTier | null;
  isPaid: boolean;
  accountStatus: string;
  lockReason: LicenseLockReason;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  /** Raw admin override on the shared monthly pool. null = tier default, -1 = unlimited. */
  quotaOverrideSecure: number | null;
  monthlyUsed: number;
  monthlyLimit: number | null;
  monthlyRemaining: number | null;
  passwordProtectUsed: number;
  securePdfUsed: number;
  /** When the current billing month resets (ISO 8601). */
  resetDate: string | null;
  createdAt: string;
}

/**
 * Lists every provisioned customer with their plan, shared monthly secure-pool
 * usage/remaining/reset, and admin override. Reuses {@link getLicenseStatus}
 * per user so the figures match exactly what each customer sees.
 */
export async function adminListCustomers(
  now: Date = new Date(),
): Promise<AdminCustomerRow[]> {
  const licenses = await db
    .select()
    .from(userLicensesTable)
    .orderBy(desc(userLicensesTable.createdAt))
    .limit(1000);

  const rows: AdminCustomerRow[] = [];
  for (const lic of licenses) {
    const status = await getLicenseStatus(lic.userId, now);
    rows.push({
      userId: lic.userId,
      planName: status.planName,
      tier: planTier(status.planName),
      isPaid: status.isPaid,
      accountStatus: lic.accountStatus,
      lockReason: status.lockReason,
      subscriptionStartDate: status.subscriptionStartDate,
      subscriptionEndDate: status.subscriptionEndDate,
      quotaOverrideSecure: lic.quotaOverrideSecure ?? null,
      monthlyUsed: status.monthlyUsage.used,
      monthlyLimit: status.monthlyUsage.limit,
      monthlyRemaining: status.monthlyUsage.remaining,
      passwordProtectUsed: status.monthlyUsage.passwordProtectUsed,
      securePdfUsed: status.monthlyUsage.securePdfUsed,
      resetDate: status.monthlyUsage.periodEnd,
      createdAt: lic.createdAt.toISOString(),
    });
  }
  return rows;
}

/**
 * Sets (or clears) the admin override on a user's shared monthly secure pool.
 * `override === null` clears it (falls back to the tier default). `-1` grants
 * unlimited. Provisions the license row first if the user has none yet.
 */
export async function adminSetQuotaOverride(
  userId: string,
  override: number | null,
  now: Date = new Date(),
): Promise<AdminCustomerRow | null> {
  await getOrCreateLicense(userId);
  const [row] = await db
    .update(userLicensesTable)
    .set({ quotaOverrideSecure: override, updatedAt: now })
    .where(eq(userLicensesTable.userId, userId))
    .returning({ userId: userLicensesTable.userId });
  if (!row) return null;

  await logEvent(userId, "quota_override_set", "Admin set monthly quota override", {
    quotaOverrideSecure: override,
  });

  const status = await getLicenseStatus(userId, now);
  const lic = await getOrCreateLicense(userId);
  return {
    userId,
    planName: status.planName,
    tier: planTier(status.planName),
    isPaid: status.isPaid,
    accountStatus: lic.accountStatus,
    lockReason: status.lockReason,
    subscriptionStartDate: status.subscriptionStartDate,
    subscriptionEndDate: status.subscriptionEndDate,
    quotaOverrideSecure: lic.quotaOverrideSecure ?? null,
    monthlyUsed: status.monthlyUsage.used,
    monthlyLimit: status.monthlyUsage.limit,
    monthlyRemaining: status.monthlyUsage.remaining,
    passwordProtectUsed: status.monthlyUsage.passwordProtectUsed,
    securePdfUsed: status.monthlyUsage.securePdfUsed,
    resetDate: status.monthlyUsage.periodEnd,
    createdAt: lic.createdAt.toISOString(),
  };
}
