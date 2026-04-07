export type ToolType = "hand" | "highlight" | "eraser" | "text";

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
}

export type Annotation = HighlightAnnotation | TextAnnotation;
