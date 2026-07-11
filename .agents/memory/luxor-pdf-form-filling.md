---
name: Luxor PDF interactive form filling (AcroForm)
description: How live fillable-form widgets render and export in the luxor-pdf reader, and the security constraints that must hold.
---

# Interactive AcroForm form filling (luxor-pdf reader)

Live fillable-form support in the reader: pdf.js renders native form widgets that
the user types/checks/selects, and values serialize back into a real PDF.

## How it works
- Widgets render via a pdf.js `AnnotationLayer` (`renderForms:true`) bound to the
  shared `pdfDocument.annotationStorage`. The storage is the single source of
  truth for entered values, so they survive page virtualization and zoom.
- The canvas page render uses `annotationMode: 2` (ENABLE_FORMS) so form-field
  appearances are NOT painted onto the canvas — otherwise they double-draw behind
  the interactive HTML inputs.
- The form layer is rebuilt on the page-render lifecycle (same deps as canvas/text
  layers), never on every keystroke; far pages release their layer DOM.
- A `formFillMode` toggle (Viewer state, surfaced in FormsPanel) adds/removes the
  pdfjs `disabled` class on the layer wrapper to gate pointer events.
- Export: `pdfDoc.saveDocument()` returns filled bytes. If other edits exist
  (watermark/pageNo/redactions/images/editTexts) they overlay via
  `exportPdfWithEdits(file, { ..., sourceBytes: filled })` — the optional
  `sourceBytes` override burns edits into the already-filled bytes instead of the
  original file. Download is `requireAuth`-gated; `formFillMode` resets on sign-out.

## Security constraints (do not regress)
**Why:** the annotation layer can render any annotation subtype, and a hostile PDF
can carry `javascript:`/`data:` link annotations. A code review flagged an early
version that wrote PDF-controlled URLs straight into an anchor `href`.
**How to apply:**
- Filter `page.getAnnotations()` to `subtype === "Widget"` before rendering — the
  feature is form input only, never link navigation.
- The link-service stub must stay inert: `externalLinkEnabled:false`,
  `addLinkAttributes` must never write the PDF-supplied URL into `href` (strip the
  href, disable pointer events). Do not swap in a navigating link service.

## Requires
- `pdfjs-dist/web/pdf_viewer.css` imported in main.tsx before index.css (annotation
  layer styling). The reader's more-specific `.pdf-page-wrapper .textLayer` rules
  still win, so the text layer is unaffected.
