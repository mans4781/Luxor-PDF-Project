import {
  app,
  BrowserWindow,
  shell,
  session,
  protocol,
  net,
  screen,
} from "electron";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

// ─── Configuration ────────────────────────────────────────────────────────────
//
// Two load modes (set at build time via electron-builder env, falls back at
// runtime to env vars):
//
//   LUXOR_LOAD_MODE = "remote"  (default) — load REMOTE_URL
//   LUXOR_LOAD_MODE = "bundled"           — load app://luxor/  (custom proto
//     serving web-bundle/ from disk with SPA index.html fallback so wouter
//     path routing resolves correctly — file:// + path routing does not).
//
// REMOTE_URL is the deployed pdf-expiry app. For local dev against the
// Replit preview, point it at http://localhost:80/pdf-expiry/.

// Production default = "remote" (deployed pdf-expiry app). "bundled" is an
// explicit opt-in via LUXOR_LOAD_MODE for offline / self-contained installs.
const LOAD_MODE: "remote" | "bundled" =
  (process.env["LUXOR_LOAD_MODE"] as "remote" | "bundled" | undefined) ??
  "remote";
const REMOTE_URL =
  process.env["LUXOR_REMOTE_URL"] ?? "https://luxorpdf.com/pdf-expiry/";
const BUNDLED_ROOT =
  process.env["LUXOR_BUNDLED_ROOT"] ??
  path.join(process.resourcesPath, "web-bundle");
const BUNDLED_URL = "app://luxor/";

// Register the custom scheme as a privileged, secure, standard scheme BEFORE
// app `ready`. This makes `app://` behave like https for the renderer:
// secure context, fetch enabled, standard URL parsing (so wouter path
// routes like "/dashboard" resolve cleanly under one origin).
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
 * - Everything else (SPA route paths) → fall back to index.html so the
 *   client-side router gets to handle them.
 * - Refuses to escape `BUNDLED_ROOT` (path traversal guard).
 */
function registerBundledProtocol(): void {
  protocol.handle("app", async (request) => {
    try {
      const url = new URL(request.url);
      // Strip leading slash from the URL pathname.
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const isAsset = ASSET_EXT_RE.test(rel);
      const targetRel = isAsset && rel.length > 0 ? rel : "index.html";

      const resolved = path.normalize(path.join(BUNDLED_ROOT, targetRel));
      // Path-traversal guard: resolved must stay inside BUNDLED_ROOT.
      const rootWithSep = BUNDLED_ROOT.endsWith(path.sep)
        ? BUNDLED_ROOT
        : BUNDLED_ROOT + path.sep;
      if (!resolved.startsWith(rootWithSep) && resolved !== BUNDLED_ROOT) {
        return new Response("Forbidden", { status: 403 });
      }

      // If a non-existent asset was requested, also fall back to index.html
      // so deep-link refreshes work even if the asset name lookup misses.
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

// Keep a reference so the window isn't GC'd.
let mainWindow: BrowserWindow | null = null;

// ─── Persistent device id ─────────────────────────────────────────────────────
//
// Stored in Electron's userData directory so the same install on the same
// Windows account always reports the same id. We expose it to the renderer
// via the preload bridge (window.luxor.getDeviceId).

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

function createWindow(): void {
  const iconPath = path.join(__dirname, "..", "build", "icon.ico");

  // Open at ~60% of the screen's work area (never full screen), centered.
  const { width: screenW, height: screenH } =
    screen.getPrimaryDisplay().workAreaSize;
  const winWidth = Math.max(880, Math.round(screenW * 0.6));
  const winHeight = Math.max(600, Math.round(screenH * 0.6));

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: 880,
    minHeight: 600,
    center: true,
    icon: iconPath,
    title: "Luxor PDF Secure",
    backgroundColor: "#0F172A",
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

  // Open external links in the user's default browser instead of a new
  // Electron window (prevents accidental navigation away from the app).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  // Block in-app navigation away from the loaded origin (defense in depth).
  mainWindow.webContents.on("will-navigate", (event, navUrl) => {
    const allowedOrigin =
      LOAD_MODE === "remote"
        ? new URL(REMOTE_URL).origin
        : new URL(BUNDLED_URL).origin;
    if (new URL(navUrl).origin !== allowedOrigin) {
      event.preventDefault();
      void shell.openExternal(navUrl);
    }
  });

  if (LOAD_MODE === "bundled") {
    void mainWindow.loadURL(BUNDLED_URL);
  } else {
    void mainWindow.loadURL(REMOTE_URL);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.setName("Luxor PDF Secure");
if (process.platform === "win32") {
  app.setAppUserModelId("com.luxor.pdfsecure");
}

// ─── Auto-update ──────────────────────────────────────────────────────────────
//
// Uses electron-updater against the publish feed configured in package.json
// (GitHub Releases by default). Runs only in packaged builds; in development
// `app.isPackaged` is false and electron-updater would fail to find the
// dev-app-update.yml.

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

void app.whenReady().then(async () => {
  // Warm the device id so the preload bridge is instant on first read.
  await getDeviceId();

  // Bundled mode: register the custom scheme handler that serves
  // web-bundle/ from disk with SPA index.html fallback.
  if (LOAD_MODE === "bundled") {
    registerBundledProtocol();

    // Tighten Content-Security-Policy for the bundled load mode. Remote
    // mode keeps the deployed site's own CSP.
    session.defaultSession.webRequest.onHeadersReceived((details, cb) => {
      cb({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; img-src 'self' data: blob:; " +
              "style-src 'self' 'unsafe-inline'; script-src 'self'; " +
              "connect-src 'self' https:;",
          ],
        },
      });
    });
  }

  createWindow();

  // Kick off update check shortly after the window is up so the initial
  // load isn't competing with network for the update manifest.
  setTimeout(() => setupAutoUpdater(), 3000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Expose device id to the preload via IPC. Keep the surface narrow: the
// renderer only needs `getDeviceId()` per the desktop wrap spec.
import { ipcMain } from "electron";
ipcMain.handle("luxor:get-device-id", async () => {
  return getDeviceId();
});
