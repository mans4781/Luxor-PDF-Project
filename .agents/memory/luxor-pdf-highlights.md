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
