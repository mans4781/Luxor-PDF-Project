---
name: Luxor PDF Reader (luxor-pdf artifact)
description: Virtualization/perf model, reader settings, panels, theming, and sign-in gating for the luxor-pdf web app.
---

## Performance / virtualization
- Only pages within ~1250px of the viewport render (IntersectionObserver `nearView` in `PDFPage.tsx`); offscreen pages cancel render tasks and free canvas bitmaps while keeping CSS size (placeholder size from `defaultPageSize` = page-1 base viewport × zoom, computed in `Viewer.tsx`).
- DPR clamped to [1,2]; physical canvas capped at 16M pixels (`MAX_CANVAS_PIXELS`); CSS size always tracks zoom.
- Thumbnails lazy-render (first 12 eager, 600px margin).
- Print uses a hidden-iframe blob URL of the original file — DOM print would show blank virtualized pages.
- `src/polyfills.ts` (imported in `main.tsx` and custom worker entry `src/pdf-worker.ts`, loaded via `GlobalWorkerOptions.workerPort`) polyfills Map/WeakMap `getOrInsertComputed`/`getOrInsert` required by pdfjs-dist ≥5.6 on browsers without TC39 upsert.

## Theming
- Toolbar **Theme** menu (Light/Sepia/Dark/Night) themes the reading area via CSS vars (`--viewer-bg`, `--page-bg`, `--page-filter`) + `data-theme` on `<html>`; Night inverts the page canvas. Persists in `localStorage["luxor-pdf:theme"]`.

## Reader upgrades (commercial-quality pass)
- `lib/settings.ts`: validated/clamped `ReaderSettings` in `localStorage["luxor-pdf:settings"]` (default zoom/view, thumbnails, recents, OCR/AI menu toggles, smooth scroll, resume last page). `SettingsModal` edits all prefs + shows keyboard shortcuts.
- `lib/recentFiles.ts`: metadata-only recents, max 10, on Home with Clear; hidden entirely when `enableRecents` off.
- `lib/docFeatures.ts`: metadata/security extraction, scanned-PDF detection. Heavy-file "may load slowly" banner removed by user request — large PDFs just open.
- Load flow: password PDFs → `PasswordModal` (pdf.js `onPassword`, reason 2 = wrong password); failures → `ErrorScreen` keyed off `err.name`; load-effect cleanup clears resume timer and calls `task.destroy()` so rapid file switches can't race.
- Resume-last-page per doc (`name::size::lastModified` key), rotation-aware fit-to-width/page (zoom clamped 0.25–5), fullscreen (F11 + button), Ctrl+P, reading-progress % in sidebar.
- Single top toolbar: Viewer builds the `.view-bar` cluster (zoom, page nav + progress %, rotate, fits) and passes it to Toolbar via `viewControls` prop between two flex spacers. All fixed surfaces offset from `--toolbar-height` only.
- Side panels (dark `#1e1e1e`, exclusive via `activePanel`): `DocInfoPanel`, `NavPanel` (Outline/Bookmarks/Notes — persisted per doc in localStorage), `FormsPanel` (real `getFieldObjects`; signing mock/UI-ready), `OCRPanel` (mock), `AIToolsPanel` (mock, gated via `requireAuth`).
- `SearchBar` shows "Scanned document — no searchable text" when a scanned doc yields 0 matches.

## Sign-in gating (`src/components/AuthGate.tsx`)
- Reading is free/offline (open/scroll/zoom/search/print/plain download/read-aloud/themes/split/contents/hand tool).
- Everything else (annotations, watermark, page numbers, add image, compress, screenshot, erase-all, Save As/Copy, edited exports) calls `requireAuth(label)` from `useAuthGate()` → sign-in modal (suite auth host `/pdf-expiry/sign-in?redirect_url=…`); offline shows "connect to sign in".
- Enforcement at execution points, not just UI: `handleDownload` gates the edited-export branch, `resolveCloseIntent("save")` gates before closing, persisted watermark/pageNo configs cleared from state+localStorage when Clerk reports signed-out.
