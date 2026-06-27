---
name: Stripe webhook & billing conventions
description: Established idempotency and lifecycle-handling patterns in artifacts/api-server billing; what is intentionally NOT handled.
---

# Stripe billing/webhook conventions

## Idempotency: claim-before-side-effects (established pattern)
`claimBillingEvent(provider, eventId, ...)` does INSERT…ON CONFLICT DO NOTHING on
`billing_events` and is called **before** applying side effects; duplicate Stripe
deliveries short-circuit. **Why:** matches the documented design in replit.md.
**Trade-off (known):** if a side effect fails *after* the claim, the retry is
treated as a duplicate and skipped. This is accepted, system-wide behavior — do
not "fix" it for Teams alone; it would diverge the team and individual paths.

## Only `checkout.session.completed` is handled
Both individual and team checkout provision on `checkout.session.completed`.
**Recurring renewal events (`invoice.paid`, subscription updates) are NOT wired
up** for either flow — subscriptions effectively cover the first period only.
A renewal helper `extendOrgSubscription()` exists in org.ts but is intentionally
not yet called by any webhook handler. **How to apply:** adding renewal handling
is a deliberate, cross-cutting future feature (affects individual + team) — not a
Teams regression.

## Team checkout specifics
Team plan → `mode: "subscription"`, `line_items` quantity = seats. Seats + orgName
flow through session `metadata` AND `subscription_data.metadata`. The webhook reads
the Stripe subscription's `current_period_start/end` for the org window (30-day
fallback if retrieval fails). Needs `STRIPE_PRICE_TEAM` env var to be set.

## Razorpay provider (one-time payment links)
Razorpay reuses the SAME license plumbing as Stripe: `claimBillingEvent("razorpay", …)`
for idempotency → `applyPaidPlan()` → `sendLicenseEmail()`. **Why one-time, not
subscriptions:** Razorpay was added as a one-time Payment Link flow (REST POST
`/v1/payment_links`, Basic auth), so it covers individual product plans only
(monthly/quarterly/yearly/lifetime). **Team/Business stay Stripe-only** — the checkout
branch rejects them for Razorpay. clerkUserId + plan ride in the link's `notes` and
come back on the `payment_link.paid` webhook. **Idempotency key is body-derived only**
(payment_link entity id, fallback payment entity id) — NOT the `x-razorpay-event-id`
header. **Why:** the HMAC signature covers only the body, so an unsigned header could be
varied to replay one signed payload and re-trigger applyPaidPlan (license-extension
abuse). The payment_link id is stable across Razorpay's legitimate retries so dedupe
still holds. Webhook is HMAC-SHA256 of
the raw body (`verifyRazorpaySignature`, timing-safe) and is mounted at
`/api/billing/razorpay/webhook` (distinct path, BEFORE `express.json`, raw parser).
Prices come from `RAZORPAY_PRICE_<PLAN>` in **paise** (smallest unit); currency
defaults to INR via `RAZORPAY_CURRENCY`. Provider is "available" iff
`RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET` set. Frontend `checkout.tsx` is provider-aware:
picks `?provider=` if available, else first available provider, else stripe.
