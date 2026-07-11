---
name: Online tools registry & per-tool pages
description: How pdf-expiry exposes all client-side tools as one registry, a mega menu, and dedicated /tools/:slug pages
---

# Online tools registry (pdf-expiry)

Every client-side tool in pdf-expiry (Organise, Convert-from-PDF, Convert-to-PDF, Compress)
is exposed two ways from a single source of truth: a header mega menu and dedicated
per-tool pages. The registry is the seam — add a tool there and it appears in both places
plus gets a route automatically.

**Pattern:** the underlying tool UIs live in `pages/convert-tool.tsx`, `pages/pdf-tool.tsx`,
and `pages/compress-pdf.tsx`. Each reusable sub-component is exported and made
configurable via props so ONE component serves many focused pages:
- `PdfToImages({ fixedFormat })` — skips the format-picker dialog and converts directly.
- `ImagesToPdf({ acceptTypes, accept, label, hint })` — restrict to one input image type.
- `CompressToSize({ bytes, label })` — single-target compressor (vs. the multi-target hub).

`lib/tools-registry.tsx` maps each tool to `{ slug, category, title, subtitle, icon, accent, render }`.
`pages/tool-page.tsx` renders `/tools/:slug` generically; `pages/online-tools.tsx` is the grid;
`components/mega-menu.tsx` is the 4-column header dropdown.

**Why:** keeps 30+ tools DRY and consistent; the registry is the only place to edit.
**How to apply:** to add/rename a tool, edit the registry only — do not hand-write new pages.

## Gotchas
- **Duplicate-by-design slugs**: PDF→Jpeg vs PDF→Jpg (both `image/jpeg`) and jpeg-to-pdf vs
  jpg-to-pdf are intentionally separate entries for discoverability; same underlying behavior.
- **BMP/GIF need custom encoders**: `canvas.toBlob()` can't emit BMP or GIF. `lib/raster-encode.ts`
  hand-rolls a 24-bit BMP and uses `gifenc` (has no types → local `src/types/gifenc.d.ts`).
- **ArrayBuffer→Blob TS friction**: `Uint8Array<ArrayBufferLike>` isn't a `BlobPart` under this
  TS lib; use `new Uint8Array(bytes).buffer` before `new Blob([...])`. NOTE: the rest of pdf-expiry
  still has ~10 pre-existing baseline typecheck errors of this same shape (plus `expiryAction` in
  secure-pdf.tsx) — the app runs via Vite/esbuild which doesn't block on them.
