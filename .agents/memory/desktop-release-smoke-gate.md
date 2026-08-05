---
name: Desktop release smoke gate
description: Why the reader desktop release CI gates publishing on an automated frameless-window smoke test, and its constraints.
---

Reader desktop releases are gated by an automated frameless-window smoke test that runs before the installer is built/published; the CI step is mandatory and must not be removed or reordered after publish.

**Why:** the frameless window's drag zones and caption buttons regressed silently before (overlays inside a drag strip inherit `-webkit-app-region: drag`), and manual checks were the only defense.

**Constraint (hard-learned):** Playwright's Electron launcher can only drive the *development* Electron binary — it must inject its bootstrap loader at launch, so it cannot attach to a packaged `.exe` (passing `executablePath` to a built app silently fails to connect). Gate the compiled app (`electron .` with the offline bundle) instead, and keep installer-level behavior on a manual checklist.

**How to apply:** if renderer selectors the smoke test depends on change, update the smoke test in the same PR rather than weakening or skipping the CI gate.
