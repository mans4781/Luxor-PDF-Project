# Workspace

## User preferences

- **Desktop app icon colors (do not mix up)**: Luxor PDF **Reader** (`luxor-reader-desktop`) icon is **RED**; Luxor PDF **Secure** (`luxor-desktop`) icon is **BLUE**. Applies to app + installer icons.
- **Originality / no-copy requirement (all Luxor products, especially Luxor PDF Reader)**: never copy, clone, or imitate the UI, layout, icons, graphics, colors, wording, workflows, branding, or design system of Adobe Acrobat, Foxit, PDF-XChange, Nitro, Smallpdf, iLovePDF, DocuSign, or any other existing PDF software. Those products may be referenced only for understanding user expectations. All layouts, toolbar/sidebar/panel/modal designs, empty states, loading states, UI copy, labels, error messages, and mock AI/OCR/security/signature workflows must be newly written and original to Luxor PDF. Use only properly licensed open-source libraries (PDF.js, React, TypeScript, Tailwind, Lucide icons, etc.). No copyrighted assets, scraped images, copied SVGs, or copied CSS. Keep the Luxor identity: red document/shield accent, clean white interface, modern dark mode, premium business-software feel.

## Overview

Luxor PDF Suite — a family of PDF products sharing one domain, one Clerk sign-on, and one API:

- **Account Dashboard** (`pdf-expiry` at `/pdf-expiry/dashboard`) — unified post-login hub: real Clerk profile + sessions (revoke other devices), live license/plan banner, product cards (Reader/Secure/eSign waitlist via `/api/esign/waitlist`), recent secured-file activity, quick actions. Sign-in default landing.
- **PDF Expiry Tool** (`pdf-expiry` at `/`) — upload PDFs, set an exact expiry date+time, pick a post-expiry behavior (**corrupt**: file overwritten with random bytes, served as broken PDF; **revoke**: file deleted, download returns 410). Also has fully client-side Convert tools (PDF↔Images/Word/Excel).
- **Luxor PDF Reader** (`luxor-pdf`) — high-performance PDF reader (virtualized rendering, themes, annotations, panels). Reading is free; editing/export features require sign-in.
- **eSign App** (`esign-app`) — LexSign e-signing app.
- **Marketing site** (`lexsecure-landing` at `/lexsecure-landing/`) — luxorpdf.com landing + pricing + admin.
- **API Server** (`api-server` at `/api`, port 8080) — Express 5 backend for all apps.
- Desktop (Electron, Windows-only, not Replit artifacts): **luxor-reader-desktop** ("Luxor PDF Reader", wraps luxor-pdf, auto-updates from GitHub Releases at `mans4781/Luxor-PDF-Project`, CI in `.github/workflows/reader-desktop-windows.yml`, ~200 KB web-installer stub) and **luxor-desktop** ("Luxor PDF Secure", wraps pdf-expiry, provides the desktop device id).
- **mockup-sandbox** — Canvas component preview server (dev only).

## Stack

- pnpm workspaces monorepo, Node 24, TypeScript 5.9
- API: Express 5 + PostgreSQL (Drizzle ORM) + Zod (`zod/v4`) + Orval codegen from OpenAPI; esbuild CJS bundle; multer uploads to `/uploads/`
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- All 5 web artifacts' Vite configs use `strictPort: true` + a `noCacheDevPlugin`; dev scripts kill the port before binding.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture notes (summaries — details in `.agents/memory/`)

- **Expiry**: `pdfs` table has `expiry_action` (`corrupt`|`revoke`, default `revoke`). `parseExpiryDate()`/`isExpired()` accept ISO 8601 and legacy `YYYY-MM-DD`. `runPdfMigrations()` adds columns idempotently.
- **Auth (Clerk suite SSO)**: one account across pdf-expiry / luxor-pdf / esign-app; `pdf-expiry` hosts the only sign-in/up pages (`/pdf-expiry/sign-in|sign-up`); shared UI in `lib/luxor-auth-ui` (`LuxorClerkProvider`, `AuthMenu`). Server mounts `clerkProxyMiddleware()` before body parsers. Landing page stays public. See memory `clerk-suite-sso.md`.
- **Billing**: provider registry in `api-server/src/lib/billing.ts` — Stripe (subscriptions + lifetime) and Razorpay (one-time Payment Links, monthly/yearly only, INR/USD region pricing). Both webhooks share `claimBillingEvent()` idempotency → `applyPaidPlan()` → license email. Checkout page is provider-aware. See memory `billing-details.md` + `stripe-webhook-patterns.md`.
- **License enforcement**: server-primary (`getLicenseStatus()`, `recordUsage()` re-checks); frontend `LockOverlay` + offline-grace cache (7-day grace, clock-tamper defense). See memory `license-enforcement.md`.
- **Reader (luxor-pdf)**: virtualized page rendering, pdfjs ≥5.6 upsert polyfill, theme menu, settings/recents, side panels, sign-in gating at execution points. See memory `luxor-pdf-reader.md` + `luxor-pdf-virtualization.md` + `reader-feature-gating.md`.
- **Desktop wrappers**: load modes, hardened IPC, icons, GitHub Actions Windows build + web-installer stub, `.pdf` file association. First release v0.1.0 published. See memory `desktop-wrappers.md` + `windows-ci-pnpm.md`.
- **Landing brand**: Indigo/Royal Blue/Coral palette + Luxor red accent; section order and component specifics in memory `landing-brand.md`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
