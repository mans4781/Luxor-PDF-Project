import { and, eq, sql } from "drizzle-orm";
import {
  db,
  productKeysTable,
  licensesTable,
  devicesTable,
  userLicensesTable,
  licenseEventsTable,
} from "@workspace/db";
import {
  generateProductKey,
  hashProductKey,
  PLAN_DURATION_DAYS,
  type ProductPlan,
} from "@workspace/license-keys";
import { logger } from "./logger";
import { createOrganizationWithOwner, type CreateOrgParams } from "./org";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type BillingProviderId = "stripe" | "razorpay" | "paypal";

export interface BillingProviderInfo {
  id: BillingProviderId;
  displayName: string;
  available: boolean;
  comingSoon: boolean;
}

export const PROVIDER_REGISTRY: Record<BillingProviderId, () => BillingProviderInfo> = {
  stripe: () => ({
    id: "stripe",
    displayName: "Stripe",
    available: !!process.env["STRIPE_SECRET_KEY"],
    comingSoon: false,
  }),
  razorpay: () => ({
    id: "razorpay",
    displayName: "Razorpay",
    available: razorpayConfigured(),
    comingSoon: !razorpayConfigured(),
  }),
  paypal: () => ({
    id: "paypal",
    displayName: "PayPal",
    available: false,
    comingSoon: true,
  }),
};

export function listProviders(): BillingProviderInfo[] {
  return (Object.keys(PROVIDER_REGISTRY) as BillingProviderId[]).map((id) =>
    PROVIDER_REGISTRY[id](),
  );
}

const STRIPE_PRICE_ENV: Record<ProductPlan, string> = {
  monthly: "STRIPE_PRICE_MONTHLY",
  quarterly: "STRIPE_PRICE_QUARTERLY",
  yearly: "STRIPE_PRICE_YEARLY",
  lifetime: "STRIPE_PRICE_LIFETIME",
};

export function stripePriceIdFor(plan: ProductPlan): string | null {
  const envName = STRIPE_PRICE_ENV[plan];
  return process.env[envName] ?? null;
}

/** Per-seat recurring price for the Team plan. */
export function stripeTeamPriceId(): string | null {
  return process.env["STRIPE_PRICE_TEAM"] ?? null;
}

