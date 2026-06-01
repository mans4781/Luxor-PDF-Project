---
name: Luxor invoice template — canonical default
description: Bold Branded is the one-and-only invoice/receipt template for the Luxor PDF Suite; user locked it in as default forever.
---

# Canonical invoice template

The **Bold Branded** invoice is the permanent, default invoice/receipt template for the
Luxor PDF Suite. The user explicitly chose it over six other explored variants and asked
to keep only this one going forward.

**Why:** User reviewed 7 invoice designs on the canvas, picked Bold Branded ("I like this
one"), then had all other variants deleted from the directory and canvas. They then asked
to "make this default invoice template forever."

**How to apply:**
- When generating, editing, or referencing an invoice / payment receipt / license receipt
  for Luxor PDF, use Bold Branded. Do NOT reintroduce the other variants (Minimal,
  Classic Professional, Obsidian, Aurora, Editorial, Midnight Royal) unless the user
  explicitly asks for alternatives again.
- Source component: `artifacts/mockup-sandbox/src/components/mockups/luxor-invoices/BoldBranded.tsx`
  (it is the only file left in that directory by design).
- Single-page A4 PDF is produced by the `@workspace/scripts` `invoices:pdf` script
  (`scripts/src/generate-invoice-pdf.ts`), which renders the component via Chromium's
  native `page.pdf({format:"A4"})` and merges with pdf-lib `copyPages` for max viewer
  compatibility. Output: `scripts/dist/luxor-invoices-A4.pdf`.

**User-approved design choices baked into this template (keep unless told otherwise):**
- "PAID" mark is a white-bordered square box with white text, placed in the dark header
  directly below the invoice number (NOT a rotated red stamp, NOT near Payment Details).
- License-key row has a larger, light-indigo (indigo-300) copy icon to the right of the key.
- Seats line reads "Seats: 1 User / 2 Devices".
- Validity uses an em-dash range: "Valid: 01 Jun 2026 — 01 Jun 2027".
