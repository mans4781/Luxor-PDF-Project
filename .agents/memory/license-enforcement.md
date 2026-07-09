---
name: Subscription/license enforcement (server + offline)
description: Server-primary license gate, LockOverlay, offline grace cache, clock-tamper defense in pdf-expiry.
---

- Server primary: `getLicenseStatus()` (`api-server/src/lib/license.ts`) — most-recent license with `subscriptionEndDate > now`; lapsed → `lockReason: "subscription_expired"`, `canUsePdfTools: false`. `recordUsage()` re-checks and refuses increments for expired/suspended users.
- `LockOverlay` in `pdf-expiry/src/App.tsx`: full-screen modal for `subscription_expired` / `trial_expired` / `account_suspended`. Status refetches every 5 min + on window focus.
- Offline grace (`src/license/offline-cache.ts` + `LicenseProvider`): each good `/api/license/status` cached in `localStorage["luxor.lastLicenseStatus"]` with highest observed `serverTime`. When offline:
  - Cached status renders; if cached `subscriptionEndDate` passed by wall clock → immediate expired lock (can't dodge by unplugging).
  - Cache older than 7 days (`OFFLINE_GRACE_MS`) → `clientLockReason "offline_too_long"` ("connect to verify", no renew buttons).
  - `Date.now()` > 2h EARLIER than highest recorded server time → `"clock_tampered"` lock (clock-rollback defense).
  - 1-min timer re-derives state so lock appears the moment grace lapses.
- `useGuardedAction` short-circuits with matching toast before `/api/usage/check` — one-off tool actions also blocked offline.
- Cached status wiped on sign-out (shared-device hygiene).
