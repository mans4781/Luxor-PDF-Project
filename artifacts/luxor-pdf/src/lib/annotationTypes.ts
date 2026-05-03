export type ToolType = "hand" | "highlight" | "eraser" | "text" | "freehand" | "line" | "arrow" | "oval" | "rectangle" | "redact";

export interface Point { x: number; y: number; }

export interface HighlightAnnotation {
  id: string;
  type: "highlight";
  page: number;
  /**
   * Per-line rectangles in NORMALIZED page coordinates (0..1 of the
   * rendered page width/height). Multi-line selections produce one
   * rect per visual line, never a single bounding box across lines.
   */
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
  /** Optional opacity (0..1). Renderer falls back to color's own alpha. */
  opacity?: number;
  /** Plain text that was selected when the highlight was created. */
  selectedText?: string;
  /** ISO timestamp when the annotation was created. */
  createdAt?: string;
}

/**
 * Underline / strike-through text-markup annotations. Same per-line rect
 * geometry as HighlightAnnotation (normalized 0..1 against the rendered
 * page) so they survive zoom/rotation. Renderer draws a single line
 * along the bottom (underline) or middle (strike) of each rect.
 */
export interface UnderlineAnnotation {
  id: string;
  type: "underline";
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
  selectedText?: string;
  createdAt?: string;
}

export interface StrikeAnnotation {
  id: string;
  type: "strike";
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
  selectedText?: string;
  createdAt?: string;
}

export type TextMarkupAnnotation = HighlightAnnotation | UnderlineAnnotation | StrikeAnnotation;

export interface TextAnnotation {
  id: string;
  type: "text";
  page: number;
  x: number;
  y: number;
  content: string;
  fontSize: number;
  color: string;
  letterSpacing?: number;
}

export interface CommentAnnotation {
  id: string;
  type: "comment";
  page: number;
  x: number;
  y: number;
  text: string;
  selectedText: string;
  rects: { x: number; y: number; width: number; height: number }[];
}

export interface FreehandAnnotation {
  id: string;
  type: "freehand";
  page: number;
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface LineAnnotation {
  id: string;
  type: "line";
  page: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  lineWidth: number;
}

export interface ArrowAnnotation {
  id: string;
  type: "arrow";
  page: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  lineWidth: number;
}

export interface OvalAnnotation {
  id: string;
  type: "oval";
  page: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  lineWidth: number;
  /** When true, fill the shape with `color` at `fillOpacity` (default 0.25). */
  fill?: boolean;
  fillOpacity?: number;
}

export interface RectAnnotation {
  id: string;
  type: "rect";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lineWidth: number;
  /** When true, fill the shape with `color` at `fillOpacity` (default 0.25). */
  fill?: boolean;
  fillOpacity?: number;
}

export type ShapeAnnotation = FreehandAnnotation | LineAnnotation | ArrowAnnotation | OvalAnnotation | RectAnnotation;

/**
 * Permanent redaction box. Coordinates are NORMALIZED 0..1 against the
 * rendered page (same scheme as highlights) so they survive zoom and
 * rotation, and so the export pipeline can convert them to PDF user-space
 * units regardless of viewer DPR. Always rendered as fully opaque black —
 * once burned in by pdf-lib the underlying content is permanently covered.
 */
export interface RedactionAnnotation {
  id: string;
  type: "redact";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Total rotation (page.rotate + viewer rotation, normalized 0/90/180/270)
   * applied to the rendered viewport when the box was drawn. The export
   * pipeline uses this to map the rect back into PDF user-space, which is
   * always unrotated regardless of view orientation.
   */
  rotation?: number;
  createdAt?: string;
}

export type Annotation =
  | HighlightAnnotation
  | UnderlineAnnotation
  | StrikeAnnotation
  | TextAnnotation
  | CommentAnnotation
  | ShapeAnnotation
  | RedactionAnnotation;
