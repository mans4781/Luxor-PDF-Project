# Luxor PDF Secure (Electron Windows wrapper)

Thin Electron shell around the `pdf-expiry` web app, packaged as a Windows
NSIS installer (`Luxor PDF Secure Setup x.y.z.exe`).

## Modes

| `LUXOR_LOAD_MODE` | Loads                                           |
| ----------------- | ----------------------------------------------- |
| `remote` (default) | `LUXOR_REMOTE_URL` (default `https://luxorpdf.com/pdf-expiry/`) |
| `bundled`         | `web-bundle/index.html` (built `pdf-expiry`)    |

## Scripts

```bash
pnpm install                     # one-time, downloads electron
pnpm --filter @workspace/luxor-desktop run start       # dev: opens window pointing at REMOTE_URL
pnpm --filter @workspace/luxor-desktop run dist:win    # builds the .exe installer (requires Windows or Wine)
pnpm --filter @workspace/luxor-desktop run icon:regen  # rebuilds build/icon.ico from the Luxor PNG
```

> The Linux dev container does **not** ship Wine, so `dist:win` must run on
> Windows (or a CI box with Wine + Mono installed). The TypeScript build
> (`pnpm run build`) and dev launch (`pnpm run start`) work on Linux.

## Bundled mode

To produce an offline-capable installer:

```bash
pnpm --filter @workspace/pdf-expiry run build
cp -r artifacts/pdf-expiry/dist artifacts/luxor-desktop/web-bundle
LUXOR_LOAD_MODE=bundled pnpm --filter @workspace/luxor-desktop run dist:win
```

`web-bundle/` is ignored by git and copied into the installer via
`extraResources`.

## Security posture

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- The only API the renderer sees is `window.luxor` from `src/preload.ts`:
  - `getDeviceId(): Promise<string>` — stable UUID stored in `userData`
  - `getAppInfo()` — productName, version, loadMode, platform
  - `isDesktop: true`
- External links open in the user's default browser via `shell.openExternal`.
- Cross-origin in-app navigation is blocked when in `remote` mode.

## Device id

Stored at `<userData>/device-id.txt` (e.g.
`%APPDATA%/Luxor PDF Secure/device-id.txt`). On first boot a UUID v4 is
written and reused thereafter — uninstalling does **not** delete it
(`nsis.deleteAppDataOnUninstall: false`) so reinstalling reactivates the
same license slot.

The `pdf-expiry` web app reads this id via `window.luxor?.getDeviceId()`
and falls back to the localStorage UUID it has always used in plain
browsers.
