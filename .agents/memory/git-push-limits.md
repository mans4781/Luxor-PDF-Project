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
