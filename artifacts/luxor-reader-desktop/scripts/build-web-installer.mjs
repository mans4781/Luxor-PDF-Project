// Compiles the NSIS web-installer stub (web-installer/web-setup.nsi) into
// dist/"Luxor PDF Web Setup.exe". Works on Linux/macOS/Windows as
// long as `makensis` is on PATH. The stub's version is taken from
// package.json so the exe's version resource tracks releases.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(root, "..");
const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));

mkdirSync(join(pkgDir, "dist"), { recursive: true });

execFileSync(
  "makensis",
  [`-DPRODUCT_VERSION=${version}`, "-V2", join(pkgDir, "web-installer", "web-setup.nsi")],
  { stdio: "inherit" },
);

const out = join(pkgDir, "dist", "Luxor PDF Web Setup.exe");
const kb = Math.round(statSync(out).size / 1024);
console.log(`\nWeb installer stub built: ${out} (${kb} KB)`);
