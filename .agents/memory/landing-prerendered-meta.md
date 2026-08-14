---
name: Landing prerendered social meta
description: How lexsecure-landing gets per-route titles/OG tags into raw HTML for social crawlers
---

Social/chat crawlers don't run JS, so the client-side usePageMeta hook alone leaves every shared link previewing the homepage meta.

**The rule:** per-route meta lives in one data-only registry (`src/seo/routeMeta.ts`); pages consume it via usePageMeta, and a post-build step (`scripts/prerender.ts`, chained onto `pnpm build`) rewrites the built index.html per route.

**Why two output shapes:** static servers differ — `/pricing/` resolves to `pricing/index.html`, but extensionless `/pricing` (what crawlers actually fetch) resolves via sirv/vite-preview's `extensions` lookup to `pricing.html`. The prerender writes both, or extensionless URLs silently fall back to the homepage SPA shell.

**How to apply:** any new indexable landing route must get a registry entry (not inline usePageMeta literals), or its shared links revert to homepage previews. Route aliases (e.g. /thank-you) are prerendered with the canonical entry's meta via `PRERENDER_ALIASES`. Verify with `curl` of the extensionless path against a built preview, not the dev server (dev always serves the SPA shell).

**Production hosting gotcha:** the landing artifact deploys as static hosting with a catch-all `/* → /index.html` rewrite. That catch-all wins for extensionless URLs (no `.html` extension lookup), so every prerendered route also needs an explicit `/<route> → /<route>.html` rewrite in artifact.toml — a test in prerender.test.ts keeps those in sync with the registry. Post-deploy, run `pnpm run check:live-meta` (scripts/check-live-meta.ts) against production to confirm crawler-visible meta.
