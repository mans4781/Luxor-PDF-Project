---
name: Clerk suite-wide SSO wiring
description: How pdf-expiry/luxor-pdf/esign-app share one Clerk session; lib/luxor-auth-ui exports; CSS layer requirements.
---

- One Clerk account works across `pdf-expiry`, `luxor-pdf`, `esign-app` — same domain, different paths, session cookie shared automatically.
- Auth host: `pdf-expiry` (`/pdf-expiry/sign-in`, `/pdf-expiry/sign-up` are the ONLY sign-in/up pages). Other artifacts redirect with `?redirect_url=<encoded current URL>`.
- `lib/luxor-auth-ui` (non-composite, consumed via TS source):
  - `LuxorClerkProvider` wraps `<ClerkProvider>` with brand appearance/localization; accepts `signInUrl`/`signUpUrl` overrides + optional `routerPush`/`routerReplace` (auth host only).
  - `AuthMenu`: signed-out = Sign in / Create account (navigates to suite auth URLs with redirect back); `iconOnly` variant = circular profile icon dropdown ("Sign in to unlock editing") used by luxor-pdf. Signed-in = `<UserButton>`. `variant="dark"` for dark backgrounds (esign-app sidebar).
  - Exports `clerkAppearance`/`clerkLocalization`/`SUITE_AUTH_HOST_BASE = "/pdf-expiry"`.
  - Lib declares `@clerk/react` + `@clerk/themes` as real `dependencies` so consumer Vite can resolve them from lib source. Consumers add `@source "../../../lib/luxor-auth-ui/src/**/*.{ts,tsx}";` in index.css for Tailwind v4 scanning.
- Server: `app.ts` mounts `clerkProxyMiddleware()` at `CLERK_PROXY_PATH` BEFORE body parsers, then `clerkMiddleware()` after CORS/parsers; `getAuth(req)` on requests.
- pdf-expiry App.tsx: local sign-in/up URLs + wouter router push/replace; routes `/sign-in/*?` & `/sign-up/*?` use `routing="path"` with full base-prefixed `path`; header AuthMenu `redirectBackOnAuth={false}`.
- CSS gotcha: `pdf-expiry/src/index.css` needs `@layer theme, base, clerk, components, utilities;` + `@import "@clerk/themes/shadcn.css"`, and `tailwindcss({ optimize: false })` in vite.config.ts — or Clerk styles break in prod builds.
- Env (auto-set, never commit): `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`; prod adds `VITE_CLERK_PROXY_URL`. All artifacts read via `publishableKeyFromHost(...)` from `@clerk/react/internal`.
- Landing (`/`) stays public — no auth gate.
- Custom sign-in flows: `@clerk/react` ≥6.5's `useSignIn` returns the new signals API (no `setActive`, `create` returns `{error}`); import `useSignIn` from `@clerk/react/legacy` for ticket-strategy custom flows.
- Desktop shell sign-in: browser handoff via one-time 64-hex state + Clerk signInTokens ticket stored server-side, claim-once poll. Ticket is single-use — if Clerk isn't loaded when it arrives, fail visibly, don't retry.
- Post-login landing: sign-in/up fallback (no redirect_url) is `${basePath}/dashboard` — the unified account dashboard (pdf-expiry `/dashboard`). Desktop handoff unaffected (redirect_url preserved).
- Clerk session types: `@clerk/types` isn't installed/hoisted; derive from the hook instead — `type SessionEntry = Awaited<ReturnType<NonNullable<ReturnType<typeof useUser>["user"]>["getSessions"]>>[number]` (compile-checks `.revoke()`, `latestActivity`).
