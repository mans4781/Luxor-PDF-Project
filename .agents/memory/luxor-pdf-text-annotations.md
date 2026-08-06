---
name: Luxor PDF text annotations (Add-Text vs Edit-Text)
description: How Add-Text and Edit-Text overlays are anchored and flattened into exported PDFs — matters for any font/color/zoom/export work.
---

# Add-Text vs Edit-Text in luxor-pdf

Two distinct text-editing surfaces:

- **Add-Text tool** (`TextAnnotation`, `type: "text"`, rendered by `DraggableTextBox` + `ActiveTextInput`): now zoom-stable and **flattened on export**. Each annotation carries `norm: {x, y, size}` — x & font size are fractions of page *width*, y is a fraction of page *height* (screen convention, origin top-left). Rendering, drag, and font-size changes all read/write `norm`; `pdfExport.ts` `drawTextsOnPage()` flattens norm-bearing annotations into every export path (download, save-copy, share, filled-form) with a TEXT_FONTS-key → base-14 `StandardFonts` mapping (georgia→TimesRoman, verdana→Helvetica, `local:*`→TimesRoman), multiline via `\n`, 1.485 line-height, underline/strikethrough drawn as lines.
- **Edit-Text tool** (`EditTextAnnotation`, `type: "edittext"`): cover-rect + replacement string, flattened via `drawEditTextsOnPage` in hardcoded Helvetica.

**Why it matters:** any change to Add-Text on-screen metrics (line-height 1.485, padding) must be mirrored in `drawTextsOnPage()` or exported text drifts from what the viewer shows. Annotations *without* `norm` are skipped at export — safe because text annotations are session-only (only highlights persist), so every live annotation gets `norm` at creation or via the lazy per-page migration when its page renders.

## Edge-like composing UX (Add-Text)

The composer (ActiveTextInput) is draggable via a handle bar; blur commits at the final dragged position. Three invariants keep the flow clean: (1) commit/cancel exactly once — a once-flag guards blur, since the browser can re-fire blur during textarea unmount, silently duplicating annotations; (2) the text-tool click-catcher must swallow exactly one click after a commit (flag set on mousedown while a textarea is focused, consumed unconditionally on the next click — a stale flag must never eat a later click); (3) outside-click deselect for committed boxes uses a **capture-phase** document listener, because overlays between the box and document can stop mousedown propagation, leaving the box selected forever. Escape cancels (reverts) in both the composer and re-edit; commit also clears selection.

**How to apply:** Per-annotation style fields are stored as stable keys (e.g. `fontFamily` is a TEXT_FONTS key, not a CSS string) and resolved at render via `fontFamilyCss()` in `annotationColors.ts`. All such fields are optional with a Times fallback. When adding new anchored overlay types, follow the same `norm`-fraction pattern rather than raw pixels — raw pixel coords break on zoom and cannot be exported.
