import { spawn } from "child_process";
import fs from "fs";
import path from "path";

/**
 * High-fidelity PDF → DOCX conversion is done by the open-source `pdf2docx`
 * Python engine (installed as a repl language package). We keep the Python
 * inline and pass it to `python3 -c` so there is no separate script file to
 * bundle/copy into the production build — the interpreter and package are the
 * only runtime requirements.
 */
const PY_CODE = [
  "import sys",
  "from pdf2docx import Converter",
  "src, dst = sys.argv[1], sys.argv[2]",
  "cv = Converter(src)",
  "try:",
  "    cv.convert(dst)",
  "finally:",
  "    cv.close()",
].join("\n");

function findWorkspaceRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/**
 * Resolve the Python interpreter. Prefer an explicit PYTHON_BIN override, then
 * the repl's uv-managed venv (.pythonlibs), then a bare `python3` on PATH.
 */
function resolvePythonBin(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  const root = findWorkspaceRoot(process.cwd());
  const venvPy = path.join(root, ".pythonlibs", "bin", "python3");
  if (fs.existsSync(venvPy)) return venvPy;
  return "python3";
}

const PYTHON_BIN = resolvePythonBin();

export class PdfConversionError extends Error {
  readonly timedOut: boolean;
  constructor(message: string, timedOut = false) {
    super(message);
    this.name = "PdfConversionError";
    this.timedOut = timedOut;
  }
}

/**
 * Convert a PDF at `inputPath` into a .docx at `outputPath`. Rejects with a
 * PdfConversionError on failure or timeout. The caller owns both temp files
 * and is responsible for cleaning them up.
 */
export function convertPdfToDocx(
  inputPath: string,
  outputPath: string,
  opts: { timeoutMs?: number } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 120_000;

  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["-c", PY_CODE, inputPath, outputPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 4000) stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new PdfConversionError(`Failed to start converter: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new PdfConversionError("Conversion timed out", true));
        return;
      }
      if (code !== 0) {
        reject(
          new PdfConversionError(
            stderr.trim() || `Converter exited with code ${code}`,
          ),
        );
        return;
      }
      resolve();
    });
  });
}
