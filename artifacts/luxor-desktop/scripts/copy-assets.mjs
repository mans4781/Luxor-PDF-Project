// Copies the icon next to the compiled main.js so `path.join(__dirname,
// "..", "build", "icon.ico")` resolves both in dev (`electron .`) and inside
// the packaged asar (electron-builder bundles `dist/**/*` and `build/icon.ico`
// at the same archive root).
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function ensureIco() {
  const src = path.join(root, "build", "icon.ico");
  const stat = await fs.stat(src).catch(() => null);
  if (!stat) {
    console.error(
      "[copy-assets] missing build/icon.ico — run `pnpm run icon:regen`",
    );
    process.exit(1);
  }
  console.log(`[copy-assets] ok: ${path.relative(root, src)} (${stat.size} bytes)`);
}

await ensureIco();
