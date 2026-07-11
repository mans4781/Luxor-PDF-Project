---
name: Luxor PDF highlight model
description: Why highlights in the PDF.js canvas reader use a normalized-rect model and how quick-highlight persistence is gated.
---

# Luxor PDF Reader — highlight model & persistence

- Highlights in `artifacts/luxor-pdf` use a **normalized-rect** model (rects stored as fractions of page width/height), NOT a `<mark>`/paragraph-offset DOM model.
  **Why:** PDF.js renders pages to a `<canvas>` with a separate selectable text layer; there is no stable DOM text node tree to anchor `<mark>` wrappers or character offsets against across zoom/rotation/re-render. Rects normalized to page size survive zoom/rotation and re-render. Any future "highlight"/annotation work must adapt to this rect model.

- Per-document highlight persistence is keyed by `name::size::lastModified` (no server, localStorage only) and is **gated** by a `hydratedKey` state in `Viewer.tsx`.
  **Why:** the annotation hook starts empty; without a gate the empty initial state would immediately overwrite stored highlights before the restore effect runs.
  **How to apply:** the save effect must early-return until `hydratedKey === docKey`. Keep this gate if you touch the restore/save effects or add server-side sync.

- Highlights must render on a **dedicated canvas with CSS `mix-blend-mode`**, NOT source-over on the shared annotation canvas.
  **Why:** a translucent source-over fill over the page canvas darkens/tints the letters (black × alpha·colour → muddy), which reads as "text colour diminished". Multiply keeps black text black (0 × colour = 0) while tinting the white page to the exact swatch hue; painting the solid hex at full opacity under multiply gives the exact Edge-style hue with text 100% intact. The live selection overlay already uses this same multiply trick.
  **How to apply:** the highlight canvas sits above the page canvas (z below the draw canvas), `pointer-events:none`, `mix-blend-mode: var(--highlight-blend, multiply)`. Night theme inverts the page (light-on-dark) so `--highlight-blend: screen` (multiply's dual) there. Committed highlights AND the drag preview both paint on this canvas; every other annotation type stays on the shared draw canvas. Note: export/flatten is a separate path and still bakes highlights independently — keep it consistent if you touch it.
