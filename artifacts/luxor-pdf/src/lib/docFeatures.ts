/**
 * Document-level feature extraction: metadata, permissions, heavy-file
 * detection and scanned-PDF detection. All functions take the loaded
 * pdf.js document proxy and are defensive — a malformed PDF should
 * degrade to "unknown" values, never crash the viewer.
 */

export interface DocMetadata {
  pdfVersion: string | null;
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  createdDate: string | null;
  modifiedDate: string | null;
  isEncrypted: boolean;
}

export interface DocSecurity {
  isEncrypted: boolean;
  /** null = no restrictions (all allowed) */
  printingAllowed: boolean;
  copyingAllowed: boolean;
  editingAllowed: boolean;
  annotatingAllowed: boolean;
  hasPermissionRestrictions: boolean;
  hasJavaScript: boolean;
  hasAttachments: boolean;
}

/** pdf.js permission flag constants (PDF spec table 22). */
const PERM = {
  PRINT: 0x04,
  MODIFY_CONTENTS: 0x08,
  COPY: 0x10,
  MODIFY_ANNOTATIONS: 0x20,
};

/** Convert a PDF date string (D:YYYYMMDDHHmmSS...) to a readable date. */
function parsePdfDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(raw);
  if (!m) return raw;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00"] = m;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  if (isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function extractMetadata(pdfDoc: any, passwordProtected: boolean): Promise<DocMetadata> {
  try {
    const { info } = await pdfDoc.getMetadata();
    return {
      pdfVersion: info?.PDFFormatVersion ?? null,
      title: info?.Title || null,
      author: info?.Author || null,
      subject: info?.Subject || null,
      creator: info?.Creator || null,
      producer: info?.Producer || null,
      createdDate: parsePdfDate(info?.CreationDate),
      modifiedDate: parsePdfDate(info?.ModDate),
      isEncrypted: Boolean(info?.IsEncrypted) || passwordProtected,
    };
  } catch {
    return {
      pdfVersion: null, title: null, author: null, subject: null,
      creator: null, producer: null, createdDate: null, modifiedDate: null,
      isEncrypted: passwordProtected,
    };
  }
}

export async function extractSecurity(pdfDoc: any, passwordProtected: boolean): Promise<DocSecurity> {
  let perms: number[] | null = null;
  let hasJavaScript = false;
  let hasAttachments = false;
  try { perms = await pdfDoc.getPermissions(); } catch { /* unknown */ }
  try {
    const js = await pdfDoc.getJSActions?.();
    hasJavaScript = js != null && Object.keys(js).length > 0;
  } catch { /* unknown */ }
  try {
    const att = await pdfDoc.getAttachments?.();
    hasAttachments = att != null && Object.keys(att).length > 0;
  } catch { /* unknown */ }

  // getPermissions() returns null when the PDF imposes no restrictions.
  const allowed = (flag: number) => perms === null || perms.includes(flag);
  return {
    isEncrypted: passwordProtected || perms !== null,
    printingAllowed: allowed(PERM.PRINT),
    copyingAllowed: allowed(PERM.COPY),
    editingAllowed: allowed(PERM.MODIFY_CONTENTS),
    annotatingAllowed: allowed(PERM.MODIFY_ANNOTATIONS),
    hasPermissionRestrictions: perms !== null,
    hasJavaScript,
    hasAttachments,
  };
}

/**
 * Sample the first few pages for extractable text. A PDF whose sampled
 * pages contain no text items is almost certainly scanned (image-only),
 * which drives the "not searchable" search message and the OCR panel.
 */
export async function detectScanned(pdfDoc: any, samplePages = 5): Promise<boolean> {
  try {
    const n = Math.min(samplePages, pdfDoc.numPages);
    for (let i = 1; i <= n; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((it: any) => it.str).join("").trim();
      if (text.length > 20) return false;
    }
    return true;
  } catch {
    return false;
  }
}
