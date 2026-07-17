---
name: Billing details (Stripe + Razorpay)
description: Provider registry, Razorpay payment-link flow, webhook idempotency, applyPaidPlan pipeline, frontend checkout wiring.
---

- Provider registry `artifacts/api-server/src/lib/billing.ts`: Stripe available iff `STRIPE_SECRET_KEY`; Razorpay iff `RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET` (else `comingSoon`); PayPal stub.
- **Razorpay is the default provider** (user decision, July 2026 — no Stripe keys): server route + checkout.tsx both default/fall back to `razorpay`. Landing pricing Team/Business CTAs are "Contact sales" mailto (those plans are Stripe-only).
- **Razorpay `reference_id` max 40 chars** — never embed the Clerk userId in it (too long); identity travels in `notes.clerkUserId`. Prices come from `RAZORPAY_PRICE_<PLAN>_<CUR>` env vars; both INR and USD must be set or checkout 503s for that region (INR was missing → prod checkout failures).
- Endpoints: `GET /api/billing/providers`, `POST /api/billing/checkout-session` (Clerk-authed), `POST /api/billing/webhook` (Stripe, raw body BEFORE `express.json()`), `POST /api/billing/razorpay/webhook` (same raw-body rule).

## Razorpay (one-time Payment Links)
- `lib/razorpay.ts`: `createPaymentLink()` (REST `POST /v1/payment_links`, Basic auth) → hosted `short_url`; `verifyRazorpaySignature()` timing-safe HMAC-SHA256 of raw body.
- Only monthly + yearly plans (`isRazorpayPlan`); other plans rejected for Razorpay (Stripe-only).
- Region pricing: INR for India, USD elsewhere. Client detects via timezone (`Asia/Kolkata`/`Asia/Calcutta` → INR; `detectCurrency()` in `checkout.tsx`), server re-validates (`normalizeRazorpayCurrency`, default INR). Prices from `RAZORPAY_PRICE_<PLAN>_<CURRENCY>` in smallest unit. USD needs International Payments enabled on the Razorpay account.
- `clerkUserId`+`plan` in link `notes`, echoed on `payment_link.paid`. Idempotency key derived from the SIGNED BODY only (payment_link entity id, fallback payment id) — never the unsigned `x-razorpay-event-id` header (replay/license-extension abuse otherwise).

## Shared pipeline
- Webhook idempotency: `billing_events (provider, event_id)` PK created by `runBillingMigrations()`; `claimBillingEvent()` INSERT…ON CONFLICT DO NOTHING short-circuits duplicates before `applyPaidPlan()`.
- `applyPaidPlan()`: mints 1-use product key (attributed `billing:stripe`), extends most-recent license (renewal base = `max(now, current end)`) or sets `user_licenses.isPaid=true` for first activation; one DB transaction + `license_renewed`/`license_activated` audit row. Then `sendLicenseEmail()`.
- Stripe per-plan price IDs `STRIPE_PRICE_MONTHLY|QUARTERLY|YEARLY|LIFETIME`; yearly + lifetime `mode:"payment"` (one-time), monthly/quarterly `"subscription"`. **`STRIPE_PRICE_YEARLY` must be a one-time (non-recurring) Price in the Stripe dashboard or yearly checkout fails at runtime.**

## Recurring renewals & portal
- `invoice.paid` webhook handled ONLY when `billing_reason==="subscription_cycle"` — first period is granted by `checkout.session.completed`; anything else would double-grant.
- Renewal routing: team → `extendOrgSubscription`, business → `applyBusinessPlan(periodEnd)`, individual recurring → `applyPaidPlan`; all behind `claimBillingEvent()`; renewal license email sent.
- `user_licenses.stripe_customer_id` saved on `checkout.session.completed` + `invoice.paid`; `POST /api/billing/portal` (Clerk-authed) opens Stripe Billing Portal from it. `returnUrl` body param restricted to same-origin (open-redirect guard), fallback `/pdf-expiry/dashboard`.
- Dashboard button logic: recurring plans (monthly/quarterly/business/team) → "Manage / Cancel Plan" (portal); yearly → "Renew with License Key" → `/activate-key`; free → checkout link.
- Yearly renewal is manual: renewal license key emailed, user redeems via activate-key page / `POST /license/renew`. Razorpay stays manual one-time for both.

## Frontend
- `pdf-expiry/src/pages/checkout.tsx` is provider-aware: reads `/billing/providers`, uses `?provider=` when available, else first available, else `"razorpay"`.
- lexsecure-landing pricing Pro CTA deep-links `/pdf-expiry/checkout?plan=monthly|yearly`; checkout POSTs then `window.location.replace()` to hosted URL. LockOverlay "Renew subscription" uses same route, defaulting to previous plan.
- Razorpay webhook URL to register: `<domain>/api/billing/razorpay/webhook`, event `payment_link.paid`.
