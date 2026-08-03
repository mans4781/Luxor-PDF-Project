/**
 * pdf.js 5.x decodes JPEG2000 (JPXDecode) and JBIG2 images with WASM
 * decoders it fetches at runtime from `wasmUrl`. If the option is missing
 * the fetch fails silently and those images render as blank areas —
 * scanned permits / maps are the classic casualty.
 *
 * The files are copied from pdfjs-dist/wasm/ into public/wasm/ (keep them
 * in sync when upgrading pdfjs-dist).
 *
 * Must be an ABSOLUTE url ending in "/": the fetch happens inside the
 * pdf.js worker, where relative paths don't resolve against the app base.
 */
export const PDF_WASM_URL = new URL(
  `${import.meta.env.BASE_URL}wasm/`,
  window.location.href,
).toString();
