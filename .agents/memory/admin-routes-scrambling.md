---
name: Admin routes file is scramble-prone
description: The api-server admin routes file repeatedly ends up with handler bodies swapped between routes; how to detect and recover safely.
---

The large admin routes file is prone to ending up with handler bodies transplanted between routes (support actions dispatching to the wrong function — including destructive ones like user deletion), duplicate route registrations, and out-of-scope variable references. Merges/rebases can silently reintroduce the corruption even after a fix, and commit messages claiming a repair are not reliable evidence.

**Why:** repeated real incidents; the file is 1000+ lines, so bad patch/merge application scrambles it without obvious conflicts.

**How to apply:**
- Treat a clean `tsc --noEmit` in the api-server package as the health signal — the scrambling always produces many type errors. Typecheck before AND after any commit/rebase touching admin routes, and re-verify the file after every rebase onto main.
- To recover, typecheck historical versions of the file to find the last clean one, restore it wholesale, then re-apply only the intended changes.
- Invariants to re-verify after any repair: reissue, reissue-email, detach (`/:userId/license`), and delete (`/:userId`) must each be registered exactly once and dispatch to their matching lib function; the reissue-email endpoint must keep its key-ownership check (active license row referencing the key, or the latest reissue event's key id).
