# Threat Model

## Project Overview

This project is a pnpm monorepo for a PDF expiry service with an Express 5 API (`artifacts/api-server`) and several React/Vite frontends, especially the PDF Expiry app (`artifacts/pdf-expiry`) and the Luxor marketing/admin site (`artifacts/lexsecure-landing`). The production deployment exposes the API over `/api` and serves browser clients that upload PDFs, list stored documents, download them before expiry, and view an admin dashboard.

Production assumptions for this scan:
- Replit terminates TLS for deployed traffic.
- `NODE_ENV` is `production` in deployed environments.
- `artifacts/mockup-sandbox` is development-only and should be ignored unless independently shown to be reachable in production.
- Electron/local desktop code is not part of the deployed Replit web surface unless separately packaged and shipped.

## Assets

- **Uploaded PDFs and their contents** — these are the primary sensitive assets. The product markets secure document sharing and expiry, so unauthorized disclosure would directly break the core security promise.
- **Document metadata** — filenames, sizes, expiry dates, creation timestamps, and document IDs reveal operational and potentially confidential information even without the file bytes.
- **Document availability and integrity** — users rely on stored PDFs remaining available until expiry and not being deleted by other parties.
- **Admin analytics data** — visitor counts, storage totals, subscription/revenue figures, geographic breakdowns, and recent activity are business-sensitive.
- **Application secrets and control tokens** — any admin token, database credentials, or future share tokens would grant privileged access.
- **Server disk and database capacity** — unrestricted uploads can exhaust storage or consume backend resources, taking the service offline.

## Trust Boundaries

- **Browser to API** — all client requests cross from an untrusted environment into the Express backend. Every route must treat request headers, bodies, params, and uploaded files as attacker-controlled.
- **API to filesystem** — the API writes uploaded PDFs to the `uploads/` directory and later deletes or serves them. File operations are highly sensitive because they affect confidentiality, integrity, and availability.
- **API to PostgreSQL** — the API persists document metadata and site stats in Postgres via Drizzle. Query results must be scoped correctly before being exposed.
- **Public to privileged/admin** — the public marketing and PDF apps share the same deployment, but admin analytics must be protected separately from public browsing and document-sharing flows.
- **Production to dev-only surfaces** — mockup/design tooling and preview helpers may contain unsafe patterns acceptable for local development, but they must not influence production risk decisions unless reachable from the deployed app.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/**`, `artifacts/pdf-expiry/src/**`, `artifacts/lexsecure-landing/src/**`.
- **Highest-risk code areas:** `artifacts/api-server/src/routes/pdfs/index.ts` (upload/list/download/delete), `artifacts/api-server/src/routes/admin.ts` (admin auth), `artifacts/lexsecure-landing/src/pages/admin.tsx` (public admin client).
- **Public surfaces:** `/api/pdfs*`, `/api/visitors*`, PDF Expiry frontend routes, marketing routes including `/admin` in `lexsecure-landing`.
- **Dev-only areas usually out of scope:** `artifacts/mockup-sandbox/**`; any scanner hits there should be ignored unless production reachability is proven.

## Threat Categories

### Spoofing

The project currently has an admin/non-admin boundary but no robust identity system. Any privileged API or dashboard route must use a server-side authentication mechanism that is not embedded in public client code. Secrets used for admin access MUST come from server-side configuration and MUST NOT be hardcoded in frontend bundles.

### Tampering

Attackers can upload files and call destructive routes directly. The backend MUST ensure that only authorized principals can delete or otherwise modify document records and stored files. Any client-side security settings or PIN gates are advisory only and MUST be backed by server-side enforcement.

### Information Disclosure

This application’s core promise is controlled access to uploaded PDFs. Metadata endpoints, direct download routes, and admin analytics MUST only disclose data to an authorized viewer or to a holder of a strong unguessable share secret. Sequential document IDs alone are not an access-control mechanism, and public routes must not expose all stored documents globally.

### Denial of Service

The upload surface accepts multipart files and persists them to disk. The service MUST bound upload size and rate, and it MUST not allow unauthenticated users to consume unbounded storage or trigger expensive file handling indefinitely. External-facing endpoints that mutate counters or create persistent data should also be rate-limited as appropriate.

### Elevation of Privilege

The most important privilege boundaries are public user vs. document owner/share recipient and public user vs. admin. The API MUST enforce authorization on every document operation and admin route. Hardcoded admin tokens, client-side unlock mechanisms, and publicly callable destructive endpoints violate this guarantee and should be treated as exploitable privilege-escalation paths.