---
name: Clerk sign-up constraints
description: What Replit-managed Clerk cannot change about sign-up, and how the suite works around it.
---

# Clerk sign-up constraints (Replit-managed Clerk)

- **Sign-in can also demand an emailed code (`needs_second_factor`)** — e.g. from a new browser/device — even though the tenant reports `second_factor.required: false`. Any custom sign-in UI must handle it via `signIn.mfa.sendEmailCode()` + `verifyEmailCode({code})`; treating non-complete status as a dead-end error blocks logins entirely.
- **Testing tip:** Clerk bot protection (Turnstile) blocks automated sign-up UI tests. For e2e login tests, create a user via the Backend API with a `+clerk_test` email — every emailed code is then `424242`.

- **Email OTP verification cannot be disabled.** Replit-managed Clerk always requires the email code step at sign-up; there is no dashboard/config toggle available. Confirmed via Replit docs search. Only a migration to external (self-managed) Clerk would allow removing it — user accepted keeping OTP.
- **Name attributes are disabled on the managed tenant** (`first_name`/`last_name` enabled=false in `/v1/environment`, not configurable). Passing firstName/lastName to signUp shows "is unknown" field errors. Store the full name in `unsafeMetadata.fullName` instead; anything needing a display/greeting name (e.g. welcome email) must read it from unsafeMetadata, not user.firstName.
- **Clerk rejects breached/weak passwords with a 422** (HIBP check). This is a likely cause of "can't create account" reports. Surface Clerk field errors clearly on the custom sign-up form; the pdf-expiry sign-up page also shows a live client-side rules checklist (8+ chars, letter, number, match) so users fix problems before submit.
- **Welcome email pattern:** one-time branded email is sent server-side (POST /api/account/welcome), claimed atomically via a primary-key insert with onConflictDoNothing, gated to accounts created within 48h so existing users passing through SSO callbacks never get it. Frontend calls it best-effort from every sign-up completion path.

**Why:** avoids re-investigating the OTP removal request and re-deriving why sign-ups 422.
**How to apply:** any future sign-up flow changes must keep the OTP step, keep field-error surfacing, and reuse the idempotent welcome-email endpoint rather than adding client-side sends.
