// Regenerates build/icon.ico from a source PNG using ImageMagick.
// Usage: pnpm run icon:regen [path/to/source.png]
//
// The source (build/icon-source.png) already has a transparent background,
// so we simply pack it into a multi-resolution .ico while preserving alpha.
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = process.argv[2] ?? path.resolve(root, "build", "icon-source.png");
const out = path.join(root, "build", "icon.ico");

const args = [
  src,
  "-background", "none",
  "-define", "icon:auto-resize=256,128,64,48,32,16",
  out,
];

console.log(`[icon] magick ${args.join(" ")}`);
execFileSync("magick", args, { stdio: "inherit" });
console.log(`[icon] wrote ${out}`);
