// Builds the pdf-expiry Vite app with a relative base path suitable for
// file:// loading inside Electron, then copies the build output into
// `web-bundle/` so electron-builder picks it up via `extraResources`.
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "..", "..");
const pdfExpiryRoot = path.resolve(repoRoot, "artifacts", "pdf-expiry");
const builtDir = path.join(pdfExpiryRoot, "dist", "public");
const targetDir = path.join(desktopRoot, "web-bundle");

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

console.log("[build-web-bundle] building pdf-expiry with BASE_PATH=./");
await run(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["--filter", "@workspace/pdf-expiry", "run", "build"],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      BASE_PATH: "./",
      // vite.config.ts requires PORT even at build time; value unused.
      PORT: process.env.PORT ?? "5173",
    },
  },
);

const stat = await fs.stat(builtDir).catch(() => null);
if (!stat || !stat.isDirectory()) {
  throw new Error(`[build-web-bundle] expected build output at ${builtDir}`);
}

console.log(`[build-web-bundle] copying ${builtDir} → ${targetDir}`);
await rmrf(targetDir);
await copyDir(builtDir, targetDir);

const indexHtml = path.join(targetDir, "index.html");
await fs.access(indexHtml);
console.log(`[build-web-bundle] ok: ${indexHtml}`);
