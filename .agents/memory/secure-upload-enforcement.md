---
name: Secure upload enforcement
description: Why the PDF secure/expiry feature must be gated on the upload endpoint itself, not only via the usage endpoints.
---

# Secure (Password & Expiry) is paid-only — enforce on the upload route

The "secure" category (password protect / set expiry / revoke expiry / copy & print
restriction) is a paid-only feature, excluded from the free trial.

`/api/usage/check` and `/api/usage/record` gate the secure category for non-paid
users, but those calls are **advisory client-side calls**. The actual secure action
is performed by `POST /api/pdfs/upload` (it creates the expiry-protected, share-tokened
PDF). Gating only the usage endpoints is bypassable: a client can skip them and hit
`/pdfs/upload` directly.

**Rule:** `POST /api/pdfs/upload` must itself require a signed-in, `isPaid` user
(middleware `requirePaidForSecureUpload`, runs before Multer so unauthorized requests
never write to disk). Non-paid → `403 { lockReason: "premium_feature" }`;
unauthenticated → `401`.

**Why:** matches the threat model — "client-side security settings MUST be backed by
server-side enforcement." Without this, a trial/anonymous user could create
expiry-protected PDFs for free.

**How to apply:** any future secure-only server action (new secure routes) must carry
its own server-side paid check via `getLicenseStatus(userId).isPaid`, not rely on the
usage endpoints.

# Online tools (Edit/Convert/Compress) are FREE — no sign-in, no quota

The client-side online tools (`pdf-tool`, `convert-tool`, `compress-pdf`) are free for
everyone. They opt out of both gates by passing `{ bypass: true }` to
`useUploadAuthGate` and `useGuardedAction` (both hooks default `bypass:false`).
`secure-pdf` (Password & Expiry) deliberately does NOT bypass — it stays paid/gated.

**Why:** these tools run fully in the browser (no server work), so gating them added no
security value; only the secure/expiry flow (which writes server-side) needs enforcement.

**How to apply:** never globally neuter the two gate hooks — flip `bypass` only at the
free tools' call sites. Keep `secure-pdf` un-bypassed.
