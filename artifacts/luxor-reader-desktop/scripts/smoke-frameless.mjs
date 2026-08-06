// Frameless-window smoke test — release gate for the desktop CI workflow.
//
// Launches the COMPILED app (out/main.js + preload + the offline web-bundle —
// the exact code electron-builder packages) through Playwright's Electron
// launcher. Playwright only supports driving the development Electron binary
// (it must inject its bootstrap loader; a packaged .exe can't be attached to),
// so this runs `electron .` rather than dist/win-unpacked. The packaged
// installer differs only in packaging (asar/NSIS), not in any of the code
// under test — installer-level checks stay on the manual list in
// RELEASE-CHECKLIST.md.
//
// Verifies the acceptance criteria from the manual frameless check:
//   1. The window is frameless and the renderer knows it's inside the desktop
//      shell (body.desktop-shell).
//   2. Drag regions exist (-webkit-app-region: drag on the home toolbar) and
//      the caption buttons inside them are no-drag (clickable).
//   3. The caption buttons actually drive the window: minimize,
//      maximize-toggle (both directions), and close all work via the
//      luxor:window-control IPC.
//
// Usage: node scripts/smoke-frameless.mjs
// Requires `pnpm run build` and `pnpm run build:web-bundle` to have run first.

import { _electron as electron } from "playwright-core";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = dirname(dirname(fileURLToPath(import.meta.url)));
const mainJs = join(pkgDir, "out", "main.js");
const bundledRoot = join(pkgDir, "web-bundle");

// Resolve the dev Electron binary from THIS package's node_modules.
// Playwright's own default lookup fails under pnpm's isolated node_modules
// ("Electron failed to install correctly"), so pass executablePath explicitly.
const requireFromPkg = createRequire(join(pkgDir, "package.json"));
const electronBinary = requireFromPkg("electron");

for (const [what, p] of [
  ["compiled main (run `pnpm run build` first)", mainJs],
  ["offline web bundle (run `pnpm run build:web-bundle` first)", join(bundledRoot, "index.html")],
]) {
  if (!existsSync(p)) {
    console.error(`[smoke] Missing ${what}: ${p}`);
    process.exit(2);
  }
}

