import {
  app,
  BrowserWindow,
  shell,
  session,
  protocol,
  net,
  ipcMain,
} from "electron";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

// ─── Configuration ────────────────────────────────────────────────────────────
//
// Three load modes (env `LUXOR_LOAD_MODE`):
//
//   "auto"    (default) — try REMOTE_URL first (always up to date, sign-in
//             works); if the remote load fails (offline / DNS / server
//             down), fall back to the bundled offline copy at app://luxor/.
//   "remote"  — always load REMOTE_URL.
//   "bundled" — always load the offline bundle.
//
// The bundled copy is a build of the luxor-pdf web app served from disk via
// a custom `app://` protocol with SPA index.html fallback.

type LoadMode = "auto" | "remote" | "bundled";
const LOAD_MODE: LoadMode =
  (process.env["LUXOR_LOAD_MODE"] as LoadMode | undefined) ?? "auto";
const REMOTE_URL =
  process.env["LUXOR_REMOTE_URL"] ?? "https://luxorpdf.com/luxor-pdf/";
const BUNDLED_ROOT =
  process.env["LUXOR_BUNDLED_ROOT"] ??
  path.join(process.resourcesPath, "web-bundle");
const BUNDLED_URL = "app://luxor/";

// Register the custom scheme as a privileged, secure, standard scheme BEFORE
// app `ready` — makes `app://` behave like https for the renderer.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

const ASSET_EXT_RE = /\.[a-z0-9]+$/i;

/**
 * Serve the bundled SPA from disk under the `app://luxor/` origin.
 * - Asset paths (anything with a file extension) → return the file as-is.
 * - Everything else (SPA route paths) → fall back to index.html.
 * - Refuses to escape `BUNDLED_ROOT` (path traversal guard).
 */
function registerBundledProtocol(): void {
  protocol.handle("app", async (request) => {
    try {
      const url = new URL(request.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const isAsset = ASSET_EXT_RE.test(rel);
      const targetRel = isAsset && rel.length > 0 ? rel : "index.html";

      const resolved = path.normalize(path.join(BUNDLED_ROOT, targetRel));
      const rootWithSep = BUNDLED_ROOT.endsWith(path.sep)
        ? BUNDLED_ROOT
        : BUNDLED_ROOT + path.sep;
      if (!resolved.startsWith(rootWithSep) && resolved !== BUNDLED_ROOT) {
        return new Response("Forbidden", { status: 403 });
      }

      const stat = await fs.stat(resolved).catch(() => null);
      const finalPath =
        stat && stat.isFile()
          ? resolved
          : path.join(BUNDLED_ROOT, "index.html");

      return net.fetch(pathToFileURL(finalPath).toString());
    } catch (err) {
      log.error("[bundled-proto] failed to serve", request.url, err);
      return new Response("Internal error", { status: 500 });
    }
  });
}

let mainWindow: BrowserWindow | null = null;

// ─── "Open with" / default-app file handling ─────────────────────────────────
//
// When Windows launches the app with a PDF path (double-click after the
// installer registered the .pdf file association), the path arrives in
// process.argv (first launch) or in the second-instance argv (app already
// running). The file bytes are read here in the main process and handed to
// the renderer over IPC — the sandboxed renderer never touches the
// filesystem directly.

const MAX_OPEN_FILE_BYTES = 512 * 1024 * 1024; // 512 MB safety cap

function extractPdfPath(argv: string[]): string | null {
  // Skip the executable (and the script path when unpackaged), ignore flags.
  const args = argv.slice(app.isPackaged ? 1 : 2);
  for (const arg of args) {
    if (arg.startsWith("-")) continue;
    if (arg.toLowerCase().endsWith(".pdf")) return arg;
  }
  return null;
}

interface OpenedFile {
  name: string;
  data: Uint8Array;
}

async function readPdfForRenderer(filePath: string): Promise<OpenedFile | null> {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > MAX_OPEN_FILE_BYTES) return null;
    const data = await fs.readFile(filePath);
    return { name: path.basename(filePath), data };
  } catch (err) {
    log.error("[open-file] failed to read", filePath, err);
    return null;
  }
}

let pendingPdfPath: string | null = extractPdfPath(process.argv);

// True once the renderer has proven it is mounted and pulling files (it
// calls `luxor:get-pending-file` on startup). Until then, files opened via
// `second-instance` are queued in `pendingPdfPath` instead of being pushed
// with fire-and-forget `webContents.send`, which would silently drop them.
let rendererReady = false;

// ─── Persistent device id ─────────────────────────────────────────────────────

const DEVICE_ID_FILE = "device-id.txt";

async function loadOrCreateDeviceId(): Promise<string> {
  const dir = app.getPath("userData");
  const file = path.join(dir, DEVICE_ID_FILE);
  try {
    const existing = (await fs.readFile(file, "utf8")).trim();
    if (existing) return existing;
  } catch {
    // fall through — file missing
  }
  const id = crypto.randomUUID();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, id, "utf8");
  return id;
}

let cachedDeviceId: string | null = null;
async function getDeviceId(): Promise<string> {
  if (!cachedDeviceId) {
    cachedDeviceId = await loadOrCreateDeviceId();
  }
  return cachedDeviceId;
}

// ─── Window creation ──────────────────────────────────────────────────────────

