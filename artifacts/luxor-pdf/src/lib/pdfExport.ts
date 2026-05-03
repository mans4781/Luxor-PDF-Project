/**
 * pdf-lib export pipeline for Edit-menu features.
 *
 * Loads the original PDF bytes, draws a text watermark and/or page
 * numbers onto each page in PDF user space (origin = bottom-left), and
 * returns a new PDF Blob. The on-screen overlay rendered in PDFPage
 * uses CSS-based equivalents so what the user sees in the viewer
 * matches what gets baked into the saved file.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import {
  hexToRgb01,
  watermarkAppliesTo,
  pageNoAppliesTo,
  formatPageLabel,
  type WatermarkConfig,
  type PageNoConfig,
  type WatermarkPosition,
  type PageNoPosition,
} from "./editTypes";
import type {
  RedactionAnnotation, ImageAnnotation, EditTextAnnotation,
} from "./annotationTypes";

export interface ExportEdits {
  watermark?: WatermarkConfig | null;
  pageNo?: PageNoConfig | null;
  /** Redaction boxes (normalized 0..1 page coords) to burn in as opaque black. */
  redactions?: RedactionAnnotation[];
  /** Raster images (PNG/JPEG) to embed and draw on each page. */
  images?: ImageAnnotation[];
  /** Adobe-style text replacements: cover rect + replacement string. */
  editTexts?: EditTextAnnotation[];
  /** 1-based page that was current in the viewer (used by `pageRange: current`). */
  currentPage: number;
}

export async function exportPdfWithEdits(file: File, edits: ExportEdits): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const total = pages.length;

  // Group redactions and images by 1-based page index for O(1) lookup per page.
  const redactionsByPage = new Map<number, RedactionAnnotation[]>();
  for (const r of edits.redactions ?? []) {
    const arr = redactionsByPage.get(r.page);
    if (arr) arr.push(r); else redactionsByPage.set(r.page, [r]);
  }
  const imagesByPage = new Map<number, ImageAnnotation[]>();
  for (const im of edits.images ?? []) {
    const arr = imagesByPage.get(im.page);
    if (arr) arr.push(im); else imagesByPage.set(im.page, [im]);
  }
  const editTextsByPage = new Map<number, EditTextAnnotation[]>();
  for (const et of edits.editTexts ?? []) {
    const arr = editTextsByPage.get(et.page);
    if (arr) arr.push(et); else editTextsByPage.set(et.page, [et]);
  }

  // Embed each unique image once and reuse the embedded handle on every
  // page that references it. Keyed by dataUrl so duplicates dedupe.
  const embeddedCache = new Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
  for (const im of edits.images ?? []) {
    if (embeddedCache.has(im.dataUrl)) continue;
    const bytes = dataUrlToBytes(im.dataUrl);
    const embedded = im.mime === "image/png"
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    embeddedCache.set(im.dataUrl, embedded);
  }

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const p = pages[i];
    const { width, height } = p.getSize();

    // Redactions FIRST so watermark/page-no remain visible above them.
    const reds = redactionsByPage.get(pageNum);
    if (reds && reds.length) drawRedactionsOnPage(p, reds, width, height);

    const ims = imagesByPage.get(pageNum);
    if (ims && ims.length) drawImagesOnPage(p, ims, embeddedCache, width, height);

    const ets = editTextsByPage.get(pageNum);
    if (ets && ets.length) drawEditTextsOnPage(p, ets, font, width, height);

    if (edits.watermark && watermarkAppliesTo(edits.watermark, pageNum, edits.currentPage)) {
      drawWatermarkOnPage(p, edits.watermark, fontBold, width, height);
    }
    if (edits.pageNo && pageNoAppliesTo(edits.pageNo, pageNum)) {
      drawPageNoOnPage(p, edits.pageNo, pageNum, total, font, width, height);
    }
  }

  const out = await pdf.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}

