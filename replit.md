# Workspace

## User preferences

- **Originality / no-copy requirement (all Luxor products, especially Luxor PDF Reader)**: never copy, clone, or imitate the UI, layout, icons, graphics, colors, wording, workflows, branding, or design system of Adobe Acrobat, Foxit, PDF-XChange, Nitro, Smallpdf, iLovePDF, DocuSign, or any other existing PDF software. Those products may be referenced only for understanding user expectations. All layouts, toolbar/sidebar/panel/modal designs, empty states, loading states, UI copy, labels, error messages, and mock AI/OCR/security/signature workflows must be newly written and original to Luxor PDF. Use only properly licensed open-source libraries (PDF.js, React, TypeScript, Tailwind, Lucide icons, etc.). No copyrighted assets, scraped images, copied SVGs, or copied CSS. Keep the Luxor identity: red document/shield accent, clean white interface, modern dark mode, premium business-software feel.

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
- **luxor-pdf** (react-vite) — Luxor PDF Reader. **Performance/virtualization**: only pages within ~1250px of the viewport render (IntersectionObserver `nearView` in `PDFPage.tsx`); offscreen pages cancel tasks and free canvas bitmaps while keeping CSS size (placeholder size from `defaultPageSize` = page-1 base viewport × zoom, computed in `Viewer.tsx`). DPR clamped to [1,2] and physical canvas capped at 16M pixels (`MAX_CANVAS_PIXELS`); CSS size always tracks zoom. Thumbnails lazy-render (first 12 eager, 600px margin). Print uses a hidden-iframe blob URL of the original file (DOM print would show blank virtualized pages). `src/polyfills.ts` (imported in `main.tsx` and the custom worker entry `src/pdf-worker.ts`, loaded via `GlobalWorkerOptions.workerPort`) polyfills Map/WeakMap `getOrInsertComputed`/`getOrInsert` required by pdfjs-dist ≥5.6 on browsers without TC39 upsert. Toolbar has a **Theme** menu (Light / Sepia / Dark / Night) that themes the reading area via CSS vars (`--viewer-bg`, `--page-bg`, `--page-filter`) and `data-theme` on `<html>`; Night inverts the page canvas. Choice persists in `localStorage["luxor-pdf:theme"]`.
  - **Reader upgrades (commercial-quality pass)**: `lib/settings.ts` (validated/clamped `ReaderSettings` in `localStorage["luxor-pdf:settings"]` — default zoom/view, thumbnails, recents, OCR/AI menu toggles, smooth scroll, resume last page), `lib/recentFiles.ts` (metadata-only recents, max 10, shown on Home with Clear — hidden entirely when `enableRecents` is off), `lib/docFeatures.ts` (metadata/security extraction, scanned-PDF detection; the heavy-file "may load slowly" banner was removed by user request — large PDFs just open, relying on virtualization). Viewer load flow: password-protected PDFs get a `PasswordModal` (pdf.js `onPassword`, reason 2 = wrong password), load failures show a friendly `ErrorScreen` keyed off `err.name`; the load effect's cleanup clears the resume timer and calls `task.destroy()` so rapid file switches can't race. Resume-last-page per doc (`name::size::lastModified` key), fit-to-width/fit-to-page (rotation-aware, clamped 0.25–5), fullscreen (F11 + button), Ctrl+P print shortcut, reading-progress % in the sidebar. Toolbar has a **View** word-menu (fits, fullscreen, panels, Settings). View controls (zoom, page nav + progress %, rotate, fits) render inline in the center of the single top toolbar: Viewer builds the `.view-bar` cluster and passes it to Toolbar via the `viewControls` prop (between two flex spacers) — the old right sidebar and interim second strip are gone; all fixed surfaces offset from `--toolbar-height` only. Side panels (dark `#1e1e1e`, exclusive via `activePanel`): `DocInfoPanel`, `NavPanel` (Outline/Bookmarks/Notes — bookmarks+notes persist per doc in localStorage), `FormsPanel` (real `getFieldObjects` field listing; signing is mock/UI-ready), `OCRPanel` (mock), `AIToolsPanel` (mock, gated via `requireAuth`). `SettingsModal` edits all prefs + shows keyboard shortcuts. `SearchBar` shows "Scanned document — no searchable text" when a scanned doc yields 0 matches.
  - **Sign-in gating** (`src/components/AuthGate.tsx`): reading is free and works offline (open/scroll/zoom/search/print/plain download/read-aloud/themes/split/contents/hand tool). Everything else — annotation tools, watermark, page numbers, add image, compress, screenshot, erase-all, Save As / Save a Copy, and any export with edits burned in — calls `requireAuth(label)` from `useAuthGate()`, which shows a sign-in modal (suite auth host `/pdf-expiry/sign-in?redirect_url=…`) when signed out; offline it shows a "connect to sign in" message with disabled buttons. Enforcement is at execution points, not just UI: `handleDownload` gates the edited-export branch, `resolveCloseIntent("save")` gates before closing, and persisted watermark/pageNo configs are cleared from state+localStorage whenever Clerk reports signed-out.
