# Workspace

## Overview

PDF Expiry Tool — a web application for uploading PDFs, setting expiry dates, and making them inaccessible after those dates. After the expiry date, downloading a PDF returns corrupted/invalid binary data that no PDF reader can open.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **File uploads**: multer (disk storage in `/uploads/`)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Artifacts

- **pdf-expiry** (react-vite) — Frontend web app at `/` (port 19050)
- **api-server** (api) — Express backend at `/api` (port 8080)
- **lexsecure-landing** (react-vite) — Luxor PDF marketing site at `/lexsecure-landing/`
- **esign-app** (react-vite) — LexSign eSign app
- **luxor-pdf** (react-vite) — Luxor PDF Reader
- **mockup-sandbox** (design) — Canvas component preview server

## Luxor PDF Landing — brand & layout

- Palette (Scheme 1): Indigo `#312E81`, Royal Blue `#2563EB`, Coral `#FB7185`, plus Luxor red `#DC2626` used sparingly as the security/active accent (matches the LUXOR shield logo).
- Brand assets in `artifacts/lexsecure-landing/public/brand/` — `luxor-icon.png` (512), `luxor-favicon.png` (256). Backgrounds removed via ImageMagick floodfill.
- Section order on `landing.tsx`: Hero → AppPreview → Features → Security (indigo bg, conceptual pillars) → SecurityMetrics (light bg, animated progress bars) → DesktopApp → Testimonials → FAQ → CTA.
- Hero (`Hero.tsx`) features: stats trio (8+ tools / 256-bit / 24/7) as `<dl>`, plus a floating "Secure PDF" red gradient card overlaying the hero artwork with PRINT/COPY Blocked chips.
- SecurityMetrics (`SecurityMetrics.tsx`) shows four animated progress bars with `role="progressbar"` ARIA and `useReducedMotion` respect.
- Footer (`Footer.tsx`) is a 5-column dark-indigo footer (Brand+Social, Products, Company, Resources, Stay Updated) with coral section headings, lucide social icons, a client-only newsletter form with success toast, mailto links, and a bottom legal bar that includes copyright + animated "All systems operational" indicator + visitor count + 4 legal links. All interactive elements have coral `focus-visible` rings.
- Vite configs across all 5 web artifacts use `strictPort: true` and a `noCacheDevPlugin`; dev scripts kill the port before binding.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- Upload any PDF file (supports large files via multipart/form-data)
- Set expiry date per PDF
- Dashboard with stats (total, active, expired, total size)
- History page with filtering by status
- Download button — returns actual PDF if active, corrupted binary if expired
- Delete PDF (removes from DB and disk)

## How Expiry Works

The server stores PDFs on disk under `/uploads/`. On download:
- If the current date is before or equal to the expiry date → serve the real PDF
- If past expiry → serve a garbage binary with a `.pdf` extension that no reader can open

## Schema

- `pdfs` table: id, original_name, stored_path, file_size, expiry_date, created_at, updated_at

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
