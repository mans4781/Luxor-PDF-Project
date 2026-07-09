// Regenerates build/icon.ico from a source PNG using ImageMagick.
// Usage: pnpm run icon:regen [path/to/source.png]
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
// Default source: the checked-in Luxor shield logo (transparent background).
const src = process.argv[2] ?? path.join(root, "build", "icon-source.png");
const out = path.join(root, "build", "icon.ico");

const args = [
  src,
  "-background", "none",
  "(", "-clone", "0", "-resize", "16x16", ")",
  "(", "-clone", "0", "-resize", "32x32", ")",
  "(", "-clone", "0", "-resize", "48x48", ")",
  "(", "-clone", "0", "-resize", "64x64", ")",
  "(", "-clone", "0", "-resize", "128x128", ")",
  "(", "-clone", "0", "-resize", "256x256", ")",
  "-delete", "0",
  out,
];

console.log(`[icon] magick ${args.join(" ")}`);
execFileSync("magick", args, { stdio: "inherit" });
console.log(`[icon] wrote ${out}`);
