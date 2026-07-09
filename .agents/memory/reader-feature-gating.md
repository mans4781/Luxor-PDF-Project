---
name: Reader feature gating
description: How luxor-pdf gates premium features behind sign-in without breaking free/offline reading
---

**Rule:** Gate premium behavior at the execution point (the export/save function itself), never only at the UI trigger (toolbar button / menu item).

**Why:** UI-only gating in luxor-pdf left two bypasses found in review: (1) watermark/page-number configs persist in localStorage and rehydrate on load, so the *free* download path would burn them into the export for a signed-out user; (2) the unsaved-changes dialog's "Save" button called the download function directly, skipping the gated Save As handler.

**How to apply:** Any new premium feature in the reader must (a) call `requireAuth` inside the function that produces the output, and (b) ensure persisted premium state is cleared/ignored when Clerk reports signed-out. Keyboard shortcuts and confirmation dialogs are alternate entry points — gating inside the shared handler covers them all. Reading features (open, scroll, search, print, plain download, read-aloud, themes) must stay ungated and offline-capable.
