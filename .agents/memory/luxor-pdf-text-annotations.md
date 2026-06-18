---
name: Luxor PDF text annotations (Add-Text vs Edit-Text)
description: Which text overlays get flattened into the exported PDF and which are display-only — matters for any font/color/export work.
---

# Add-Text vs Edit-Text in luxor-pdf

There are two distinct text-editing surfaces, and they behave differently on export:

- **Add-Text tool** (`TextAnnotation`, `type: "text"`, rendered by `DraggableTextBox` + `ActiveTextInput`): these overlays are **display-only**. `pdfExport.ts` / `Viewer.handleDownload()` do **NOT** flatten them into the saved PDF. Only watermark/pageNo/redactions/images/edittext are burned in.
- **Edit-Text tool** (`EditTextAnnotation`, `type: "edittext"`): cover-rect + replacement string, **is** flattened in `pdfExport.ts` (`drawEditTextsOnPage`) using a single hardcoded Helvetica StandardFont.

**Why it matters:** styling controls on Add-Text annotations (font family/size/color) only affect on-screen rendering, never the downloaded file. If a future task asks for exported Add-Text fidelity, you must add explicit `TextAnnotation` flattening in `pdfExport.ts` with a font-key → pdf-lib `StandardFonts` mapping (the `TEXT_FONTS` keys — times/helvetica/courier — map cleanly; georgia/verdana would need approximation).

**How to apply:** Per-annotation style fields are stored as stable keys (e.g. `fontFamily` is a TEXT_FONTS key, not a CSS string) and resolved at render via `fontFamilyCss()` in `annotationColors.ts`. All such fields are optional with a Times fallback for back-compat with older saved annotations.
