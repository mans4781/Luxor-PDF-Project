---
name: Luxor invoice template — canonical default
description: Bold Branded is the one design for every Luxor PDF invoice/receipt; it is now data-driven with India (INR) default and an International (USD) variant.
---

# Canonical invoice template

The **Bold Branded** design is the permanent, only invoice/receipt design for the Luxor
PDF Suite. The user picked it over six other explored variants and locked it in as the
default. There is one shared design; regions differ only in *data*, never in layout.

**Why:** User reviewed 7 invoice designs on the canvas, chose Bold Branded, had all other
variants deleted, and asked to keep it as the default forever. Later they asked for
international support: outside India everyone pays in **USD** (India keeps ₹/GST/Razorpay).

**How to apply:**
- For any Luxor invoice / payment receipt / license receipt, use the Bold Branded design.
  Do NOT reintroduce the other variants (Minimal, Classic Professional, Obsidian, Aurora,
  Editorial, Midnight Royal) unless the user explicitly asks for alternatives again.
- The design is data-driven: one shared `InvoiceTemplate` component takes an `InvoiceData`
  object. Region wrappers render it with a dataset — India (INR/GST/GSTIN/Razorpay) is the
  default; International is USD with **no tax row and no tax-id row** and card/Stripe
  payment. Add new regions by adding a dataset + thin wrapper, never by forking the layout.
- Tax and tax-id rows are optional in the data contract; suppress both together when a
  region has no sales tax (e.g. the USD invoice), and keep total-row spacing tied to the
  same "has tax row" predicate so layout doesn't drift.
- The mockup preview maps one file → one route, so each region needs its own wrapper file
  for a distinct preview/PDF page.

**User-approved design choices baked in (keep unless told otherwise):**
- "PAID" mark is a white-bordered square box with white text in the dark header, directly
  below the invoice number (NOT a rotated red stamp, NOT near Payment Details).
- License-key row has a larger, light-indigo (indigo-300) copy icon to the right of the key.
- Seats line reads "1 User / 2 Devices"; validity uses an em-dash range.
