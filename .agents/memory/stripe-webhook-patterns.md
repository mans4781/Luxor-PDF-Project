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