function drawWatermarkOnPage(
  page: ReturnType<PDFDocument["getPages"]>[number],
  cfg: WatermarkConfig,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  w: number,
  h: number,
) {
  const c = hexToRgb01(cfg.color);
  const baseOpts = {
    font,
    size: cfg.fontSize,
    color: rgb(c.r, c.g, c.b),
    opacity: cfg.opacity,
    rotate: degrees(cfg.rotation),
  };

  if (cfg.position === "tiled") {
    // Lay watermark on a diagonal grid covering the whole page.
    const stepX = Math.max(150, cfg.fontSize * 4);
    const stepY = Math.max(120, cfg.fontSize * 3);
    for (let y = 0; y < h + stepY; y += stepY) {
      for (let x = 0; x < w + stepX; x += stepX) {
        page.drawText(cfg.text, { ...baseOpts, x, y });
      }
    }
    return;
  }

  const textW = font.widthOfTextAtSize(cfg.text, cfg.fontSize);
  const textH = cfg.fontSize;
  const M = 36;
  // Desired visual *center* of the rotated text box. Choosing center as the
  // anchor lets us match the on-screen CSS overlay, which uses
  // `transform-origin: center center` — i.e. the box rotates in place around
  // its own midpoint regardless of corner.
  let cx = 0;
  let cy = 0;
  switch (cfg.position) {
    case "center":       cx = w / 2;              cy = h / 2;             break;
    case "top-left":     cx = M + textW / 2;      cy = h - M - textH / 2; break;
    case "top-right":    cx = w - M - textW / 2;  cy = h - M - textH / 2; break;
    case "bottom-left":  cx = M + textW / 2;      cy = M + textH / 2;     break;
    case "bottom-right": cx = w - M - textW / 2;  cy = M + textH / 2;     break;
  }
  // pdf-lib rotates the text around the (x, y) anchor (bottom-left of the
  // un-rotated text box). Solve for the anchor so that the rotated text's
  // center lands on (cx, cy):  anchor = center - R(textW/2, textH/2).
  const t = (cfg.rotation * Math.PI) / 180;
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const dx = (textW / 2) * cosT - (textH / 2) * sinT;
  const dy = (textW / 2) * sinT + (textH / 2) * cosT;
  page.drawText(cfg.text, { ...baseOpts, x: cx - dx, y: cy - dy });
}

function drawPageNoOnPage(
  page: ReturnType<PDFDocument["getPages"]>[number],
  cfg: PageNoConfig,
  pageNum: number,
  total: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  w: number,
  h: number,
) {
  const label = formatPageLabel(cfg, pageNum, total);
  const c = hexToRgb01(cfg.color);
  const textW = font.widthOfTextAtSize(label, cfg.fontSize);
  const M = 24;
  let x = 0;
  let y = 0;
  switch (cfg.position) {
    case "bottom-center": x = (w - textW) / 2; y = M; break;
    case "bottom-left":   x = M;               y = M; break;
    case "bottom-right":  x = w - textW - M;   y = M; break;
    case "top-center":    x = (w - textW) / 2; y = h - cfg.fontSize - M; break;
    case "top-left":      x = M;               y = h - cfg.fontSize - M; break;
    case "top-right":     x = w - textW - M;   y = h - cfg.fontSize - M; break;
  }
  page.drawText(label, {
    font,
    size: cfg.fontSize,
    color: rgb(c.r, c.g, c.b),
    x,
    y,
  });
}

/**
 * Burn opaque black rectangles over each redaction. Stored coords are
 * normalized (0..1) with the SCREEN convention (origin top-left, y grows
 * down), so we flip y into pdf-lib user-space (origin bottom-left).
 */
function drawRedactionsOnPage(
  page: ReturnType<PDFDocument["getPages"]>[number],
  redactions: RedactionAnnotation[],
  w: number,
  h: number,
) {
  for (const r of redactions) {
    // Map from displayed-canvas top-left coords into PDF user-space (origin
    // bottom-left, ALWAYS unrotated — pdf-lib drawRectangle uses MediaBox
    // coords regardless of any /Rotate set on the page). `w` and `h` here
    // are page user-space dimensions from page.getSize(). When the
    // rendered viewport was rotated 90/270, the displayed canvas is `h`
    // wide and `w` tall; we account for that in the per-rotation case.
    const rot = (((r.rotation ?? 0) % 360) + 360) % 360;
    let x: number, y: number, width: number, height: number;
    switch (rot) {
      case 90: {
        // Displayed: h wide × w tall. Screen TL (rx*h, ry*w) → user BL.
        x = r.y * w;
        y = h - r.x * h - r.w * h;
        width = r.h * w;
        height = r.w * h;
        break;
      }
      case 180: {
        x = w - r.x * w - r.w * w;
        y = r.y * h;
        width = r.w * w;
        height = r.h * h;
        break;
      }
      case 270: {
        // Displayed: h wide × w tall. Mirror of the 90° case.
        x = w - r.y * w - r.h * w;
        y = r.x * h;
        width = r.h * w;
        height = r.w * h;
        break;
      }
      case 0:
      default: {
        x = r.x * w;
        y = h - r.y * h - r.h * h;
        width = r.w * w;
        height = r.h * h;
        break;
      }
    }
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(0, 0, 0),
      opacity: 1,
    });
  }
}

