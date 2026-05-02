import { app, BrowserWindow, shell, session } from "electron";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { autoUpdater } from "electron-updater";
import log from "electron-log";

// ─── Configuration ────────────────────────────────────────────────────────────
//
// Two load modes (set at build time via electron-builder env, falls back at
// runtime to env vars):
//
//   LUXOR_LOAD_MODE = "remote"  (default) — load REMOTE_URL
//   LUXOR_LOAD_MODE = "bundled"           — load file://web-bundle/index.html
//
// REMOTE_URL is the deployed pdf-expiry app. For local dev against the
// Replit preview, point it at http://localhost:80/pdf-expiry/.

const LOAD_MODE: "remote" | "bundled" =
  (process.env["LUXOR_LOAD_MODE"] as "remote" | "bundled" | undefined) ??
  (app.isPackaged ? "bundled" : "remote");
const REMOTE_URL =
  process.env["LUXOR_REMOTE_URL"] ?? "https://luxorpdf.com/pdf-expiry/";
const BUNDLED_INDEX =
  process.env["LUXOR_BUNDLED_INDEX"] ??
  path.join(process.resourcesPath, "web-bundle", "index.html");

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

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 600,
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
    if (LOAD_MODE === "remote") {
      const allowed = new URL(REMOTE_URL).origin;
      if (new URL(navUrl).origin !== allowed) {
        event.preventDefault();
        void shell.openExternal(navUrl);
      }
    }
  });

  if (LOAD_MODE === "bundled") {
    void mainWindow.loadFile(BUNDLED_INDEX);
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

  // Tighten Content-Security-Policy for the bundled load mode. Remote mode
  // keeps the deployed site's own CSP.
  if (LOAD_MODE === "bundled") {
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

// Expose device id to the preload via IPC.
import { ipcMain } from "electron";
ipcMain.handle("luxor:get-device-id", async () => {
  return getDeviceId();
});
ipcMain.handle("luxor:get-app-info", () => {
  return {
    productName: "Luxor PDF Secure",
    version: app.getVersion(),
    platform: process.platform,
    loadMode: LOAD_MODE,
  };
});
