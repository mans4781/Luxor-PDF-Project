---
name: Git push limits in this workspace
description: What works and what fails when pushing to GitHub (Luxor-PDF-Project) from this repl
---

# Git push limits

- Shell `git push` to GitHub fails with "Invalid username or token" — the askpass credentials are not valid for this repo. Don't retry.
- The `gitPush` CodeExecution callback (git-remote skill) requires the remote to be named `origin` (rename if needed) and **can only create new branches**. Pushing to an existing branch (`main`) fails with `BRANCH_ALREADY_EXISTS`, and it cannot push tags.
- **How to release:** push a fresh branch via `gitPush`, then have the user merge it into `main` on GitHub and create the `reader-v*` tag via GitHub Releases UI (that triggers the Windows installer CI). Or user pushes via the Replit Git pane.
- Stale `.git/*.lock` files (maintenance.lock, refs locks) cause `INDEX_LOCKED` from gitPush — safe to delete when no git process is running.
- Remote `main` had 2 old release commits not in local history; resolved once with `git merge -X ours origin/main` (watch out: merge can silently reintroduce deleted imports in files touched on both sides — re-typecheck after).
- gitPush fails with "current branch already tracks origin/<other>" after a prior push — run `git branch --unset-upstream main` first, then gitPush({branch:"new-branch"}) works.

- 2026-08-11: `gitPush` now fails with `PUSH_REJECTED` even for brand-new branch names (tried 3 fresh names after gc). Shell push still "Invalid username or token". No known agent-side workaround — releases must go through the user's Replit Git pane (commit & push main, then tag on GitHub).
- RESOLVED 2026-08-12: root cause of all push failures was the user's expired fine-grained PAT ("luxor-push"). User regenerated it and saved it as secret `GITHUB_PUSH_TOKEN`. Working push: `GIT_ASKPASS` script (username `x-access-token`, password `$GITHUB_PUSH_TOKEN`) + `git push origin main` from shell. Agent CAN now push directly, including main.
- 2026-08-11 (later): user reconnected GitHub in Replit account settings; user's Git pane push STILL fails ("Failed to authenticate" then generic rejection) and `gitPush` still returns PUSH_REJECTED on fresh branches. Fetch works (read OK, write blocked). Verified locally: clean tree, ahead-only, no >50MB blobs — rejection is not history- or size-related. Next avenues: GitHub app installation repo access (github.com/settings/installations), branch protection, or Replit support.
