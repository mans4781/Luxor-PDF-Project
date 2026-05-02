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

## Code signing (Windows)

Unsigned installers trigger a red Windows SmartScreen "Unrecognized app"
warning. The electron-builder `build.win` block is wired up for several
signing backends — pick one and set the matching env vars (locally or as
CI secrets) before running `pnpm run dist:win`.

The actual signing is performed by `scripts/sign-windows.cjs`, which is
referenced from `build.win.sign`. It picks a backend based on which env
vars are set, in this priority order:

### 1. Azure Trusted Signing / Key Vault (recommended for CI)

Requires [`AzureSignTool`](https://github.com/vcsjones/AzureSignTool) on
PATH (or set `AZURESIGNTOOL_PATH`).

| Env var                          | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `AZURE_KEY_VAULT_URL`            | e.g. `https://luxor-kv.vault.azure.net` |
| `AZURE_KEY_VAULT_CERT`           | Certificate name in the vault        |
| `AZURE_KEY_VAULT_CLIENT_ID`      | Service principal app id             |
| `AZURE_KEY_VAULT_CLIENT_SECRET`  | Service principal secret             |
| `AZURE_KEY_VAULT_TENANT_ID`      | Azure tenant id                      |
| `AZURE_KEY_VAULT_TIMESTAMP_URL`  | Optional, defaults to DigiCert RFC3161 |

### 2. Certificate file (`.pfx` / `.p12`)

Best for EV certs delivered as a file or stored as a base64 CI secret
(decode to a temp file first).

| Env var                  | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `WIN_CSC_LINK`           | Absolute path to the `.pfx` / `.p12` file |
| `WIN_CSC_KEY_PASSWORD`   | Password for the private key              |
| `WIN_TIMESTAMP_URL`      | Optional, defaults to DigiCert RFC3161    |

### 3. Hardware token by certificate subject or thumbprint

For EV certs that live on a USB hardware token (eToken / SafeNet) the
private key cannot be exported, so reference the cert by its subject or
SHA-1 thumbprint installed in the Windows certificate store. Requires
`signtool.exe` on PATH (set `SIGNTOOL_PATH` to override).

| Env var                  | Purpose                                |
| ------------------------ | -------------------------------------- |
| `WIN_CSC_SUBJECT_NAME`   | e.g. `Luxor PDF, Inc.`                 |
| `WIN_CSC_SHA1`           | SHA-1 thumbprint (40 hex chars)        |

### Skipping signing intentionally

For local smoke tests where you do not have credentials available, set
`LUXOR_SKIP_SIGNING=1` to produce an unsigned installer. SmartScreen
will warn end users — never publish an unsigned build.

### Verifying a signed installer

On a signed Windows host:

```powershell
signtool verify /pa /v "dist-installer\Luxor PDF Secure Setup 0.1.0.exe"
```

Then run the installer on a clean Windows VM and confirm SmartScreen
either accepts it silently (EV cert) or shows the standard non-red
"Windows protected your PC" dialog with a working "Run anyway" link
(OV cert, fades after enough installs build reputation).

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
