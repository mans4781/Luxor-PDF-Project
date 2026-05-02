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
- **luxor-desktop** (electron) — Windows desktop wrapper for `pdf-expiry`, packaged as the **Luxor PDF Secure** NSIS installer (no service, no Replit preview)

## Billing (Stripe)

- Provider registry lives in `artifacts/api-server/src/lib/billing.ts`. Stripe is "available" iff `STRIPE_SECRET_KEY` is set; Razorpay/PayPal are stubs (`comingSoon: true`) for the providers endpoint.
- Endpoints: `GET /api/billing/providers`, `POST /api/billing/checkout-session` (Clerk-authed), and `POST /api/billing/webhook` (raw body, mounted on the Express app BEFORE `express.json()` so Stripe signature verification works).
- Per-plan price IDs read from `STRIPE_PRICE_MONTHLY|QUARTERLY|YEARLY|LIFETIME`. Lifetime is `mode: "payment"`, others `mode: "subscription"`.
- Webhook idempotency: `billing_events (provider, event_id)` PK created at startup by `runBillingMigrations()`. `claimBillingEvent()` does INSERT…ON CONFLICT DO NOTHING; duplicates short-circuit before `applyPaidPlan()`.
- `applyPaidPlan()` mints a fresh product key (1-use, attributed to `billing:stripe`), then either extends the user's most-recent license (renewal — base = `max(now, current end)`) or sets `user_licenses.isPaid=true` for first-time activation (the desktop app activates the key on next launch). All in one DB transaction with a `license_renewed`/`license_activated` audit row.
- Frontend wiring: lexsecure-landing pricing page Pro CTA deep-links to `/pdf-expiry/checkout?plan=monthly|yearly`. The pdf-expiry `/checkout` page (Clerk-gated, redirects to sign-in if needed) POSTs to `/api/billing/checkout-session` and `window.location.replace()`s to the returned Stripe URL. LockOverlay's "Renew subscription" button uses the same route, defaulting to the user's previous plan.

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
- Convert tools (run fully client-side in the browser). `ConvertToolContent` accepts a `tabs` prop and a `defaultTab` so each entry point shows only its relevant tabs:
  - **Convert from PDF** sidebar item → 3 tabs: PDF → Images (zip of PNGs via `pdfjs-dist` + `jszip`), PDF → Word (.docx via `docx`), PDF → Excel (.xlsx via `xlsx`/SheetJS, one worksheet per page).
  - **Convert to PDF** sidebar item → 3 tabs: Images → PDF (JPG/PNG/WEBP/GIF/BMP combined via `pdf-lib`), Word → PDF (.docx via `mammoth` → HTML → `jsPDF.html()` with `html2canvas`), Excel → PDF (.xlsx/.xls/.csv via `xlsx` + `jspdf-autotable`, one landscape page per worksheet).
  - The standalone `/convert` route still shows all 6 tabs (defaults to PDF → Images).

## How Expiry Works

The server stores PDFs on disk under `/uploads/`. The `pdfs.expiry_action` column controls post-expiry behavior:
- **corrupt** — On the first post-expiry download, the file on disk is overwritten with random bytes (capped at 64 KB) and served with `Content-Type: application/pdf` and HTTP 200. PDF readers fail to parse it.
- **revoke** — The file is deleted from disk and the endpoint returns HTTP 410 with a JSON `{error, expiredAt}` body.

`parseExpiryDate()` and `isExpired()` accept both new ISO 8601 datetime values and legacy `YYYY-MM-DD` strings, so existing rows keep working. `runPdfMigrations()` adds the `expiry_action` column (`TEXT NOT NULL DEFAULT 'revoke'`) idempotently.

## Schema

- `pdfs` table: id, share_token, original_name, stored_path, file_size, expiry_date, **expiry_action** (`corrupt`|`revoke`, default `revoke`), created_at, updated_at

## Authentication (Clerk) — Suite-wide SSO

- **Single sign-on across the suite**: one Luxor PDF Suite Clerk account works across `pdf-expiry`, `luxor-pdf`, and `esign-app`. Since all three artifacts live on the same domain (different paths), Clerk's session cookie is automatically shared.
- **Auth host**: `pdf-expiry` is the canonical auth host. Its routes `/pdf-expiry/sign-in` and `/pdf-expiry/sign-up` are the only sign-in/sign-up pages in the suite. Other artifacts redirect here for authentication and bounce back via Clerk's native `?redirect_url=<encoded current URL>` query param.
- **Shared lib**: `lib/luxor-auth-ui` (non-composite, consumed via TS source) exports:
  - `LuxorClerkProvider` — wraps `<ClerkProvider>` with the brand `clerkAppearance`/`clerkLocalization` and accepts `signInUrl`/`signUpUrl` overrides + optional `routerPush`/`routerReplace` for the auth host.
  - `AuthMenu` — drop-in widget. Signed-out: "Sign in" + "Create account" buttons (default behavior: navigate to suite-wide auth URLs with `?redirect_url=` so user returns here after auth). Signed-in: Clerk `<UserButton>` avatar dropdown. Has `variant="dark"` for dark backgrounds (luxor-pdf toolbar, esign-app sidebar).
  - `clerkAppearance` / `clerkLocalization` / `SUITE_AUTH_HOST_BASE = "/pdf-expiry"`.
  - Lib declares `@clerk/react` and `@clerk/themes` as `dependencies` (not just peerDeps) so Vite in consumer artifacts can resolve them from the lib's source files. Each consumer artifact's `index.css` adds `@source "../../../lib/luxor-auth-ui/src/**/*.{ts,tsx}";` so Tailwind v4 scans the lib's class names.
