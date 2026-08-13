# /lx-console Log out — real-browser verification

Last verified: 2026-08-12. All 14 assertions passed (real Chromium via Playwright, real
Clerk session cookie — not jsdom).

The jsdom unit tests (`admin.test.tsx`, `admin.no-clerk.test.tsx`) simulate fetch and never
exercise the real Clerk session cookie. The committed harness below covers what they
cannot: Clerk `signOut()` actually ending the session, the cookie being cleared, and a
reload not restoring console access.

## Runnable harness

```bash
# Prereqs: `artifacts/api-server: API Server` and `artifacts/lexsecure-landing: web`
# workflows running; CLERK_SECRET_KEY and DATABASE_URL in the environment (both are
# standard in the Replit dev environment). Chromium: `npx playwright install chromium`.
node artifacts/lexsecure-landing/e2e/lx-console-logout.e2e.mjs
```

The script is fully self-contained and cleans up after itself:

1. Provisions a throwaway Clerk user via the Backend API (`skip_password_checks`,
   email marked verified, `bypass_client_trust: true` — Client Trust would otherwise
   demand an email code on the fresh browser context).
2. Inserts the user's email into `developers` **before** any API call so the server's
   30 s negative membership cache never populates for it.
3. Launches Chromium, opens `/lx-console`, waits for `window.Clerk.loaded`, and signs in
   programmatically with a Backend-API **sign-in token**
   (`Clerk.client.signIn.create({ strategy: "ticket", ticket })` + `Clerk.setActive`) —
   no Clerk UI involved.
4. Inserts `(session_id, user_id)` into `developer_verifications` (the row
   `/account/dev-verify` would create; passphrase values are secrets and out of scope —
   the gate itself is covered by its own tests).
5. Asserts, in order:
   - console renders (`Luxor PDF Admin` sidebar) and `GET /api/admin/session` → 200;
   - `__session` Clerk cookie present pre-logout (browser-level cookie check);
   - after clicking profile menu → **Log out**: console UI gone immediately, **no**
     "Session expired" prompt, 404 disguise (or the `afterSignOutUrl` redirect to `/`);
   - `window.Clerk.session` becomes null (signOut completed);
   - `sessionStorage` unlock keys (`luxor_admin_token`, `luxor_admin_dev_preview`) cleared;
   - `__session` cookie removed/emptied (polled; if a value lingers, it must be rejected
     server-side with 401);
   - fresh navigation to `/lx-console`: settles on the 404 disguise, not the console,
     and the probe returns 401.
6. Cleanup: deletes the DB rows and the Clerk user.

Do **not** use `?dev=1` — the dev-preview mode bypasses the real auth path under test.

## Verified result (2026-08-12)

```
[PASS] Clerk programmatic sign-in
[PASS] Console renders before logout
[PASS] Probe /api/admin/session returns 200 pre-logout — status 200
[PASS] __session Clerk cookie present pre-logout
[PASS] Console gone right after Log out
[PASS] No 'Session expired' prompt after manual Log out
[PASS] 404 disguise or post-signout redirect shown
[PASS] Clerk session ended in browser (Clerk.session null)
[PASS] sessionStorage unlock cleared
[PASS] __session Clerk cookie cleared after logout — cookie removed
[PASS] Reload shows 404 disguise, not console
[PASS] Reload shows no 'Session expired' prompt
[PASS] Probe /api/admin/session returns 401 post-logout — status 401
```

An independent browser-agent run the same day confirmed the identical flow (unlock →
logout → 404 disguise → reload stays locked, probe 401) with screenshot evidence.

Relevant code:
- `artifacts/lexsecure-landing/src/pages/admin.tsx` (`handleLogout`, session probe)
- `artifacts/lexsecure-landing/src/components/admin/shell.tsx` (Log out menu item)
- `artifacts/api-server/src/middlewares/devVerification.ts` (session verification, caches)
- `artifacts/lexsecure-landing/e2e/lx-console-logout.e2e.mjs` (this harness)
