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
