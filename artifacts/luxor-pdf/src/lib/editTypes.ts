/**
 * Shared types for the Edit-menu features that burn into the PDF on
 * download (Watermark, Page Numbers). Kept in their own module so the
 * settings modals, the on-screen overlay renderer, and the pdf-lib
 * export pipeline all share one source of truth.
 */

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "tiled";

export type WatermarkPageRange =
  | { kind: "all" }
  | { kind: "current" }
  | { kind: "custom"; start: number; end: number };

export interface WatermarkConfig {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  pageRange: WatermarkPageRange;
}

export const DEFAULT_WATERMARK: WatermarkConfig = {
  text: "CONFIDENTIAL",
  fontSize: 72,
  color: "#000000",
  opacity: 0.18,
  rotation: -35,
  position: "center",
  pageRange: { kind: "all" },
};

export type PageNoPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

export interface PageNoConfig {
  format: string;
  position: PageNoPosition;
  fontSize: number;
  color: string;
  startNumber: number;
  pageFrom: number;
  pageTo: number;
}

export const DEFAULT_PAGENO: PageNoConfig = {
  format: "Page {page} of {total}",
  position: "bottom-center",
  fontSize: 11,
  color: "#333333",
  startNumber: 1,
  pageFrom: 1,
  pageTo: 1,
};

export function formatPageLabel(cfg: PageNoConfig, page: number, total: number): string {
  const display = cfg.startNumber + (page - cfg.pageFrom);
  return cfg.format
    .replace(/\{page\}/g, String(display))
    .replace(/\{total\}/g, String(total));
}

export function watermarkAppliesTo(
  cfg: WatermarkConfig,
  page: number,
  currentPage: number,
): boolean {
  switch (cfg.pageRange.kind) {
    case "all":     return true;
    case "current": return page === currentPage;
    case "custom":  return page >= cfg.pageRange.start && page <= cfg.pageRange.end;
  }
}

export function pageNoAppliesTo(cfg: PageNoConfig, page: number): boolean {
  return page >= cfg.pageFrom && page <= cfg.pageTo;
}

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const v = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(v, 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}