const REMOTE_ORIGIN = new URL(REMOTE_URL).origin;
const BUNDLED_ORIGIN = new URL(BUNDLED_URL).origin;

function createWindow(): void {
  const iconPath = path.join(__dirname, "..", "build", "icon.ico");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 600,
    icon: iconPath,
    title: "Luxor PDF",
    backgroundColor: "#111827",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Open external links in the user's default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  // Block in-app navigation away from the allowed origins (remote site or
  // the bundled app:// origin — both are legitimate in auto mode).
  mainWindow.webContents.on("will-navigate", (event, navUrl) => {
    const origin = new URL(navUrl).origin;
    if (origin !== REMOTE_ORIGIN && origin !== BUNDLED_ORIGIN) {
      event.preventDefault();
      void shell.openExternal(navUrl);
    }
  });

  // Auto mode: if the initial remote load fails (offline, DNS error,
  // server unreachable), fall back to the bundled offline copy so the
  // user can still read PDFs.
  if (LOAD_MODE === "auto") {
    mainWindow.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (!isMainFrame || !mainWindow) return;
        // errorCode -3 (ABORTED) fires on normal redirects — ignore it.
        if (errorCode === -3) return;
        if (validatedURL.startsWith(BUNDLED_URL)) return; // already fallen back
        log.warn(
          `[loader] remote load failed (${errorCode} ${errorDescription}) — ` +
            "falling back to bundled offline copy",
        );
        void mainWindow.loadURL(BUNDLED_URL);
      },
    );
  }

  const initialUrl = LOAD_MODE === "bundled" ? BUNDLED_URL : REMOTE_URL;
  void mainWindow.loadURL(initialUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.setName("Luxor PDF");
if (process.platform === "win32") {
  app.setAppUserModelId("com.luxor.pdfreader");
}

// ─── Auto-update ──────────────────────────────────────────────────────────────
//
// electron-updater against the publish feed in package.json (GitHub
// Releases). Only runs in packaged builds.

function setupAutoUpdater(): void {
  if (!app.isPackaged) {
    log.info("[updater] skipped — running unpackaged");
    return;
  }

  autoUpdater.logger = log;
  log.transports.file.level = "info";
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    log.info("[updater] checking for update");
  });
  autoUpdater.on("update-available", (info) => {
    log.info("[updater] update available", info?.version);
  });
  autoUpdater.on("update-not-available", () => {
    log.info("[updater] no update available");
  });
  autoUpdater.on("download-progress", (p) => {
    log.info(
      `[updater] download progress ${Math.round(p.percent)}% ` +
        `(${p.transferred}/${p.total} bytes)`,
    );
  });
  autoUpdater.on("update-downloaded", (info) => {
    log.info("[updater] update downloaded", info?.version);
  });
  autoUpdater.on("error", (err) => {
    log.error("[updater] error", err);
  });

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error("[updater] checkForUpdatesAndNotify failed", err);
  });
}

// Single-instance: double-clicking a PDF while the app is running should
// open it in the existing window instead of spawning a second process.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

app.on("second-instance", (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const pdfPath = extractPdfPath(argv);
  if (!pdfPath) return;
  if (mainWindow && rendererReady) {
    void readPdfForRenderer(pdfPath).then((file) => {
      if (file && mainWindow) {
        mainWindow.webContents.send("luxor:open-file", file);
      }
    });
  } else {
    // Window or renderer not ready yet — queue it; the renderer pulls it
    // via `luxor:get-pending-file` as soon as it mounts.
    pendingPdfPath = pdfPath;
  }
});

void app.whenReady().then(async () => {
  if (!gotSingleInstanceLock) return;
  await getDeviceId();

  // The bundled protocol is registered in every mode — "auto" needs it
  // ready for the offline fallback.
  registerBundledProtocol();

  // Tighten Content-Security-Policy for bundled (app://) responses only.
  // Remote pages keep the deployed site's own CSP headers.
  session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
    if (!details.url.startsWith("app://")) {
      cb({ responseHeaders: details.responseHeaders });
      return;
    }
    cb({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; img-src 'self' data: blob:; " +
            "style-src 'self' 'unsafe-inline'; script-src 'self' blob:; " +
            "worker-src 'self' blob:; connect-src 'self' https:; " +
            "font-src 'self' data:;",
        ],
      },
    });
  });

  createWindow();

  setTimeout(() => setupAutoUpdater(), 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Only the app's own origins (deployed site or bundled offline copy) may
// call the privileged IPC handlers — defense in depth on top of the
// will-navigate origin lock.
function isTrustedIpcSender(event: Electron.IpcMainInvokeEvent): boolean {
  try {
    const origin = new URL(event.senderFrame?.url ?? "").origin;
    return origin === REMOTE_ORIGIN || origin === BUNDLED_ORIGIN;
  } catch {
    return false;
  }
}

ipcMain.handle("luxor:get-device-id", async (event) => {
  if (!isTrustedIpcSender(event)) return null;
  return getDeviceId();
});

// One-shot: the renderer asks for the file it was launched with (if any).
// Also serves as the renderer-ready signal for the push path.
ipcMain.handle("luxor:get-pending-file", async (event) => {
  if (!isTrustedIpcSender(event)) return null;
  rendererReady = true;
  if (!pendingPdfPath) return null;
  const filePath = pendingPdfPath;
  pendingPdfPath = null;
  return readPdfForRenderer(filePath);
});
