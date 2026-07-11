// Regenerates build/icon.ico from a source PNG using ImageMagick.
// Usage: pnpm run icon:regen [path/to/source.png]
//
// The default source (build/icon-source.png) is a flat PNG with a near-white
// background. We flood-fill from the corner to make that background
// transparent, which leaves interior white detail (text, lock) intact — a
// global `-transparent white` would incorrectly punch holes in those.
//
// Uses execFileSync with an args array (no shell) so ImageMagick's parentheses
// and the floodfill draw string pass through literally without shell quoting.
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = process.argv[2] ?? path.resolve(root, "build", "icon-source.png");
const out = path.join(root, "build", "icon.ico");

const args = [
  src,
  "-alpha", "set",
  "-bordercolor", "white",
  "-border", "1",
  "-fuzz", "20%",
  "-fill", "none",
  "-draw", "color 0,0 floodfill",
  "-shave", "1x1",
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
