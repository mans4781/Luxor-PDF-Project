const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const http = require("http");
const { fork } = require("child_process");

let mainWindow = null;
let serverProcess = null;
const PORT = 47832;

function waitForServer(port, maxMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      http
        .get(`http://localhost:${port}/api/healthz`, (res) => {
          if (res.statusCode === 200) return resolve();
          retry();
        })
        .on("error", retry);
    }
    function retry() {
      if (Date.now() - start > maxMs) return reject(new Error("Server timed out"));
      setTimeout(attempt, 150);
    }
    attempt();
  });
}

function startServer() {
  const serverPath = path.join(__dirname, "server.js");
  const dataPath = app.getPath("userData");

  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_PATH: dataPath,
      STATIC_PATH: path.join(__dirname, "public"),
    },
    silent: false,
  });

  serverProcess.on("error", (err) => {
    console.error("Server process error:", err);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0 && !app.isQuitting) {
      console.error("Server exited with code", code);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "LexSecure PDF",
    icon: path.join(__dirname, "public", "favicon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    backgroundColor: "#f8fafc",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`http://localhost:${PORT}/`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const menuTemplate = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About LexSecure PDF",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About LexSecure PDF",
              message: "LexSecure PDF v1.0.0",
              detail:
                "Secure PDF management with expiry control.\nMerge, split, extract, and convert PDFs.\nAll processing happens locally on your device.",
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

app.whenReady().then(async () => {
  startServer();

  try {
    await waitForServer(PORT, 10000);
  } catch (e) {
    console.error("Failed to start server:", e.message);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
