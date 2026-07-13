---
name: Developer passphrase gate
description: Post-login passphrase step for developer accounts — where it is enforced and its coherence rules
---

Developer accounts (emails in the `developers` table) must enter a passphrase (the ADMIN_PASSPHRASE secret) once per Clerk login session.

**Rule:** the gate is enforced in two places and both must stay in sync: (1) the sign-in page shows the passphrase screen after login (fail-closed — a failed dev-status check shows a retry screen, never a silent redirect), and (2) an API-wide middleware 403s (`dev_verification_required`) every authenticated request from an unverified developer session.

**Why:** a login-screen-only gate is bypassable by navigating straight into an app; a fail-open status check lets a network hiccup skip the gate. Architect review failed the first version on exactly these two points.

**How to apply:** verification rows are keyed by Clerk sessionId (re-login ⇒ re-entry). Developer membership is cached per userId — positives 5 min, negatives only 30 s so promoting an email takes effect quickly; never cache negatives for long. To add a developer: insert the email into `developers` (no UI yet). Dev-status/dev-verify/admin routes must stay exempt from the middleware or the gate deadlocks.

Related constraint: Replit-managed Clerk supports only `email_code` verification (no magic links) and has first/last-name attributes disabled — names live in `unsafeMetadata` (see clerk-signup-constraints.md).