/** Flat recurring price for the Business plan (unlimited secure pool). */
export function stripeBusinessPriceId(): string | null {
  return process.env["STRIPE_PRICE_BUSINESS"] ?? null;
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

/** True when Razorpay API credentials are present in the environment. */
export function razorpayConfigured(): boolean {
  return !!process.env["RAZORPAY_KEY_ID"] && !!process.env["RAZORPAY_KEY_SECRET"];
}

/** Razorpay API credentials, or null when not configured. */
export function razorpayCredentials(): {
  keyId: string;
  keySecret: string;
} | null {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** Currencies Razorpay charges in: INR for India, USD for everyone else. */
export type RazorpayCurrency = "INR" | "USD";

/** Razorpay sells only these plans (one-time monthly or yearly access). */
export type RazorpayPlan = "monthly" | "yearly";

/** Narrowing guard: only monthly/yearly are purchasable via Razorpay. */
export function isRazorpayPlan(plan: string): plan is RazorpayPlan {
  return plan === "monthly" || plan === "yearly";
}

/** Coerce arbitrary input to a supported currency, defaulting to INR. */
export function normalizeRazorpayCurrency(
  input?: string | null,
): RazorpayCurrency {
  return input?.toUpperCase() === "USD" ? "USD" : "INR";
}

/**
 * Per-plan, per-currency Razorpay amount in the smallest currency unit
 * (paise for INR, cents for USD). Configured via
 * `RAZORPAY_PRICE_<PLAN>_<CURRENCY>` (e.g. `RAZORPAY_PRICE_MONTHLY_INR`) so
 * amounts change without a code edit.
 */
export function razorpayAmountFor(
  plan: RazorpayPlan,
  currency: RazorpayCurrency,
): number | null {
  const raw = process.env[`RAZORPAY_PRICE_${plan.toUpperCase()}_${currency}`];
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export interface ApplyTeamPlanParams {
  ownerUserId: string;
  ownerEmail?: string | null;
  orgName: string;
  seats: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

/**
 * Provisions (or idempotently updates) a Team organization for a paid Team
 * checkout. The buyer becomes the org admin; `seats` becomes `maxSeats`.
 */
export async function applyTeamPlan(
  params: ApplyTeamPlanParams,
): Promise<{ orgId: number }> {
  const createParams: CreateOrgParams = {
    name: params.orgName,
    ownerUserId: params.ownerUserId,
    ownerEmail: params.ownerEmail ?? null,
    planName: "team",
    maxSeats: Math.max(1, Math.floor(params.seats)),
    stripeCustomerId: params.stripeCustomerId ?? null,
    stripeSubscriptionId: params.stripeSubscriptionId ?? null,
    subscriptionStartDate: params.subscriptionStartDate,
    subscriptionEndDate: params.subscriptionEndDate,
  };
  const org = await createOrganizationWithOwner(createParams);
  return { orgId: org.id };
}

/** Idempotency table for webhook events. Created at startup. */
export async function runBillingMigrations(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS billing_events (
        provider TEXT NOT NULL,
        event_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        user_id TEXT,
        processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY (provider, event_id)
      )
    `);
  } catch (err) {
    logger.error({ err }, "Billing migration failed");
    throw err;
  }
}

/**
 * Records a webhook event as processed. Returns true on first observation,
 * false on duplicate (idempotent replay).
 */
export async function claimBillingEvent(
  provider: BillingProviderId,
  eventId: string,
  eventType: string,
  userId: string | null,
): Promise<boolean> {
  const inserted = await db.execute(sql`
    INSERT INTO billing_events (provider, event_id, event_type, user_id)
    VALUES (${provider}, ${eventId}, ${eventType}, ${userId})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING event_id
  `);
  return (inserted.rows?.length ?? 0) > 0;
}

/**
 * Records a successful payment in the revenue ledger. Idempotent per
 * (provider, eventId) — webhook replays never double-count. Best-effort:
 * callers should not fail the webhook if this throws.
 */
export async function recordPayment(params: {
  provider: BillingProviderId;
  eventId: string;
  userId: string;
  planName: string;
  amountMinor: number | null;
  currency: string | null;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO payments (provider, event_id, user_id, plan_name, amount_minor, currency)
    VALUES (${params.provider}, ${params.eventId}, ${params.userId}, ${params.planName},
            ${params.amountMinor}, ${params.currency ? params.currency.toUpperCase() : null})
    ON CONFLICT (provider, event_id) DO NOTHING
  `);
}

export interface PaidRenewalOutcome {
  productKeyId: number;
  rawProductKey: string;
  licenseId: number | null;
  subscriptionEndDate: Date;
  isFirstActivation: boolean;
}

/**
 * Mints a fresh product key for `userId` and either:
 *   - extends the user's most-recent license (renewal), or
 *   - records the key without binding to a device (first activation —
 *     the desktop app activates it on next launch using the user's
 *     deviceId).
 *
 * Atomic: the product key insert, license update, and audit row all share
 * one DB transaction.
 */
export async function applyPaidPlan(
  userId: string,
  plan: ProductPlan,
  source: { provider: BillingProviderId; eventId: string },
  now: Date = new Date(),
): Promise<PaidRenewalOutcome> {
  return applyPaidPlanInternal(userId, plan, PLAN_DURATION_DAYS[plan], source, now);
}

/**
 * Applies the flat-rate Business plan (planName `"business"` → unlimited shared
 * monthly secure pool). `subscriptionEndDate` comes from the Stripe billing
 * period; we derive an equivalent `durationDays` so renewals extend correctly.
 */
export async function applyBusinessPlan(
  userId: string,
  source: { provider: BillingProviderId; eventId: string },
  subscriptionEndDate: Date,
  now: Date = new Date(),
): Promise<PaidRenewalOutcome> {
  const durationDays = Math.max(
    1,
    Math.round((subscriptionEndDate.getTime() - now.getTime()) / MS_PER_DAY),
  );
  return applyPaidPlanInternal(userId, "business", durationDays, source, now);
}

async function applyPaidPlanInternal(
  userId: string,
  plan: string,
  durationDays: number,
  source: { provider: BillingProviderId; eventId: string },
  now: Date = new Date(),
): Promise<PaidRenewalOutcome> {
  const rawKey = generateProductKey();
  const { hash, prefix } = hashProductKey(rawKey);

  return db.transaction(async (tx) => {
    // 1. Mint the product key (single-use, server-attributed).
    const [keyRow] = await tx
      .insert(productKeysTable)
      .values({
        keyHash: hash,
        keyPrefix: prefix,
        planName: plan,
        durationDays,
        maxActivations: 1,
        currentActivations: 0,
        status: "active",
        notes: `auto-minted via ${source.provider} (${source.eventId})`,
        createdBy: `billing:${source.provider}`,
      })
      .returning();
    if (!keyRow) throw new Error("Failed to mint product key");

    // 2. Find the most-recent license for this user (any status).
    const [latest] = await tx
      .select()
      .from(licensesTable)
      .where(eq(licensesTable.userId, userId))
      .orderBy(sql`${licensesTable.subscriptionEndDate} DESC`)
      .limit(1);

    let licenseId: number | null = null;
    let isFirstActivation = false;
    let newEnd: Date;

    if (latest) {
      // Renewal — extend from current end if still active, else from now.
      const baseEnd =
        latest.subscriptionEndDate.getTime() > now.getTime()
          ? latest.subscriptionEndDate
          : now;
      newEnd = new Date(baseEnd.getTime() + durationDays * MS_PER_DAY);

      await tx
        .update(productKeysTable)
        .set({
          currentActivations: 1,
          updatedAt: now,
        })
        .where(eq(productKeysTable.id, keyRow.id));

      await tx
        .update(licensesTable)
        .set({
          planName: plan,
          subscriptionEndDate: newEnd,
          status: "active",
          updatedAt: now,
        })
        .where(eq(licensesTable.id, latest.id));

      await tx
        .update(userLicensesTable)
        .set({ isPaid: true, planName: plan, updatedAt: now })
        .where(eq(userLicensesTable.userId, userId));

      licenseId = latest.id;
    } else {
      // First-time activation — leave the key unredeemed; the desktop app
      // will activate it (binding to a device) on next launch via
      // /api/license/activate. We still flip user_licenses.isPaid so the
      // dashboard reflects payment immediately, and surface the key in the
      // event log so admin / support can resend it if needed.
      newEnd = new Date(now.getTime() + durationDays * MS_PER_DAY);
      isFirstActivation = true;

      // Ensure user_licenses row exists (trial may not be provisioned yet
      // if the user paid before opening the app).
      await tx
        .insert(userLicensesTable)
        .values({
          userId,
          trialStartDate: now,
          trialEndDate: now,
          isPaid: true,
          planName: plan,
          accountStatus: "active",
        })
        .onConflictDoUpdate({
          target: userLicensesTable.userId,
          set: { isPaid: true, planName: plan, updatedAt: now },
        });
    }

    await tx.insert(licenseEventsTable).values({
      userId,
      eventType: latest ? "license_renewed" : "license_activated",
      eventMessage: `Paid via ${source.provider}`,
      metadata: {
        provider: source.provider,
        eventId: source.eventId,
        plan,
        productKeyId: keyRow.id,
        productKeyPrefix: keyRow.keyPrefix,
        licenseId,
        newEnd: newEnd.toISOString(),
        isFirstActivation,
      },
    });

    return {
      productKeyId: keyRow.id,
      rawProductKey: rawKey,
      licenseId,
      subscriptionEndDate: newEnd,
      isFirstActivation,
    };
  });
}

// Suppress unused-import warning when devicesTable isn't referenced directly
// (kept for future deviceId binding hooks).
void devicesTable;
void and;
