import { and, eq, sql } from "drizzle-orm";
import {
  db,
  userLicensesTable,
  dailyUsageTable,
  licenseEventsTable,
  type UserLicense,
  type DailyUsage,
} from "@workspace/db";
import type { PdfActionType } from "@workspace/api-zod";
import { logger } from "./logger";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRIAL_DAYS = 14;
export const TRIAL_DAILY_LIMIT = 5;
// Effectively unlimited for paid users — using a large finite number so the
// value serializes cleanly through JSON / zod number().
export const PAID_DAILY_LIMIT = 1_000_000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  | "subscription_expired"
  | "daily_limit_reached"
  | "account_suspended";

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
  serverTime: string;
}

export type UsageCategory = "edit" | "convert" | "secure";

// ─── Idempotent startup migration ─────────────────────────────────────────────

/**
 * Creates the three license-related tables if they don't already exist.
 * Mirrors the runPdfMigrations() pattern so deployments don't need a manual
 * `drizzle-kit push` step before the API can serve license traffic.
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

  const trialEnd = license.trialEndDate;
  const trialActive = trialEnd.getTime() > now.getTime();
  const trialDays = daysRemaining(trialEnd, now);

  // At this stage paid-subscription is always inactive (Task #7 wires it up).
  // We still respect `accountStatus` in case it ever gets flipped to suspended.
  const suspended = license.accountStatus === "suspended";

  let licenseStatus: LicenseStatusValue;
  let lockReason: LicenseLockReason;
  let canUsePdfTools: boolean;
  const dailyLimit = license.isPaid ? PAID_DAILY_LIMIT : TRIAL_DAILY_LIMIT;
  const overLimit = todayUsage >= dailyLimit;

  if (suspended) {
    licenseStatus = "suspended";
    lockReason = "account_suspended";
    canUsePdfTools = false;
  } else if (license.isPaid) {
    // Paid path is stubbed at this stage; keep the structure ready for Task #7.
    licenseStatus = "active";
    lockReason = overLimit ? "daily_limit_reached" : "none";
    canUsePdfTools = !overLimit;
  } else if (trialActive) {
    licenseStatus = "trial";
    lockReason = overLimit ? "daily_limit_reached" : "none";
    canUsePdfTools = !overLimit;
  } else {
    licenseStatus = "trial_expired";
    lockReason = "trial_expired";
    canUsePdfTools = false;
    // Best-effort, deduplicated audit log of the trial lapsing.
    void maybeLogTrialExpired(userId);
  }

  return {
    loggedIn: true,
    trialActive: trialActive && !suspended,
    trialDaysRemaining: trialDays,
    trialExpired: !trialActive,
    trialStartDate: license.trialStartDate.toISOString(),
    trialEndDate: trialEnd.toISOString(),
    todayUsage,
    dailyLimit,
    isPaid: license.isPaid,
    planName: license.planName,
    subscriptionActive: false,
    subscriptionDaysRemaining: null,
    subscriptionExpired: false,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    licenseStatus,
    canUsePdfTools,
    lockReason,
    serverTime: now.toISOString(),
  };
}

// ─── Recording usage ──────────────────────────────────────────────────────────

export interface RecordUsageOutcome {
  recorded: boolean;
  lockReason: LicenseLockReason;
  todayUsage: number;
  dailyLimit: number;
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

  // Hard blocks that don't depend on today's count — refuse without touching the row.
  if (
    status.lockReason === "trial_expired" ||
    status.lockReason === "subscription_expired" ||
    status.lockReason === "account_suspended"
  ) {
    return {
      recorded: false,
      lockReason: status.lockReason,
      todayUsage: status.todayUsage,
      dailyLimit: status.dailyLimit,
    };
  }

  const today = todayUtcDate(now);
  const cat = categoryFor(actionType);
  const editInc = cat === "edit" ? fileCount : 0;
  const convertInc = cat === "convert" ? fileCount : 0;
  const secureInc = cat === "secure" ? fileCount : 0;

  // Atomic upsert with increment.
  const [row] = await db
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
    await db
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
      lockReason: "daily_limit_reached",
      todayUsage: row.totalCount - fileCount,
      dailyLimit: status.dailyLimit,
    };
  }

  return {
    recorded: true,
    lockReason: "none",
    todayUsage: row.totalCount,
    dailyLimit: status.dailyLimit,
  };
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
