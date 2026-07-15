---
name: Developer passphrase gate
description: Post-login dual-passphrase step for developer accounts — where it is enforced and its coherence rules
---

Developer accounts (emails in the `developers` table) must enter TWO passphrases (secrets `DEV_PASSPHRASE_1` + `DEV_PASSPHRASE_2`, both must match) once per Clerk login session. `ADMIN_PASSPHRASE` is no longer used for this gate.

**Rule:** the gate is enforced in two places and both must stay in sync: (1) the sign-in page shows the two-passphrase screen after login (fail-closed — a failed dev-status check shows a retry screen, never a silent redirect), and (2) an API-wide middleware 403s (`dev_verification_required`) every authenticated request from an unverified developer session.

**Why:** a login-screen-only gate is bypassable by navigating straight into an app; a fail-open status check lets a network hiccup skip the gate. Architect review failed the first version on exactly these two points, and a later review failed a fail-open membership lookup — hence the known-developer fail-closed set below.

**How to apply:**
- Verification rows keyed by Clerk sessionId (re-login ⇒ re-entry). Membership cached per userId — positives 5 min, negatives 30 s; never cache negatives long.
- A process-lifetime `knownDevUserIds` set makes membership-lookup failures fail CLOSED for accounts ever confirmed as developers; unknown accounts fail open so outages don't take down regular users.
- Both server comparisons run unconditionally (timing-safe, no short-circuit leaking which passphrase failed).
- The reserved `ADMIN_EMAIL` account is normally blocked from user APIs, EXCEPT when it is also a registered developer — then it passes and the dev gate protects it. A failed developer lookup for the reserved account fails closed (403).
- Dev-status/dev-verify/admin routes stay exempt from the middleware or the gate deadlocks.
- The developer account is a real Clerk user (verified email, `bypass_client_trust`) seeded via Clerk Backend API; its email is in `developers` (no management UI yet).

Owner preference: after a successful passphrase verification, developers are redirected to the admin dashboard (`/admin`, suite root) rather than the account dashboard — the admin page still has its own admin-password login.

Related constraint: Replit-managed Clerk supports only `email_code` verification and has name attributes disabled — names live in `unsafeMetadata` (see clerk-signup-constraints.md).
