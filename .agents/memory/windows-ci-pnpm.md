---
name: Windows CI vs Replit pnpm template
description: The workspace template's Linux-only pnpm overrides break Windows GitHub runners; CI must strip them before install.
---

The Replit pnpm template blocks all non-Linux platform binaries (rollup, tailwind oxide, esbuild, ngrok, etc.) with `"pkg>dep": "-"` overrides in `pnpm-workspace.yaml`, and pins `brace-expansion: ^2.0.3` — which breaks electron-builder on Windows ("brace_expansion_1.expand is not a function"; it needs the newer named `expand` export).

**Why:** first Windows CI runs failed one step at a time: missing `@rollup/rollup-win32-x64-msvc`, then the brace-expansion crash in electron-builder.

**How to apply:** any GitHub Actions job on a non-Linux runner must, before `pnpm install`:
```bash
sed -i '/: "-"$/d' pnpm-workspace.yaml
sed -i '/"brace-expansion"/d' pnpm-workspace.yaml
```
then install with `--no-frozen-lockfile`. Also: root `package.json` needs `"packageManager": "pnpm@<version>"` for `pnpm/action-setup@v4`; `makensis` is NOT on windows-latest PATH (install via `choco install nsis` + add `/c/Program Files (x86)/NSIS` to `$GITHUB_PATH`). Beware YAML: an inline `run:` containing `: "` breaks parsing (run starts with zero jobs) — use a block scalar.

Pushing from the workspace: the Replit Git pane failed repeatedly with a misleading "remote has commits" error even against an empty repo; direct `git push` with a fine-grained PAT (secret `GH_PUSH_TOKEN`, credential-helper trick to avoid token in output) works reliably.
