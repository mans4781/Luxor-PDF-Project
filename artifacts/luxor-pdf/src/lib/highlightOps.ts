/**
 * Pure utilities for highlight rect math:
 *   - getSelectionRects(): per-line rects from a DOM Selection, normalized
 *     to a page-sized container.
 *   - splitHighlightRect(): subtract an axis-aligned eraser box from a
 *     highlight rect, returning 0..4 surviving sub-rects.
 *   - eraseHighlightPart(): apply splitHighlightRect across every rect of
 *     a highlight annotation, returning the new rect array (possibly empty,
 *     in which case the caller should remove the annotation entirely).
 *   - createHighlightFromSelection(): build a HighlightAnnotation payload.
 *
 * Coordinates here are always normalized 0..1 against the rendered page.
 * That keeps highlights stable through zoom, rotation and re-render — the
 * page renderer multiplies them back up by the live canvas size.
 */
import type { HighlightAnnotation } from "./annotationTypes";

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Group raw selection rects into visual lines and merge ONLY the truly
 * adjacent fragments inside each line.
 *
 * The previous implementation merged with a `+ 2` gap threshold that was
 * meant to be pixels but was applied to normalized (0..1) values, so every
 * fragment on a row collapsed into one box and the merge stretched y/height
 * to the union — producing highlights that bled into the lines above and
 * below. We now:
 *   - Group rects into rows by y-proximity (within ~50% of line height).
 *   - Inside a row, keep a consistent line bounding box (min y, max bottom)
 *     so per-fragment y jitter doesn't make the strip taller.
 *   - Only join adjacent fragments (gap small relative to line height).
 */
export function groupRectsIntoLines(rects: Rect[], smallGap = 0.25): Rect[] {
  if (rects.length === 0) return [];
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);

  const rows: Rect[][] = [];
  for (const r of sorted) {
    const row = rows[rows.length - 1];
    const sample = row?.[0];
    const sameLine =
      sample !== undefined &&
      Math.abs(r.y - sample.y) < Math.max(sample.height, r.height) * 0.5;
    if (sameLine) row!.push(r);
    else rows.push([r]);
  }

  const out: Rect[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    const top = Math.min(...row.map((r) => r.y));
    const bottom = Math.max(...row.map((r) => r.y + r.height));
    const lineH = bottom - top;
    const joinGap = lineH * smallGap;

    let cur: Rect = { x: row[0].x, y: top, width: row[0].width, height: lineH };
    for (let i = 1; i < row.length; i++) {
      const r = row[i];
      const curRight = cur.x + cur.width;
      if (r.x <= curRight + joinGap) {
        cur.width = Math.max(curRight, r.x + r.width) - cur.x;
      } else {
        out.push(cur);
        cur = { x: r.x, y: top, width: r.width, height: lineH };
      }
    }
    out.push(cur);
  }
  return out;
}

/**
 * Read the current window selection and return per-line normalized rects
 * scoped to `wrapperEl`. Returns null if there is no usable selection.
 */
export function getSelectionRects(
  wrapperEl: HTMLElement,
): { text: string; rects: Rect[] } | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return null;
  const text = sel.toString().trim();
  if (!text) return null;

  const range = sel.getRangeAt(0);
  const wrapperRect = wrapperEl.getBoundingClientRect();
  if (wrapperRect.width <= 0 || wrapperRect.height <= 0) return null;

  const raw: Rect[] = [];
  const clientRects = range.getClientRects();
  for (let i = 0; i < clientRects.length; i++) {
    const r = clientRects[i];
    if (r.width <= 0 || r.height <= 0) continue;
    raw.push({
      x: (r.left - wrapperRect.left) / wrapperRect.width,
      y: (r.top - wrapperRect.top) / wrapperRect.height,
      width: r.width / wrapperRect.width,
      height: r.height / wrapperRect.height,
    });
  }
  if (raw.length === 0) return null;

  return { text, rects: groupRectsIntoLines(raw) };
}

/**
 * Subtract an axis-aligned eraser box from a single highlight rect and
 * return the surviving pieces. All inputs share the same coordinate space
 * (normalized OR pixel — caller's choice).
 *
 * Cases:
 *   - No overlap         → returns [original]
 *   - Eraser fully covers → returns []
 *   - Partial overlap    → returns up to 4 sub-rects (left, right, top, bottom)
 */
export function splitHighlightRect(rect: Rect, eraser: Rect): Rect[] {
  const ix1 = Math.max(rect.x, eraser.x);
  const iy1 = Math.max(rect.y, eraser.y);
  const ix2 = Math.min(rect.x + rect.width, eraser.x + eraser.width);
  const iy2 = Math.min(rect.y + rect.height, eraser.y + eraser.height);

  if (ix1 >= ix2 || iy1 >= iy2) return [rect];

  // Eraser fully covers rect.
  if (
    eraser.x <= rect.x &&
    eraser.y <= rect.y &&
    eraser.x + eraser.width >= rect.x + rect.width &&
    eraser.y + eraser.height >= rect.y + rect.height
  ) {
    return [];
  }

  const pieces: Rect[] = [];
  // Left strip
  if (ix1 > rect.x) {
    pieces.push({ x: rect.x, y: rect.y, width: ix1 - rect.x, height: rect.height });
  }
  // Right strip
  if (ix2 < rect.x + rect.width) {
    pieces.push({
      x: ix2,
      y: rect.y,
      width: rect.x + rect.width - ix2,
      height: rect.height,
    });
  }
  // Middle column above eraser (between left/right strips)
  if (iy1 > rect.y) {
    pieces.push({ x: ix1, y: rect.y, width: ix2 - ix1, height: iy1 - rect.y });
  }
  // Middle column below eraser
  if (iy2 < rect.y + rect.height) {
    pieces.push({
      x: ix1,
      y: iy2,
      width: ix2 - ix1,
      height: rect.y + rect.height - iy2,
    });
  }

  // Drop slivers that round to nothing.
  return pieces.filter((p) => p.width > 1e-6 && p.height > 1e-6);
}

/**
 * Apply an eraser box across every rect in a highlight annotation.
 * Returns the new rect list. If empty, caller should remove the annotation.
 */
export function eraseHighlightPart(
  rects: Rect[],
  eraser: Rect,
): Rect[] {
  const out: Rect[] = [];
  for (const r of rects) out.push(...splitHighlightRect(r, eraser));
  return out;
}

/**
 * Build a highlight annotation payload from a selection result.
 */
export function createHighlightFromSelection(args: {
  id: string;
  page: number;
  selection: { text: string; rects: Rect[] };
  color: string;
  opacity?: number;
}): HighlightAnnotation {
  return {
    id: args.id,
    type: "highlight",
    page: args.page,
    rects: args.selection.rects,
    color: args.color,
    opacity: args.opacity,
    selectedText: args.selection.text,
    createdAt: new Date().toISOString(),
  };
}
