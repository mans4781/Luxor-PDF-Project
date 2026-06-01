---
name: Teams/Business seat-based licensing
description: How the custom organizations/seats/invites layer works and why Team access mirrors the individual license flow.
---

# Teams/Business licensing

Replit-managed Clerk has **no organization tenants**, so Teams is a custom layer
keyed on Clerk `userId`: `organizations`, `organization_members`,
`organization_invites` (server lib `artifacts/api-server/src/lib/org.ts`).

Team members do **not** enter license keys. Access = active membership in an org
whose subscription is active. `getActiveOrgMembership()` is consulted by
`getLicenseStatus()` and grants paid access (planName "team") just like an
individual license.

## Why device cap & web access work the way they do
**The 2-device cap is enforced at activation time (`activateOrgDevice`, capped at
`MAX_DEVICES_PER_MEMBER`), NOT at web-access status time.** This deliberately
mirrors the individual flow: `getActiveLicense(userId)` / `getLicenseStatus` grant
web tool access per-*user*, not per-*device*. Device binding is a desktop-app
activation concept (X-Device-Id), not a gate on the web app for either flow.
**How to apply:** if asked to "enforce 2 devices for web tool usage," understand
that's a NEW cross-cutting requirement affecting individual licenses too — not a
Teams-only bug.

## Seat accounting
Seats used = active members + un-expired pending invites. The concurrency-sensitive
path (`acceptInvite`) re-checks seats **inside a DB transaction** (excluding the
invite being consumed). `inviteMember`/`activateOrgDevice` are check-then-insert
(fine for human-paced admin actions).

## Invite tokens
256-bit `randomBytes(32).base64url`; only the SHA-256 hash is stored. Accept
requires the signed-in user's primary email to match the invited email
(case-insensitive) so a forwarded link can't be redeemed by the wrong account.
