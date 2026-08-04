---
name: pdf.js WASM image decoders
description: JPEG2000/JBIG2 images render blank unless getDocument gets a wasmUrl
---
pdf.js 5.x decodes JPXDecode (JPEG2000) and JBIG2 images with WASM decoders it fetches at runtime. Without the `wasmUrl` getDocument option, the fetch silently fails and those images render as blank white areas (scanned permits/maps are the classic case).

**Why:** User's desktop reader showed blank maps in a permit PDF (160 JPX images). Fix was serving `pdfjs-dist/wasm/*` from `public/wasm/` and passing `wasmUrl` (absolute URL ending in `/` — the fetch happens in the worker, so relative paths don't resolve) into EVERY getDocument call (viewer, print, compress).

**How to apply:** Any new getDocument call in luxor-pdf must include `wasmUrl: PDF_WASM_URL` from `src/lib/pdfWasm.ts`. When upgrading pdfjs-dist, re-copy `node_modules/pdfjs-dist/wasm/` into `public/wasm/`. Node-based tests can't validate this (OpenJPEG fails to init under Node); verify in a real browser.
