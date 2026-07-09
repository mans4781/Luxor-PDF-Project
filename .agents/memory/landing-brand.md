---
name: Luxor landing brand & layout
description: Palette, section order, and component specifics of lexsecure-landing.
---

- Palette (Scheme 1): Indigo `#312E81`, Royal Blue `#2563EB`, Coral `#FB7185`; Luxor red `#DC2626` sparingly as security/active accent (matches shield logo).
- Brand assets `artifacts/lexsecure-landing/public/brand/`: `luxor-icon.png` (512), `luxor-favicon.png` (256); backgrounds removed via ImageMagick floodfill.
- `landing.tsx` section order: Hero → AppPreview → Features → WorkflowGrid → Security (indigo, conceptual pillars) → SecurityMetrics (light, animated bars) → DesktopApp → Testimonials → FAQ → CTA.
- `WorkflowGrid.tsx` ("Everything your PDF workflow needs", anchor `#workflow`): coral lightning eyebrow + 6-card grid (PDF Security, Conversion, Merge, Split & Extract, Permission Control, Image Tools), indigo icons, hover lift, framer-motion stagger respecting `useReducedMotion`.
- `Hero.tsx`: stats trio (8+ tools / 256-bit / 24/7) as `<dl>` + floating "Secure PDF" red gradient card with PRINT/COPY Blocked chips.
- `SecurityMetrics.tsx`: four progress bars, `role="progressbar"` ARIA, `useReducedMotion`.
- `Footer.tsx`: 5-column dark-indigo (Brand+Social, Products, Company, Resources, Stay Updated), coral headings, lucide social icons, client-only newsletter form with toast, mailto links, legal bar (copyright + animated "All systems operational" + visitor count + 4 legal links). Coral `focus-visible` rings everywhere.
- All 5 web artifacts' Vite configs: `strictPort: true` + `noCacheDevPlugin`; dev scripts kill the port before binding.
