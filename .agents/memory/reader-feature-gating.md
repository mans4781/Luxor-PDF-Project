---
name: Reader feature gating
description: Which luxor-pdf features are premium and how they must be gated without breaking free/offline reading
---

**Model (current):** Only two reader features are premium — the Edit Text tool and the AI Assistant. They require sign-in AND an active paid plan (`requirePremium(label)` in `AuthGate`, backed by `GET /api/license/status` → `canUsePdfTools`; unknown status fails closed). Everything else (reading, annotations, watermark, page numbers, compress, screenshot, form filling, share, save/export) is free with no login.

**Rule:** Gate premium behavior at the execution point (the export/save function itself), never only at the UI trigger (toolbar button / menu item).

**Why:** UI-only gating in luxor-pdf left bypasses found in review: alternate entry points (keyboard shortcuts, the unsaved-changes dialog's "Save" button) called the output-producing function directly, skipping the gated handler.

**How to apply:** Every save/export/share path that can burn text edits into the output must check for `edittext` annotations and call `requirePremium` when present — that covers exports of edits made while premium, then signed out mid-session. The AI Assistant is also enforced server-side: `/api/ai/summarize` returns 403 (fail-closed) without an active plan. Reading features must stay ungated and offline-capable. Dialog `promptMode` ("signin" vs "upgrade") must be reset on every dismiss path or explicit sign-in can reopen in upgrade mode.
