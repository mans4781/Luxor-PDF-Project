---
name: Luxor PDF Reader virtualization & pdfjs compat
description: Constraints to respect when touching luxor-pdf page rendering, print, or pdfjs-dist upgrades.
---

## Page render virtualization
Only pages near the viewport (~1250px margin) hold live canvases/text layers; offscreen pages free their bitmaps but keep CSS dimensions.
**Why:** pre-fix, every page rendered eagerly at ≥2× DPR — a 100-page PDF allocated ~1.7GB of canvases and hung the tab.
**How to apply:** anything that reads a page's canvas (screenshot, redact, export) must only assume the canvas is populated for near-view pages, or render the page itself via pdfjs. DOM-based printing is broken by design — print must go through the hidden-iframe blob-URL path (original file), not `window.print()`.

## Canvas scale cap
Physical canvas is capped (`MAX_CANVAS_PIXELS` = 16M px, DPR clamped to [1,2]); CSS size always tracks zoom exactly.
**Why:** huge page × high zoom × retina DPR would otherwise allocate tab-freezing canvases.

## pdfjs-dist ≥5.6 needs TC39 upsert polyfill
pdfjs-dist 5.6 calls `Map.prototype.getOrInsertComputed` on BOTH the main thread and inside the worker. Browsers without it render nothing (TypeError, blank pages).
**How to apply:** keep `src/polyfills.ts` imported first in `main.tsx` AND in the custom worker entry `src/pdf-worker.ts` (worker loads via `GlobalWorkerOptions.workerPort`, not `workerSrc`). Re-verify on any pdfjs upgrade.
