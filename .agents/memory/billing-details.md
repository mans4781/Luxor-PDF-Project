---
name: Billing details (Stripe + Razorpay)
description: Provider registry, Razorpay payment-link flow, webhook idempotency, applyPaidPlan pipeline, frontend checkout wiring.
---

- Provider registry `artifacts/api-server/src/lib/billing.ts`: Stripe available iff `STRIPE_SECRET_KEY`; Razorpay iff `RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET` (else `comingSoon`); PayPal stub.
- Endpoints: `GET /api/billing/providers`, `POST /api/billing/checkout-session` (Clerk-authed), `POST /api/billing/webhook` (Stripe, raw body BEFORE `express.json()`), `POST /api/billing/razorpay/webhook` (same raw-body rule).

## Razorpay (one-time Payment Links)
- `lib/razorpay.ts`: `createPaymentLink()` (REST `POST /v1/payment_links`, Basic auth) → hosted `short_url`; `verifyRazorpaySignature()` timing-safe HMAC-SHA256 of raw body.
- Only monthly + yearly plans (`isRazorpayPlan`); other plans rejected for Razorpay (Stripe-only).
- Region pricing: INR for India, USD elsewhere. Client detects via timezone (`Asia/Kolkata`/`Asia/Calcutta` → INR; `detectCurrency()` in `checkout.tsx`), server re-validates (`normalizeRazorpayCurrency`, default INR). Prices from `RAZORPAY_PRICE_<PLAN>_<CURRENCY>` in smallest unit. USD needs International Payments enabled on the Razorpay account.
- `clerkUserId`+`plan` in link `notes`, echoed on `payment_link.paid`. Idempotency key derived from the SIGNED BODY only (payment_link entity id, fallback payment id) — never the unsigned `x-razorpay-event-id` header (replay/license-extension abuse otherwise).

## Shared pipeline
- Webhook idempotency: `billing_events (provider, event_id)` PK created by `runBillingMigrations()`; `claimBillingEvent()` INSERT…ON CONFLICT DO NOTHING short-circuits duplicates before `applyPaidPlan()`.
- `applyPaidPlan()`: mints 1-use product key (attributed `billing:stripe`), extends most-recent license (renewal base = `max(now, current end)`) or sets `user_licenses.isPaid=true` for first activation; one DB transaction + `license_renewed`/`license_activated` audit row. Then `sendLicenseEmail()`.
- Stripe per-plan price IDs `STRIPE_PRICE_MONTHLY|QUARTERLY|YEARLY|LIFETIME`; lifetime `mode:"payment"`, others `"subscription"`.

## Frontend
- `pdf-expiry/src/pages/checkout.tsx` is provider-aware: reads `/billing/providers`, uses `?provider=` when available, else first available, else `"stripe"`.
- lexsecure-landing pricing Pro CTA deep-links `/pdf-expiry/checkout?plan=monthly|yearly`; checkout POSTs then `window.location.replace()` to hosted URL. LockOverlay "Renew subscription" uses same route, defaulting to previous plan.
- Razorpay webhook URL to register: `<domain>/api/billing/razorpay/webhook`, event `payment_link.paid`.
