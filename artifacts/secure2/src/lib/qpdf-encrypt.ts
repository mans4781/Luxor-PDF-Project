/**
 * Browser-side AES-256 PDF encryption using qpdf compiled to WebAssembly.
 *
 * The full qpdf engine (~1.3 MB .wasm) is lazy-loaded on first use so it
 * only downloads when a user actually applies a password to a PDF.
 */

const INPUT_PATH = "/input.pdf";
const OUTPUT_PATH = "/output.pdf";

type QpdfFS = {
  writeFile: (path: string, data: Uint8Array) => void;
  readFile: (path: string) => Uint8Array;
  unlink: (path: string) => void;
};

type QpdfInstance = {
  callMain: (args: string[]) => number;
  FS: QpdfFS;
};

let qpdfPromise: Promise<QpdfInstance> | null = null;

async function loadQpdf(): Promise<QpdfInstance> {
  if (!qpdfPromise) {
    qpdfPromise = (async () => {
      const [{ default: createModule }, { default: wasmUrl }] = await Promise.all([
        import("@neslinesli93/qpdf-wasm"),
        import("@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url"),
      ]);
      const instance = (await (createModule as unknown as (
        opts: { locateFile: () => string },
      ) => Promise<QpdfInstance>)({
        locateFile: () => wasmUrl,
      }));
      return instance;
    })();
  }
  return qpdfPromise;
}

export type QpdfPermissions = {
  /** When false, printing is forbidden. Default: true. */
  allowPrinting?: boolean;
  /** When false, copying / text extraction is forbidden. Default: true. */
  allowCopying?: boolean;
  /**
   * When false, all document modifications (annotations, form filling,
   * page assembly, content edits) are forbidden. Default: true.
   */
  allowModifications?: boolean;
};

/**
 * Encrypt a PDF file with AES-256 (PDF 2.0 / R6 security handler).
 *
 * @param input          Original PDF bytes.
 * @param userPassword   Password the recipient must type to open the file.
 *                       Pass "" to allow opening without a password while
 *                       still enforcing owner-set permissions.
 * @param ownerPassword  Owner password (defaults to userPassword if omitted).
 * @param permissions    Optional permission restrictions.
 * @returns A new Uint8Array containing the AES-256 encrypted PDF.
 */
export async function encryptPdfAes256(
  input: Uint8Array,
  userPassword: string,
  ownerPassword: string = userPassword || randomOwnerPassword(),
  permissions?: QpdfPermissions,
): Promise<Uint8Array> {
  const qpdf = await loadQpdf();

  // Clean up any leftovers from a previous call (best-effort).
  try { qpdf.FS.unlink(INPUT_PATH); } catch { /* not present */ }
  try { qpdf.FS.unlink(OUTPUT_PATH); } catch { /* not present */ }

  qpdf.FS.writeFile(INPUT_PATH, input);

  // qpdf CLI:
  //   qpdf --encrypt USER OWNER 256 [--print=none] [--extract=n] -- in.pdf out.pdf
  // 256 selects AES-256 (R6, PDF 2.0).
  const args: string[] = ["--encrypt", userPassword, ownerPassword, "256"];
  if (permissions?.allowPrinting === false) {
    args.push("--print=none");
  }
  if (permissions?.allowCopying === false) {
    args.push("--extract=n");
  }
  if (permissions?.allowModifications === false) {
    args.push("--modify=none");
  }
  args.push("--", INPUT_PATH, OUTPUT_PATH);

  const exit = qpdf.callMain(args);

  if (exit !== 0) {
    throw new Error(`qpdf encryption failed (exit code ${exit})`);
  }

  const out = qpdf.FS.readFile(OUTPUT_PATH);
  // Copy the bytes out of the WASM heap before they could be freed.
  const copy = new Uint8Array(out.length);
  copy.set(out);

  // Clean up so the next call starts fresh.
  try { qpdf.FS.unlink(INPUT_PATH); } catch { /* ignore */ }
  try { qpdf.FS.unlink(OUTPUT_PATH); } catch { /* ignore */ }

  return copy;
}

function randomOwnerPassword(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
