---
name: Task-merge scrambling of admin routes
description: Platform task-agent merges have twice scrambled artifacts/api-server/src/routes/admin.ts; how to detect and recover.
---

Task-agent merges into main have repeatedly corrupted `artifacts/api-server/src/routes/admin.ts` (Aug 2026, twice): the merge splices unrelated hunks into wrong routes (e.g. `days`, `dayMap`, wrong schema parsers) and can truncate the file mid-statement after `export default router;`.

**Why:** appears to be the platform's semantic merge misapplying diffs to this large route file; the task agent's own branch commits are clean.

**How to apply:** after ANY task merge touching api-server, run `npx tsc --noEmit` in `artifacts/api-server` before trusting the merge. To recover: find the task agent's clean commit in `git log --all` (subrepl branches / same-message pre-merge commit), diff it against its parent, and restore files from the clean commit or the pre-merge main (`gitsafe-backup/main`) — usually the intended admin.ts delta is small or zero.