- **luxor-reader-desktop** (electron, not a Replit artifact) — Windows wrapper for `luxor-pdf`, product name **Luxor PDF Reader** (`com.luxor.pdfreader`). Hybrid loading via `LUXOR_LOAD_MODE`: `auto` (default) loads `https://luxorpdf.com/luxor-pdf/` and falls back to the bundled offline copy (`app://luxor/`, SPA fallback + traversal guard) on `did-fail-load`; `remote`/`bundled` force a mode. `electron-updater` auto-updates from GitHub Releases (publish config: `luxor-pdf/luxor-reader-desktop`). `scripts/build-web-bundle.mjs` builds luxor-pdf with `BASE_PATH=./` into `web-bundle/`. CI: `.github/workflows/reader-desktop-windows.yml` (windows-latest) builds the NSIS installer on manual dispatch or `reader-v*` tags; publishing needs a `GH_RELEASES_TOKEN` secret. **Web-installer stub** (`web-installer/web-setup.nsi` + `download-full.ps1`, built by `run dist:web-stub` → `dist/Luxor PDF Reader Web Setup.exe`, ~200 KB): reads `latest.yml` from the GitHub Releases `latest/download` URL to find the current full installer, downloads it via PowerShell into `$PLUGINSDIR`, and runs it; CI builds it after electron-builder and `gh release upload`s it when publishing. Compiles on Linux too (`makensis` from nixpkgs). Stub is unsigned — SmartScreen warning until code-signed. **Default PDF reader support**: electron-builder `fileAssociations` registers `.pdf` (role Viewer) so the app appears in Windows "Open with"/Default apps (user must confirm the default once — Windows doesn't allow silent takeover). Main process is single-instance; a double-clicked PDF path arrives via `process.argv` (first launch, stored as `pendingPdfPath`) or the `second-instance` argv, is read in main (512 MB cap), and handed to the renderer via `luxor:get-pending-file` (one-shot invoke) / `luxor:open-file` (push event). Preload exposes `getPendingFile()`/`onOpenFile()`; luxor-pdf's `src/lib/desktopBridge.ts` (`initDesktopFileOpen`, wired in `App.tsx`) converts the bytes to a `File` and calls `setFile`.
- **mockup-sandbox** (design) — Canvas component preview server
- **luxor-desktop** (electron) — Windows desktop wrapper for `pdf-expiry`, packaged as the **Luxor PDF Secure** NSIS installer (no service, no Replit preview)

## Billing (Stripe + Razorpay)

- Provider registry lives in `artifacts/api-server/src/lib/billing.ts`. Stripe is "available" iff `STRIPE_SECRET_KEY` is set; Razorpay is "available" iff `RAZORPAY_KEY_ID`+`RAZORPAY_KEY_SECRET` are set (else it falls back to `comingSoon`); PayPal is still a stub (`comingSoon: true`).

### Razorpay (one-time Payment Links)
- `artifacts/api-server/src/lib/razorpay.ts`: `createPaymentLink()` (REST `POST /v1/payment_links`, Basic auth) returns the hosted `short_url`; `verifyRazorpaySignature()` is a timing-safe HMAC-SHA256 check of the raw webhook body.
- Razorpay is a **one-time payment** flow and supports **only the monthly and yearly plans** (`isRazorpayPlan`). The checkout-session branch rejects every other plan (quarterly/lifetime/team/business) for Razorpay — those remain Stripe-only.
- Pricing is **region-based**: INR for India, USD everywhere else. The buyer's currency is detected client-side from the browser timezone (`Asia/Kolkata`/`Asia/Calcutta` → INR, else USD — `detectCurrency()` in `checkout.tsx`), sent as the `currency` field on the checkout request, and re-validated server-side (`normalizeRazorpayCurrency`, default INR). Prices read per plan+currency from `RAZORPAY_PRICE_<PLAN>_<CURRENCY>` — `RAZORPAY_PRICE_MONTHLY_INR`, `RAZORPAY_PRICE_MONTHLY_USD`, `RAZORPAY_PRICE_YEARLY_INR`, `RAZORPAY_PRICE_YEARLY_USD` — in the smallest unit (paise for INR, cents for USD). Razorpay USD charges require International Payments enabled on the Razorpay account.
- `clerkUserId` + `plan` are stored in the link's `notes` and echoed back on the `payment_link.paid` webhook. Webhook mounted at `POST /api/billing/razorpay/webhook` (distinct path, BEFORE `express.json()` so raw bytes survive for the HMAC check). It reuses the shared `claimBillingEvent("razorpay", eventId)` idempotency → `applyPaidPlan()` → `sendLicenseEmail()` pipeline. The idempotency key is **derived from the signed body only** (the payment_link entity id, falling back to the payment entity id) — deliberately NOT the unsigned `x-razorpay-event-id` header, since the HMAC signature covers only the body and a varied header would otherwise allow replay/license-extension abuse.
- Frontend `pdf-expiry/src/pages/checkout.tsx` is **provider-aware**: it reads `/billing/providers`, then uses `?provider=` when that provider is available, else the first available provider, else `"stripe"`. So with only Razorpay configured, checkout automatically routes to Razorpay.
- Required secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, plus per-plan prices `RAZORPAY_PRICE_{MONTHLY,YEARLY}_{INR,USD}` (smallest currency unit). The webhook URL to register in the Razorpay dashboard is `<your-domain>/api/billing/razorpay/webhook` with event `payment_link.paid`.
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
  - `AuthMenu` — drop-in widget. Signed-out: "Sign in" + "Create account" buttons (default behavior: navigate to suite-wide auth URLs with `?redirect_url=` so user returns here after auth); with `iconOnly` it instead renders a small circular profile icon that opens a dropdown with those two actions ("Sign in to unlock editing" hint) — used by luxor-pdf (Home dark, Toolbar theme-aware). Signed-in: Clerk `<UserButton>` avatar dropdown. Has `variant="dark"` for dark backgrounds (esign-app sidebar).
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

## Subscription enforcement (server + offline)

- **Server-side (always primary)**: `getLicenseStatus()` in `artifacts/api-server/src/lib/license.ts` looks up the user's most-recent license with `subscriptionEndDate > now`. If none exists but a previous license has lapsed, returns `lockReason: "subscription_expired"` + `canUsePdfTools: false`. `recordUsage()` re-checks and refuses to increment usage for expired/suspended users, so a malicious client can't fake the gate.
- **Frontend lock**: `LockOverlay` is mounted in `pdf-expiry/src/App.tsx` and renders a full-screen blocking modal whenever `lockReason` is `subscription_expired`, `trial_expired`, or `account_suspended`. Status auto-refetches every 5 min and on window focus, so an in-session expiry locks the UI within 5 min.
- **Offline-grace enforcement** (`pdf-expiry/src/license/offline-cache.ts` + `LicenseProvider`): every successful `/api/license/status` response is cached in `localStorage["luxor.lastLicenseStatus"]` along with the highest `serverTime` ever observed. When the device is offline (`query.isError`):
  - The cached status is used as the rendered status (so the UI keeps working briefly without internet).
  - If the cached `subscriptionEndDate` has now passed by wall-clock time, `LockOverlay` immediately shows "Subscription expired" — the desktop user can no longer dodge a known expiry by unplugging the network.
  - If the cache is older than 7 days (`OFFLINE_GRACE_MS`), `clientLockReason = "offline_too_long"` triggers a "Connect to verify your subscription" lock with no renew/activate buttons.
  - If `Date.now()` is more than 2 h earlier than the highest server time we ever recorded, `clientLockReason = "clock_tampered"` triggers a "System clock check failed" lock — defends against rolling the system clock back to before expiry.
  - A 1-min timer in `LicenseProvider` re-derives the effective state so a user sitting on the lock screen sees it appear the moment grace lapses.
- `useGuardedAction` also short-circuits with the matching toast for any of these conditions before attempting `/api/usage/check`, so even one-off tool actions are blocked offline.
- Cached status is wiped from `localStorage` on sign-out so the next user on a shared device doesn't inherit the previous user's grace clock.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
