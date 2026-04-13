export type ToolType = "hand" | "highlight" | "eraser" | "text" | "freehand" | "line" | "arrow" | "oval" | "rectangle";

export interface Point { x: number; y: number; }

export interface HighlightAnnotation {
  id: string;
  type: "highlight";
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
}

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
}

export type ShapeAnnotation = FreehandAnnotation | LineAnnotation | ArrowAnnotation | OvalAnnotation | RectAnnotation;

export type Annotation = HighlightAnnotation | TextAnnotation | CommentAnnotation | ShapeAnnotation;
