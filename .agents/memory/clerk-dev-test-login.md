---
name: Clerk dev test login & Client Trust bypass
description: How the seeded dev login works and how to bypass Clerk Client Trust / HIBP / email-code gates for test accounts
---

# Seeded dev login

- A demo/dev account `test@luxorpdf.com` exists (development-only; password known to the user, never store it here). It signs in through the real form at `/pdf-expiry/sign-in` and lands on `/pdf-expiry/dashboard`.

# Gates that block seeded password sign-ins (and their fixes)

1. **HIBP breached-password check** → `PATCH https://api.clerk.com/v1/instance {"hibp": false}`.
2. **Unverified email → email-code first factor** → `PATCH /v1/email_addresses/{id} {"verified": true}`.
3. **Client Trust** (new-device second-factor email code; enabled by default on Clerk apps created after Nov 2025):
   - No instance-level API toggle exists (Dashboard-only, and Replit-managed Clerk has no dashboard access). `PATCH /v1/instance` returns 204 for unknown fields — a 204 does NOT mean the setting took effect.
   - **Fix is per-user**: `PATCH /v1/users/{user_id} {"bypass_client_trust": true}` — then password sign-in returns `status: complete` directly.

**Why:** Client Trust challenges every new browser context with an email code sent to the account's inbox, which doesn't exist for seeded test accounts, making automated/e2e and dev logins impossible without the bypass.

**How to apply:** when seeding any future test/demo Clerk user, create with `skip_password_checks`, mark email verified, and set `bypass_client_trust: true`. Debug tip: reproduce quickly via FAPI `POST https://<fapi-domain>/v1/client/sign_ins` with identifier/password — inspect `status` and `client_trust_state`.
