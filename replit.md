# Workspace

## Overview

PDF Expiry Tool — a web application for uploading PDFs, setting an exact expiry date+time, and making them inaccessible afterwards. At upload time the user picks one of two post-expiry behaviors via a popup: **corrupt** (the file is replaced with random bytes so PDF readers can't open it) or **revoke** (the file is deleted and the download endpoint returns 410 Gone).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **File uploads**: multer (disk storage in `/uploads/`)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Artifacts

- **pdf-expiry** (react-vite) — Frontend web app at `/` (port 19050)
- **api-server** (api) — Express backend at `/api` (port 8080)
- **lexsecure-landing** (react-vite) — Luxor PDF marketing site at `/lexsecure-landing/`
- **esign-app** (react-vite) — LexSign eSign app
- **luxor-pdf** (react-vite) — Luxor PDF Reader
- **mockup-sandbox** (design) — Canvas component preview server

## Luxor PDF Landing — brand & layout

- Palette (Scheme 1): Indigo `#312E81`, Royal Blue `#2563EB`, Coral `#FB7185`, plus Luxor red `#DC2626` used sparingly as the security/active accent (matches the LUXOR shield logo).
- Brand assets in `artifacts/lexsecure-landing/public/brand/` — `luxor-icon.png` (512), `luxor-favicon.png` (256). Backgrounds removed via ImageMagick floodfill.
- Section order on `landing.tsx`: Hero → AppPreview → Features → WorkflowGrid → Security (indigo bg, conceptual pillars) → SecurityMetrics (light bg, animated progress bars) → DesktopApp → Testimonials → FAQ → CTA.
- WorkflowGrid (`WorkflowGrid.tsx`) is the "Everything your PDF workflow needs" section — coral lightning eyebrow + 6-card grid (PDF Security, Conversion, Merge, Split & Extract, Permission Control, Image Tools) with indigo card icons, hover lift, framer-motion staggered reveal that respects `useReducedMotion`. Anchor: `#workflow`.
- Hero (`Hero.tsx`) features: stats trio (8+ tools / 256-bit / 24/7) as `<dl>`, plus a floating "Secure PDF" red gradient card overlaying the hero artwork with PRINT/COPY Blocked chips.
- SecurityMetrics (`SecurityMetrics.tsx`) shows four animated progress bars with `role="progressbar"` ARIA and `useReducedMotion` respect.
- Footer (`Footer.tsx`) is a 5-column dark-indigo footer (Brand+Social, Products, Company, Resources, Stay Updated) with coral section headings, lucide social icons, a client-only newsletter form with success toast, mailto links, and a bottom legal bar that includes copyright + animated "All systems operational" indicator + visitor count + 4 legal links. All interactive elements have coral `focus-visible` rings.
- Vite configs across all 5 web artifacts use `strictPort: true` and a `noCacheDevPlugin`; dev scripts kill the port before binding.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- Upload any PDF file (supports large files via multipart/form-data)
- Set an exact expiry **date and time** per PDF (`<input type="datetime-local">`, sent to the server as ISO 8601)
- Choose a post-expiry behavior at upload time via a popup dialog: **corrupt** or **revoke**
- Dashboard with stats (total, active, expired, total size)
- History page with filtering by status; shows expiry date+time and chosen action badge
- Download button — returns actual PDF if active; after expiry behaves per chosen action
- Delete PDF (removes from DB and disk)
- Convert tool (`/convert`) — 4 tabs: Images → PDF, PDF → Images (zip of PNGs), PDF → Word (.docx via `docx`), **PDF → Excel (.xlsx via `xlsx`/SheetJS, one worksheet per page, columns auto-detected from text X positions)**. All conversion runs fully client-side in the browser.

## How Expiry Works

The server stores PDFs on disk under `/uploads/`. The `pdfs.expiry_action` column controls post-expiry behavior:
- **corrupt** — On the first post-expiry download, the file on disk is overwritten with random bytes (capped at 64 KB) and served with `Content-Type: application/pdf` and HTTP 200. PDF readers fail to parse it.
- **revoke** — The file is deleted from disk and the endpoint returns HTTP 410 with a JSON `{error, expiredAt}` body.

`parseExpiryDate()` and `isExpired()` accept both new ISO 8601 datetime values and legacy `YYYY-MM-DD` strings, so existing rows keep working. `runPdfMigrations()` adds the `expiry_action` column (`TEXT NOT NULL DEFAULT 'revoke'`) idempotently.

## Schema

- `pdfs` table: id, share_token, original_name, stored_path, file_size, expiry_date, **expiry_action** (`corrupt`|`revoke`, default `revoke`), created_at, updated_at

## Authentication (Clerk)

- `pdf-expiry` artifact uses Replit-managed Clerk Auth (provisioned via `setupClerkWhitelabelAuth`).
- Server: `artifacts/api-server/src/app.ts` mounts `clerkProxyMiddleware()` at `CLERK_PROXY_PATH` BEFORE body parsers, then `clerkMiddleware()` after CORS/parsers. `getAuth(req)` available on requests.
- Client: `artifacts/pdf-expiry/src/App.tsx` wraps app in `<ClerkProvider>` with branded shadcn theme; routes `/sign-in/*?` and `/sign-up/*?` use `routing="path"` with full base-path-prefixed `path` props.
- Vite v4 layer order set in `index.css` (`@layer theme, base, clerk, components, utilities;`) and `tailwindcss({ optimize: false })` in `vite.config.ts` — required for Clerk styles to survive prod builds.
- Branded SVG logo at `artifacts/pdf-expiry/public/logo.svg`. Appearance object in `src/lib/clerk-appearance.ts` (brand: indigo `#1e3a8a`, red `#DC2626`, Inter font).
- Top-right account UI in `src/components/account-menu.tsx`: signed-out shows "Sign in" + "Create account"; signed-in shows avatar (or initials) dropdown with name/email, "Manage account" (opens Clerk UserProfile modal), and "Sign out".
- Home page (`/`) remains publicly accessible per skill guidance — no auth gate on landing.
- Auth env vars (auto-set, never commit): `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`. In prod, `VITE_CLERK_PROXY_URL` is set automatically.
- Not yet wired: Stripe subscription billing, paywall gating on premium tabs, 11-day grace period logic.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
