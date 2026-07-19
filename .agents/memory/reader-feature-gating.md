---
name: Reader feature gating
description: Which luxor-pdf features are premium and how they must be gated without breaking free/offline reading
---

**Model (current):** Premium = the AI Assistant, ALL Tools-menu features (page ops, crop, compress, watermark, page numbers, redact, whiteout, restrict, edit text, add image, snapshot, read aloud, OCR, reader settings), Cloud shape, Squiggly underline, and stamp *placement* (stamp sets stay browsable free). Premium requires sign-in AND an active paid plan (`requirePremium(label)` in `AuthGate`, backed by `GET /api/license/status` → `canUsePdfTools`; unknown status fails closed). `hasPremium` in the AuthGate context is advisory only (grey styling + Premium badge; true in dev builds). Reading and basic annotation (highlight, underline, strike, pen, basic shapes, sticky notes) stay free with no login.

**Rule:** Gate premium behavior at the execution point (the export/save function itself), never only at the UI trigger (toolbar button / menu item).

**Why:** UI-only gating in luxor-pdf left bypasses found in review: alternate entry points (keyboard shortcuts, the unsaved-changes dialog's "Save" button) called the output-producing function directly, skipping the gated handler.

**How to apply:** Protect gating lives in three places: (1) tool activation — `handleToolChange` gates `redact`/`whiteout`; (2) watermark apply — `WatermarkModal onApply` calls `requirePremium("Watermark")`; (3) every save/export/share path checks `redact`-type annotations (whiteout is stored as `type:"redact"`, `fill:"white"`) OR `watermarkCfg !== null` and calls `requirePremium("Protect features")` — that covers edits made while premium, then signed out mid-session. The AI Assistant is also enforced server-side: `/api/ai/summarize` returns 403 (fail-closed) without an active plan. Reading features must stay ungated and offline-capable. Dialog `promptMode` ("signin" vs "upgrade") must be reset on every dismiss path or explicit sign-in can reopen in upgrade mode.
