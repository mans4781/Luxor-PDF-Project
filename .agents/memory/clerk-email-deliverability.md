---
name: Clerk email deliverability (luxorpdf.com)
description: Why enhanced_email_deliverability:false is correct, and how to verify email deliverability end-to-end without dashboard access.
---

# Clerk email deliverability

**Rule:** `enhanced_email_deliverability: false` in the Clerk environment payload is the *correct* state when a custom sending domain is configured — it means Clerk sends from the app's own domain (DKIM-signed `d=luxorpdf.com`) instead of Clerk's shared domain. Do not treat it as a bug.

**Why:** A task assumed `false` meant emails came from Clerk's generic domain and would land in spam. Verification (Aug 2026) showed the opposite: DNS is fully provisioned (`clkmail` CNAME → `mail.<instance>.clerk.services` serving SPF/MX, `clk._domainkey`/`clk2._domainkey` CNAMEs serving DKIM keys, `_dmarc.luxorpdf.com` p=quarantine), and a live sign-up verification email scored 10/10 on mail-tester with DKIM_VALID_AU.

**How to apply / verify without Clerk dashboard access** (dashboardAccess is `requires_personal_pro`):
1. `dns.resolve` the clkmail/clk._domainkey/clk2._domainkey names (dig is not installed; use node dns/promises in CodeExecution with "use impure").
2. End-to-end: pick any `test-<slug>@srv1.mail-tester.com`, POST `https://luxorpdf.com/api/__clerk/v1/client/sign_ups?_is_native=1` with email+password, grab the `authorization` response header as bearer token, POST `.../sign_ups/<id>/prepare_verification` with `strategy=email_code`, then fetch `https://www.mail-tester.com/test-<slug>` and check the score/DKIM lines.
