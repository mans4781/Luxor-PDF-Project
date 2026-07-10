---
name: Viewer stale-closure save bug
description: Why memoized callbacks in luxor-pdf Viewer must call handlers via a latest-ref, not directly.
---

The rule: in luxor-pdf's Viewer, any memoized callback (useCallback) that triggers export/save must invoke the download/export logic through a latest-value ref (assigned in a useLayoutEffect each render), never by closing over a non-memoized handler directly.

**Why:** "Save As" silently exported the original PDF with no redactions/edits — its useCallback deps didn't include the handler, so it captured a stale closure from the first render where `annotations` was empty, taking the "no edits" early-return path. The bug was invisible: UI showed the redaction, download succeeded, file was unchanged.

**How to apply:** when adding new entry points that save/export (menu items, keyboard shortcuts, dialogs), either route them through `handleDownloadRef.current()` or give the useCallback complete deps. Also note for e2e verification: pdf-lib emits rectangles as move/line path ops + `f`, NOT the `re` operator — byte-level checks for redaction burn-in must not grep for "re f".
