// Regenerates build/fileicon.ico (the .pdf file-association icon shown in
// Windows File Explorer) from build/fileicon.svg using ImageMagick.
// Each size is rasterized directly from the SVG (not downscaled from one
// large render) so small sizes stay crisp.
// Usage: pnpm run fileicon:regen
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "build", "fileicon.svg");
const out = path.join(root, "build", "fileicon.ico");
const srcPng = path.join(root, "build", "fileicon-source.png");

const sizes = [16, 24, 32, 48, 64, 128, 256];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fileicon-"));
const pngs = [];

for (const s of sizes) {
  const png = path.join(tmp, `fileicon-${s}.png`);
  // Rasterize the SVG at the exact target size (density scales the 512px canvas).
  execFileSync(
    "magick",
    ["-background", "none", "-density", String((96 * s) / 512), src,
     "-resize", `${s}x${s}`, png],
    { stdio: "inherit" },
  );
  pngs.push(png);
}

execFileSync("magick", [...pngs, out], { stdio: "inherit" });
console.log(`[fileicon] wrote ${out} (${sizes.join(", ")})`);

// Keep a 512px PNG rendering checked in as the human-viewable source snapshot.
execFileSync(
  "magick",
  ["-background", "none", "-density", "96", src, "-resize", "512x512", srcPng],
  { stdio: "inherit" },
);
console.log(`[fileicon] wrote ${srcPng}`);

fs.rmSync(tmp, { recursive: true, force: true });