let failures = 0;
function check(name, ok, detail = "") {
  const status = ok ? "PASS" : "FAIL";
  console.log(`[smoke] ${status}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function waitFor(fn, timeoutMs = 5000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await fn()) return true;
    if (Date.now() > deadline) return false;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// Launch the app with the local dev Electron binary (Playwright's supported
// path — it resolves `electron` from node_modules when no executablePath is
// given). Bundled mode keeps the test deterministic and offline.
const app = await electron.launch({
  executablePath: electronBinary,
  args: [mainJs],
  cwd: pkgDir,
  env: {
    ...process.env,
    LUXOR_LOAD_MODE: "bundled",
    LUXOR_BUNDLED_ROOT: bundledRoot,
  },
  timeout: 60_000,
});

try {
  const page = await app.firstWindow({ timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");

  // The Home toolbar (with the caption buttons) is the first screen.
  await page.waitForSelector(".lxh-toolbar", { timeout: 30_000 });

  // 0. Window is actually frameless (frame:false ⇒ window size == content size).
  const frameless = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const [w, h] = win.getSize();
    const [cw, ch] = win.getContentSize();
    return w === cw && h === ch;
  });
  check("window is frameless (no native chrome)", frameless);

  // 1. Renderer knows it's in the desktop shell.
  const hasShellClass = await page.evaluate(() =>
    document.body.classList.contains("desktop-shell"),
  );
  check("body has .desktop-shell class", hasShellClass);

  // 2. Drag regions: toolbar drags, caption buttons don't.
  const regions = await page.evaluate(() => {
    const style = (el) =>
      el
        ? getComputedStyle(el).webkitAppRegion ||
          getComputedStyle(el).getPropertyValue("-webkit-app-region")
        : null;
    const toolbar = document.querySelector(".lxh-toolbar");
    const minBtn = document.querySelector('.lxh-toolbar button[title="Minimize"]');
    const maxBtn = document.querySelector('.lxh-toolbar button[title="Maximize / Restore"]');
    const closeBtn = document.querySelector('.lxh-toolbar button[title="Close"]');
    return {
      toolbar: style(toolbar),
      minBtn: style(minBtn),
      maxBtn: style(maxBtn),
      closeBtn: style(closeBtn),
      buttonsPresent: Boolean(minBtn && maxBtn && closeBtn),
    };
  });
  check("home toolbar is a drag region", regions.toolbar === "drag", `got "${regions.toolbar}"`);
  check("caption buttons are present", regions.buttonsPresent);
  check(
    "caption buttons are no-drag (clickable)",
    regions.minBtn === "no-drag" && regions.maxBtn === "no-drag" && regions.closeBtn === "no-drag",
    `min=${regions.minBtn} max=${regions.maxBtn} close=${regions.closeBtn}`,
  );

  const winState = () =>
    app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return { minimized: win.isMinimized(), maximized: win.isMaximized() };
    });

  // 3a. Minimize via the caption button, then restore from the main process.
  await page.dispatchEvent('.lxh-toolbar button[title="Minimize"]', "click");
  check(
    "Minimize button minimizes the window",
    await waitFor(async () => (await winState()).minimized),
  );
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].restore());
  await waitFor(async () => !(await winState()).minimized);

  // 3b. Maximize-toggle both ways.
  const wasMaximized = (await winState()).maximized;
  await page.dispatchEvent('.lxh-toolbar button[title="Maximize / Restore"]', "click");
  check(
    "Maximize/Restore button toggles maximize",
    await waitFor(async () => (await winState()).maximized !== wasMaximized),
  );
  await page.dispatchEvent('.lxh-toolbar button[title="Maximize / Restore"]', "click");
  check(
    "Maximize/Restore button toggles back",
    await waitFor(async () => (await winState()).maximized === wasMaximized),
  );

  // 2b. macOS-only: the application menu must follow darwin conventions.
  //     - First menu is the app menu (Cmd+Q / Cmd+H live there).
  //     - An Edit menu with the standard roles exists — without it macOS
  //       never binds Cmd+C/V/X/A, so copy/paste is dead in every input.
  //     - A Window menu exists (Cmd+M minimize; the frameless window has
  //       no traffic lights, so these accelerators matter).
  if (process.platform === "darwin") {
    const menus = await app.evaluate(({ Menu, app: electronApp }) => {
      const m = Menu.getApplicationMenu();
      if (!m) return null;
      return {
        labels: m.items.map((i) => i.label),
        first: m.items[0]?.label,
        appName: electronApp.name,
        hasEditRoles: m.items.some(
          (i) =>
            i.submenu &&
            i.submenu.items.some((s) => (s.role ?? "").toLowerCase() === "paste"),
        ),
      };
    });
    check("macOS: application menu exists", Boolean(menus));
    check(
      "macOS: first menu is the app menu",
      menus?.first === menus?.appName,
      `first="${menus?.first}" app="${menus?.appName}"`,
    );
    check(
      "macOS: Edit menu provides Cmd+C/V/X (paste role present)",
      Boolean(menus?.hasEditRoles),
      `menus=${JSON.stringify(menus?.labels)}`,
    );
    check(
      "macOS: Window menu present (Cmd+M)",
      Boolean(menus?.labels?.includes("Window")),
      `menus=${JSON.stringify(menus?.labels)}`,
    );
  }

  // 3c. Close via the caption button — the app should exit.
  const closed = new Promise((resolveClosed) => {
    app.on("close", () => resolveClosed(true));
    setTimeout(() => resolveClosed(false), 15_000);
  });
  await page.dispatchEvent('.lxh-toolbar button[title="Close"]', "click");
  check("Close button closes the window / exits the app", await closed);
} catch (err) {
  failures++;
  console.error("[smoke] FAIL — unexpected error:", err);
} finally {
  try {
    await app.close();
  } catch {
    // Already closed by the Close-button check — that's the success path.
  }
}

if (failures > 0) {
  console.error(`[smoke] ${failures} check(s) failed — do NOT publish this build.`);
  process.exit(1);
}
console.log("[smoke] All frameless-window checks passed.");
