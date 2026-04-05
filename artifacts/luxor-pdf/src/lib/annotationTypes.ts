export type ToolType =
  | "select"
  | "hand"
  | "highlight"
  | "pencil"
  | "eraser"
  | "text"
  | "rectangle"
  | "comment";

export interface Point {
  x: number;
  y: number;
}

export interface HighlightAnnotation {
  id: string;
  type: "highlight";
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
  color: string;
  opacity: number;
}

export interface DrawAnnotation {
  id: string;
  type: "draw";
  page: number;
  points: Point[];
  color: string;
  lineWidth: number;
  opacity: number;
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
  bold: boolean;
  italic: boolean;
}

export interface RectAnnotation {
  id: string;
  type: "rect";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor: string;
  lineWidth: number;
  opacity: number;
}

export interface CommentAnnotation {
  id: string;
  type: "comment";
  page: number;
  x: number;
  y: number;
  content: string;
  author: string;
  timestamp: string;
}

export type Annotation =
  | HighlightAnnotation
  | DrawAnnotation
  | TextAnnotation
  | RectAnnotation
  | CommentAnnotation;
