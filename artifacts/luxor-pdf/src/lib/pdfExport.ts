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

export interface ExportEdits {
  watermark?: WatermarkConfig | null;
  pageNo?: PageNoConfig | null;
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

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const p = pages[i];
    const { width, height } = p.getSize();

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

// Re-export types touched by callers so they don't need to import twice.
export type { WatermarkConfig, PageNoConfig, WatermarkPosition, PageNoPosition };