/** Decode a `data:` URL of base64-encoded bytes into a Uint8Array. */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Burn raster images onto a page. Coordinate handling mirrors
 * drawRedactionsOnPage so images placed while the viewport was rotated
 * land in the right user-space rectangle.
 *
 * Image *content* is NOT counter-rotated for non-zero `rotation` — the
 * image is drawn upright in PDF user-space, which is what feels right
 * when the user later opens the file with /Rotate applied.
 */
function drawImagesOnPage(
  page: ReturnType<PDFDocument["getPages"]>[number],
  images: ImageAnnotation[],
  cache: Map<string, Awaited<ReturnType<PDFDocument["embedPng"]>>>,
  w: number,
  h: number,
) {
  for (const im of images) {
    const embedded = cache.get(im.dataUrl);
    if (!embedded) continue;
    const rot = (((im.rotation ?? 0) % 360) + 360) % 360;
    let x: number, y: number, width: number, height: number;
    switch (rot) {
      case 90: {
        x = im.y * w;
        y = h - im.x * h - im.w * h;
        width = im.h * w;
        height = im.w * h;
        break;
      }
      case 180: {
        x = w - im.x * w - im.w * w;
        y = im.y * h;
        width = im.w * w;
        height = im.h * h;
        break;
      }
      case 270: {
        x = w - im.y * w - im.h * w;
        y = im.x * h;
        width = im.h * w;
        height = im.w * h;
        break;
      }
      case 0:
      default: {
        x = im.x * w;
        y = h - im.y * h - im.h * h;
        width = im.w * w;
        height = im.h * h;
        break;
      }
    }
    page.drawImage(embedded, { x, y, width, height });
  }
}

/**
 * Burn Adobe-style text replacements: cover original PDF text with a
 * `coverColor` rectangle, then draw the replacement string on top in
 * Helvetica at the user's chosen `textColor`. Only `rotation === 0`
 * entries are processed — others are silently skipped to avoid placing
 * the cover in the wrong spot. Stored coords are normalized 0..1 with
 * the SCREEN convention (origin top-left, y grows down); we flip y
 * into PDF user-space (origin bottom-left).
 */
function drawEditTextsOnPage(
  page: ReturnType<PDFDocument["getPages"]>[number],
  edits: EditTextAnnotation[],
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  w: number,
  h: number,
) {
  for (const e of edits) {
    const rot = (((e.rotation ?? 0) % 360) + 360) % 360;
    if (rot !== 0) continue;
    const cx = hexToRgb01(e.coverColor ?? "#FFFFFF");
    const tx = hexToRgb01(e.textColor ?? "#000000");
    const rectX = e.x * w;
    const rectY = h - e.y * h - e.h * h;
    const rectW = e.w * w;
    const rectH = e.h * h;
    page.drawRectangle({
      x: rectX, y: rectY, width: rectW, height: rectH,
      color: rgb(cx.r, cx.g, cx.b),
      opacity: 1,
    });
    if (!e.text) continue;
    // Vertically center the new text in the cover rect; small left pad.
    const fontSize = e.fontSize;
    const textY = rectY + (rectH - fontSize) / 2 + fontSize * 0.18;
    page.drawText(e.text, {
      x: rectX + 1,
      y: textY,
      size: fontSize,
      font,
      color: rgb(tx.r, tx.g, tx.b),
    });
  }
}

// Re-export types touched by callers so they don't need to import twice.
export type { WatermarkConfig, PageNoConfig, WatermarkPosition, PageNoPosition };
