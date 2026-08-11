# Luxor PDF Reader — pre-release smoke checklist

The CI workflow (`.github/workflows/reader-desktop-windows.yml`) runs the
**automated frameless-window smoke test** (`scripts/smoke-frameless.mjs`)
against the compiled app (out/ + web-bundle — the exact code electron-builder
packages) **before** the installer is built and published. A failed smoke test
fails the job, so a release cannot ship with dead drag zones or broken caption
buttons.

Playwright can only drive the development Electron binary, not a packaged
`.exe`, so the automated gate exercises the compiled code and the manual list
below covers installer-level behavior.

## Automated (enforced by CI — cannot be skipped)

- [x] Window is frameless (no native title bar / chrome)
- [x] `body.desktop-shell` class is set in the renderer
- [x] Home toolbar (`.lxh-toolbar`) is a drag region (`-webkit-app-region: drag`)
- [x] Caption buttons (Minimize / Maximize-Restore / Close) exist and are `no-drag`
- [x] Minimize button minimizes the window (via `luxor:window-control` IPC)
- [x] Maximize/Restore button toggles maximize in both directions
- [x] Close button closes the window and exits the app

Run locally:

```
pnpm --filter @workspace/luxor-reader-desktop run build
pnpm --filter @workspace/luxor-reader-desktop run build:web-bundle
pnpm --filter @workspace/luxor-reader-desktop run test:frameless
```

On headless Linux, run it under a display with a window manager (minimize /
maximize state needs one):

```
nix-shell -p xvfb-run openbox --run "xvfb-run -a sh -c 'openbox & sleep 1; node scripts/smoke-frameless.mjs'"
```

## Manual (verify on the built installer before announcing a release)

These run on the installed app, which the automated gate can't reach:

- [ ] Dragging the window by the home toolbar / menu strip / tab bar moves it
- [ ] Double-clicking a drag region toggles maximize
- [ ] Any open menu/popover/backdrop inside a drag strip still receives clicks
      (overlays must be `no-drag` — see the gotcha block in luxor-pdf `index.css`)
- [ ] Window snapping (Win + arrow keys) works
- [ ] Close button turns red on hover in the viewer caption strip

### macOS

Automated coverage runs on real macOS via
`.github/workflows/reader-desktop-macos.yml` (macos-latest runner): all the
shared frameless checks above plus darwin-only menu assertions (app menu
first, Edit menu roles so Cmd+C/V/X work, Window menu for Cmd+M). With
`frame: false` macOS shows **no traffic lights** — the in-app caption
buttons are the window controls there too. Remaining manual items on a
physical Mac (no mac installer exists yet — packaging is a separate task):

- [ ] Drag by toolbar/tab bar, double-click drag region zooms per system pref
- [ ] Cmd+C/V/X/A work in the search box and sign-in form
- [ ] Cmd+M minimizes; green full-screen via View → Toggle Full Screen

## File-association icon (Explorer)

`build/fileicon.ico` is the icon Windows Explorer shows on `.pdf` files. It is
generated from `build/fileicon.svg` (matches the in-app Recent Documents icon
— light-blue bordered sheet with a clipped top-right dog-ear) via
`pnpm run fileicon:regen`; sizes 16/24/32/48/64/128/256 are rasterized
per-size for crispness.

**Icon-cache caveat for users:** after installing an update, Windows may keep
showing the *old* `.pdf` icon because Explorer caches file-type icons. It
usually refreshes on its own after a reboot; to force it, sign out/in or run
`ie4uinit.exe -show` (Win10/11), or delete `%LocalAppData%\IconCache.db` /
`%LocalAppData%\Microsoft\Windows\Explorer\iconcache_*.db` and restart
Explorer. Include this note in the release notes for icon-changing releases.

## Notes

- The smoke test runs with `LUXOR_LOAD_MODE=bundled` (and `LUXOR_BUNDLED_ROOT`
  pointing at `web-bundle/`) so it is deterministic and offline.
- If a check legitimately needs to change (e.g. a selector rename in
  luxor-pdf), update `scripts/smoke-frameless.mjs` in the same PR — the CI
  gate stays mandatory.
