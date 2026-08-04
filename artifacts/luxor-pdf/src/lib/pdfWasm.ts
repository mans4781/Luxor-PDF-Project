/**
 * pdf.js 5.x decodes JPEG2000 (JPXDecode) and JBIG2 images with WASM
 * decoders it fetches at runtime from `wasmUrl`. If the option is missing
 * the fetch fails silently and those images render as blank areas —
 * scanned permits / maps are the classic casualty.
 *
 * Required files in public/wasm/ (copy from pdfjs-dist/wasm/ on upgrade):
 *   - openjpeg.wasm              — JPEG2000 (JPXDecode) decoder
 *   - openjpeg_nowasm_fallback.js — JS fallback when WASM is unavailable
 *   - jbig2.wasm                 — JBIG2 monochrome image decoder
 *   - qcms_bg.wasm               — colour-profile / ICC decoder
 *
 * Must be an ABSOLUTE url ending in "/": the fetch happens inside the
 * pdf.js worker, where relative paths don't resolve against the app base.
 *
 * Pass `wasmUrl: PDF_WASM_URL` to EVERY getDocument() call (viewer, print,
 * compress). Missing it on even one call path blanks images for that path.
 */
export const PDF_WASM_URL = new URL(
  `${import.meta.env.BASE_URL}wasm/`,
  window.location.href,
).toString();