- **Server**: `artifacts/api-server/src/app.ts` mounts `clerkProxyMiddleware()` at `CLERK_PROXY_PATH` BEFORE body parsers, then `clerkMiddleware()` after CORS/parsers. `getAuth(req)` available on requests.
- **pdf-expiry** (`src/App.tsx`): uses `LuxorClerkProvider` with local `signInUrl`/`signUpUrl` + wouter `routerPush`/`routerReplace`. Routes `/sign-in/*?` and `/sign-up/*?` use `routing="path"` with full base-path-prefixed `path` props. The header `<AuthMenu>` uses local URLs and `redirectBackOnAuth={false}` so the Clerk pages handle their own internal flow.
- **luxor-pdf** (`src/main.tsx`): wraps `<App>` in `LuxorClerkProvider` (defaults to suite auth host). `<AuthMenu>` shown top-right of `Home.tsx` (light variant) and at end of `Toolbar.tsx` (`variant="dark"`).
- **esign-app** (`src/main.tsx`): wraps `<App>` in `LuxorClerkProvider`. `<AuthMenu variant="dark">` at the bottom of `Sidebar.tsx`, replacing the old "You / Free Plan" placeholder. Sidebar wrapper uses CSS to stack the two buttons vertically in the narrow sidebar.
- **CSS**: `pdf-expiry/src/index.css` has Vite v4 layer order (`@layer theme, base, clerk, components, utilities;`) + `@import "@clerk/themes/shadcn.css"`, plus `tailwindcss({ optimize: false })` in `vite.config.ts` — required for Clerk styles to survive prod builds.
- Auth env vars (auto-set, never commit): `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`. In prod, `VITE_CLERK_PROXY_URL` is set automatically. All three artifacts read the same vars via `publishableKeyFromHost(...)` from `@clerk/react/internal`.
- Home page (`/`) remains publicly accessible per skill guidance — no auth gate on landing.
- Not yet wired: Stripe subscription billing, paywall gating on premium tabs, 11-day grace period logic.

## Electron desktop wrapper (`artifacts/luxor-desktop`)

- Thin Electron shell around the deployed (or bundled) `pdf-expiry` web app. Not registered as a Replit artifact — it has no HTTP service. Built only for Windows (NSIS installer); macOS/Linux are out of scope.
- `package.json` carries the full `electron-builder` config: `appId="com.luxor.pdfsecure"`, `productName="Luxor PDF Secure"`, multi-resolution `build/icon.ico` (16/32/48/64/128/256 generated via ImageMagick from `lexsecure-landing/public/brand/luxor-icon.png`, checked in), NSIS with `oneClick=false`, `allowToChangeInstallationDirectory=true`, Desktop + Start-Menu shortcuts named "Luxor PDF Secure", installer/uninstaller/header icons all set, `deleteAppDataOnUninstall=false` so reinstalling keeps the device id (and license slot).
- Two load modes selected via env at launch/build: `LUXOR_LOAD_MODE=remote` (default → `LUXOR_REMOTE_URL`, default `https://luxorpdf.com/pdf-expiry/`) or `LUXOR_LOAD_MODE=bundled` (→ `web-bundle/index.html` from a built `pdf-expiry`, copied via `extraResources`).
- Hardened `BrowserWindow`: `contextIsolation=true`, `nodeIntegration=false`, `sandbox=true`. The preload (`src/preload.ts`) exposes only `window.luxor = { isDesktop: true, getDeviceId(), getAppInfo() }` via `contextBridge` + IPC. External links open in the system browser (`shell.openExternal`); cross-origin in-app navigation is blocked in remote mode.
- Device id is a UUID v4 stored at `<userData>/device-id.txt` (created on first launch).
- Renderer integration: `pdf-expiry/src/main.tsx` calls `initDeviceIdFromBridge()` on startup — when the bridge is present, the desktop UUID is mirrored into `localStorage["luxor.deviceId"]` so the existing sync `getOrCreateDeviceId()` returns the desktop-bound id. It then calls `setDeviceIdGetter(...)` from `@workspace/api-client-react`, which adds an `X-Device-Id` header to every API request (new helper alongside the existing `setAuthTokenGetter`).
- Scripts: `pnpm --filter @workspace/luxor-desktop run start` (dev — opens the window pointing at the deployed URL), `run dist:win` (builds the `Luxor PDF Secure Setup x.y.z.exe` — requires Windows or Wine; **not** runnable from this Linux dev container), `run icon:regen` (rebuilds `build/icon.ico` from the source PNG).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
