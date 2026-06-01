---
name: Canvas iframe stuck in "failed" state
description: Mockup iframe shows "not opening" on canvas despite the component rendering fine
---

When a DESIGN subagent finishes a mockup variant and marks its canvas iframe live, the iframe can occasionally end up in `state: "failed"` with an empty `url` — the user reports "Nth design is not opening".

**Why:** the subagent's iframe screenshot/verify step or a transient load can flip the shape to "failed"; it's a canvas-shape state problem, not a code problem. The component file is fine.

**How to apply:** Don't rebuild the component. Confirm the preview returns HTTP 200 (`curl localhost:80/__mockup/preview/<folder>/<Comp>`), then `applyCanvasActions` `update` the shape back to `state: "live"` with the correct `url`, `componentPath`, `componentName`. `getCanvasState` reveals the `state: "failed"` + empty url. Seen repeatedly across invoice variants (2nd and 4th).
