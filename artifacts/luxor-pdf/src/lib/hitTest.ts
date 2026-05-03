/**
 * Hit-tests for the eraser tool. Edge-style: the eraser deletes any
 * annotation it touches as a whole — one stroke = one annotation = one
 * delete. These functions answer "does the eraser disc intersect this
 * annotation?".
 *
 * Coordinate spaces in this app are mixed:
 *   - Highlight rects: NORMALIZED 0..1 of the rendered page
 *   - Shape annotations (freehand/line/arrow/oval/rect): CANVAS pixels
 *     (the high-DPI draw canvas at the time of creation)
 *   - Text/comment annotations: CSS pixels relative to the page wrapper
 *
 * The caller builds a HitContext with the eraser position/radius in all
 * three spaces and we route each annotation type to the right test.
 */
import type { Annotation, ShapeAnnotation } from "./annotationTypes";

export interface HitContext {
  cssX: number;
  cssY: number;
  canvasX: number;
  canvasY: number;
  normX: number;
  normY: number;
  radiusCss: number;
  radiusCanvas: number;
  radiusNormX: number;
  radiusNormY: number;
}

function circleIntersectsRect(
  cx: number, cy: number, r: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  const nearestX = Math.max(rx, Math.min(cx, rx + rw));
  const nearestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

function distPointToSegment(
  px: number, py: number,
  ax: number, ay: number, bx: number, by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * abx);
  const dy = py - (ay + t * aby);
  return Math.sqrt(dx * dx + dy * dy);
}

function segmentNearPolyline(
  px: number, py: number, points: { x: number; y: number }[], r: number,
): boolean {
  if (points.length === 0) return false;
  if (points.length === 1) {
    const dx = px - points[0].x;
    const dy = py - points[0].y;
    return dx * dx + dy * dy <= r * r;
  }
  for (let i = 1; i < points.length; i++) {
    if (distPointToSegment(px, py, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y) <= r) {
      return true;
    }
  }
  return false;
}

function pointNearEllipseOutline(
  px: number, py: number, cx: number, cy: number, rx: number, ry: number, r: number,
): boolean {
  // Approximation: project (px,py) to the ellipse along the radial angle
  // and measure linear distance to that projected point. Plenty accurate
  // for click hit-testing.
  if (rx <= 0 || ry <= 0) return false;
  const theta = Math.atan2(py - cy, px - cx);
  const ox = cx + rx * Math.cos(theta);
  const oy = cy + ry * Math.sin(theta);
  const ddx = px - ox;
  const ddy = py - oy;
  return Math.sqrt(ddx * ddx + ddy * ddy) <= r;
}

function pointNearRectOutline(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number, r: number,
): boolean {
  // Test against each of the 4 edges as line segments.
  const x2 = rx + rw;
  const y2 = ry + rh;
  return (
    distPointToSegment(px, py, rx, ry, x2, ry) <= r ||
    distPointToSegment(px, py, x2, ry, x2, y2) <= r ||
    distPointToSegment(px, py, x2, y2, rx, y2) <= r ||
    distPointToSegment(px, py, rx, y2, rx, ry) <= r
  );
}

/**
 * Approximate the bounding box of a text annotation in CSS pixels.
 * The renderer uses fontSize as line-height ~ 1.485x and characters
 * average ~0.55 of fontSize wide for sans-serif.
 */
export function approxTextBounds(ann: { x: number; y: number; content: string; fontSize: number; }) {
  const lines = (ann.content || "").split(/\n/);
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const w = Math.max(ann.fontSize * 4, longest * ann.fontSize * 0.55);
  const h = Math.max(1, lines.length) * ann.fontSize * 1.485;
  return { x: ann.x, y: ann.y, w, h };
}

export function hitTestAnnotation(ann: Annotation, ctx: HitContext): boolean {
  switch (ann.type) {
    case "highlight":
    case "underline":
    case "strike":
      return ann.rects.some((r) =>
        circleIntersectsRect(
          ctx.normX, ctx.normY,
          // Use the larger of the two normalized radii (page rarely square).
          Math.max(ctx.radiusNormX, ctx.radiusNormY),
          r.x, r.y, r.width, r.height,
        ),
      );
    case "freehand": {
      const lw = (ann.lineWidth || 1) / 2;
      return segmentNearPolyline(ctx.canvasX, ctx.canvasY, ann.points, ctx.radiusCanvas + lw);
    }
    case "line":
    case "arrow": {
      const lw = (ann.lineWidth || 1) / 2;
      return distPointToSegment(ctx.canvasX, ctx.canvasY, ann.x1, ann.y1, ann.x2, ann.y2) <= ctx.radiusCanvas + lw;
    }
    case "oval": {
      const lw = (ann.lineWidth || 1) / 2;
      return pointNearEllipseOutline(ctx.canvasX, ctx.canvasY, ann.cx, ann.cy, ann.rx, ann.ry, ctx.radiusCanvas + lw);
    }
    case "rect": {
      const lw = (ann.lineWidth || 1) / 2;
      return pointNearRectOutline(ctx.canvasX, ctx.canvasY, ann.x, ann.y, ann.w, ann.h, ctx.radiusCanvas + lw);
    }
    case "redact": {
      // Redactions are filled, so hit anywhere inside the box (in normalized
      // page coords). Lets the eraser tool delete a redaction by touching it.
      return (
        ctx.normX >= ann.x &&
        ctx.normX <= ann.x + ann.w &&
        ctx.normY >= ann.y &&
        ctx.normY <= ann.y + ann.h
      );
    }
    case "text": {
      const b = approxTextBounds(ann);
      return circleIntersectsRect(ctx.cssX, ctx.cssY, ctx.radiusCss, b.x, b.y, b.w, b.h);
    }
    case "comment": {
      // Comment icon is rendered at the first rect's top-left in normalized
      // coords; treat it as a small clickable disc.
      const r0 = ann.rects?.[0];
      if (!r0) return false;
      const dx = ctx.normX - r0.x;
      const dy = ctx.normY - r0.y;
      const radius = Math.max(ctx.radiusNormX, ctx.radiusNormY) + 0.012;
      return dx * dx + dy * dy <= radius * radius;
    }
  }
  return false;
}

/** Convenience: route a shape annotation through hitTestAnnotation. */
export function hitTestShape(ann: ShapeAnnotation, ctx: HitContext): boolean {
  return hitTestAnnotation(ann, ctx);
}
