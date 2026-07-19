import { useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import { TextLayer, AnnotationLayer } from "pdfjs-dist";
import {
  Annotation, HighlightAnnotation, TextAnnotation, CommentAnnotation, ToolType,
  FreehandAnnotation, LineAnnotation, ArrowAnnotation, OvalAnnotation, RectAnnotation,
  RedactionAnnotation, ImageAnnotation, ShapeAnnotation, Point,
} from "@/lib/annotationTypes";
import {
  getSelectionRects as readSelectionRects,
  createHighlightFromSelection,
  type Rect,
} from "@/lib/highlightOps";
import { hitTestAnnotation, shapeToCanvasSpace, type HitContext } from "@/lib/hitTest";
import { watermarkAppliesTo, pageNoAppliesTo, formatPageLabel } from "@/lib/editTypes";
import {
  HIGHLIGHT_COLORS as HIGHLIGHT_PALETTE,
  QUICK_HIGHLIGHT_COLORS,
  DEFAULTS as COLOR_DEFAULTS,
  highlightOpacityFor,
  allTextFonts,
  fontFamilyCss,
} from "@/lib/annotationColors";

const SHAPE_TOOLS: ToolType[] = ["freehand", "line", "arrow", "oval", "rectangle", "polygon", "cloud", "redact", "whiteout"];
const isShapeTool = (t: ToolType) => SHAPE_TOOLS.includes(t);

/** Eraser cursor radius in CSS pixels — matches the visual cursor circle. */
const ERASER_RADIUS_CSS = 10;

/**
 * Minimal link-service stub for pdf.js's AnnotationLayer. This feature renders
 * interactive AcroForm widgets only — never link navigation. Link handling is
 * deliberately inert: `externalLinkEnabled` is false and `addLinkAttributes`
 * never writes a PDF-controlled URL into `href`, so a hostile PDF cannot smuggle
 * a `javascript:`/`data:` link through the annotation layer.
 */
const FORM_LINK_SERVICE = {
  externalLinkTarget: null,
  externalLinkRel: "noopener noreferrer nofollow",
  externalLinkEnabled: false,
  isInPresentationMode: false,
  eventBus: undefined,
  getDestinationHash: () => "",
  getAnchorUrl: () => "",
  setHash: () => {},
  executeNamedAction: () => {},
  executeSetOCGState: () => {},
  addLinkAttributes: (link: HTMLAnchorElement) => {
    // Never trust the PDF-supplied URL. Neutralize the anchor entirely.
    link.removeAttribute("href");
    link.setAttribute("aria-disabled", "true");
    link.style.pointerEvents = "none";
  },
} as any;

/**
 * Open a Google search for the given text in the user's browser (new tab
 * on web; the desktop wrapper routes window.open to the default browser).
 */
function searchWebFor(text: string) {
  const q = (text || "").trim().slice(0, 500);
  if (!q) return;
  window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
}

interface PDFPageProps {
  pdfDocument: any;
  pageNum: number;
  zoom: number;
  rotation: number;
  searchTerm: string;
  tool: ToolType;
  annotations: Annotation[];
  highlightColor: string;
  textColor: string;
  textSize: number;
  textFont: string;
  textUnderline?: boolean;
  textStrike?: boolean;
  drawThickness: number;
  drawColor: string;
  /** When true, oval/rectangle shapes are also filled with `drawColor`. */
  shapeFill: boolean;
  shapeFillOpacity?: number;
  onAnnotationAdd: (a: Annotation) => void;
  /** Called after a double-click finishes (commits) a polygon, so the
   *  owner can deactivate the polygon tool (switch back to hand). */
  onPolygonDone?: () => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (id: string) => void;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
  onSearchTermChange?: (term: string) => void;
  /** Increment to request the sticky-note comment popup to open on the
   *  current text selection (ribbon "Comment" button). Only the page that
   *  owns the selection responds. */
  commentRequest?: number;
  /** Menu-bar text markup: bump `n` to apply the given markup kind to the
   *  current text selection. Only the page that owns the selection responds. */
  markupRequest?: { kind: "underline" | "strike" | "squiggly"; n: number };
  watermark?: import("@/lib/editTypes").WatermarkConfig | null;
  pageNo?: import("@/lib/editTypes").PageNoConfig | null;
  totalPages?: number;
  currentPage?: number;
  /** When true, native AcroForm widgets become interactive (users can type
   *  into text fields, tick checkboxes, pick dropdowns). Values are written
   *  to pdfDocument.annotationStorage and persist across zoom/re-render. */
  formFillMode?: boolean;
  /** Approximate CSS size (page-1 size at the current zoom) used to size
   *  the placeholder before this page has actually rendered, so the
   *  scrollbar and page positions stay stable under virtualization. */
  defaultPageSize?: { w: number; h: number } | null;
}

/** Pages whose wrapper is within this margin of the viewport get (and
 *  keep) a live canvas + text layer; everything further away is released
 *  so huge documents don't hold hundreds of canvases in memory. */
const RENDER_MARGIN = "1250px";

/** Cap on physical canvas pixels per page (~16 MP ≈ 64 MB RGBA). Above
 *  this the render scale is reduced — the page stays sharp enough while
 *  extreme zoom × DPR combinations can no longer allocate gigantic
 *  canvases that freeze the tab. */
const MAX_CANVAS_PIXELS = 16_000_000;

/** Minimum physical render scale (supersampling floor). Pages are always
 *  rasterized at at least this scale and then downscaled by CSS, so text
 *  and images stay crisp ("4K-like") even on standard 1× displays or at
 *  low zoom. Still subject to MAX_CANVAS_PIXELS above. */
const MIN_RENDER_SCALE = 2;

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TEXT_CMYK_COLORS = [
  { name: "Cyan",    hex: "#00AEEF" },
  { name: "Magenta", hex: "#EC008C" },
  { name: "Yellow",  hex: "#FFF200" },
  { name: "Black",   hex: "#1a1a1a" },
  { name: "Red",     hex: "#ED1C24" },
  { name: "Green",   hex: "#00A651" },
  { name: "Blue",    hex: "#2E3192" },
  { name: "Orange",  hex: "#F7941D" },
];

/**
 * On-screen overlay for an ImageAnnotation. Renders the embedded image
 * over the page canvas with click-to-select, drag-to-move and a single
 * bottom-right corner handle for aspect-ratio-preserving resize. The
 * overlay is invisible to pointer events whenever the user is in a
 * drawing/eraser tool so it never blocks the underlying tools.
 */
interface ImageOverlayProps {
  ann: ImageAnnotation;
  pageSize: { w: number; h: number };
  isInteractive: boolean;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onDelete: () => void;
}

function ImageOverlay({ ann, pageSize, isInteractive, onMove, onResize, onDelete }: ImageOverlayProps) {
  const [selected, setSelected] = useState(false);
  const [local, setLocal] = useState({ x: ann.x, y: ann.y, w: ann.w, h: ann.h });
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync from external updates (undo, etc) only when not actively dragging.
  useEffect(() => {
    setLocal({ x: ann.x, y: ann.y, w: ann.w, h: ann.h });
  }, [ann.x, ann.y, ann.w, ann.h]);

  // Click-outside deselects.
  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setSelected(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const sx = local.x;
    const sy = local.y;
    const lw = local.w;
    const lh = local.h;
    const onMove2 = (me: MouseEvent) => {
      const dx = (me.clientX - startMouseX) / pageSize.w;
      const dy = (me.clientY - startMouseY) / pageSize.h;
      const nx = Math.max(0, Math.min(1 - lw, sx + dx));
      const ny = Math.max(0, Math.min(1 - lh, sy + dy));
      setLocal(p => ({ ...p, x: nx, y: ny }));
    };
    const onUp = (me: MouseEvent) => {
      const dx = (me.clientX - startMouseX) / pageSize.w;
      const dy = (me.clientY - startMouseY) / pageSize.h;
      const nx = Math.max(0, Math.min(1 - lw, sx + dx));
      const ny = Math.max(0, Math.min(1 - lh, sy + dy));
      onMove(nx, ny);
      document.removeEventListener("mousemove", onMove2);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove2);
    document.addEventListener("mouseup", onUp);
  }, [isInteractive, local, pageSize.w, pageSize.h, onMove]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startMouseX = e.clientX;
    const sw = local.w;
    const sh = local.h;
    const aspect = sh / sw; // preserve aspect
    const lx = local.x;
    const ly = local.y;
    const compute = (clientX: number) => {
      const dx = (clientX - startMouseX) / pageSize.w;
      let nw = Math.max(0.03, Math.min(1 - lx, sw + dx));
      let nh = nw * aspect;
      if (nh > 1 - ly) { nh = 1 - ly; nw = nh / aspect; }
      return { w: nw, h: nh };
    };
    const onMove2 = (me: MouseEvent) => {
      const r = compute(me.clientX);
      setLocal(p => ({ ...p, w: r.w, h: r.h }));
    };
    const onUp = (me: MouseEvent) => {
      const r = compute(me.clientX);
      onResize(r.w, r.h);
      document.removeEventListener("mousemove", onMove2);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove2);
    document.addEventListener("mouseup", onUp);
  }, [local, pageSize.w, onResize]);

  const left = local.x * pageSize.w;
  const top = local.y * pageSize.h;
  const width = local.w * pageSize.w;
  const height = local.h * pageSize.h;

  return (
    <div
      ref={wrapRef}
      style={{
        position: "absolute",
        left, top, width, height,
        zIndex: selected ? 30 : 15,
        cursor: isInteractive ? "move" : "default",
        border: selected ? "2px dashed #0D62F2" : "1px dashed rgba(0,0,0,0.18)",
        boxSizing: "border-box",
        pointerEvents: isInteractive ? "auto" : "none",
        background: "transparent",
      }}
      onMouseDown={startDrag}
    >
      <img
        src={ann.dataUrl}
        alt=""
        draggable={false}
        style={{
          width: "100%", height: "100%",
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
          objectFit: "fill",
        }}
      />
      {selected && (
        <>
          <div
            onMouseDown={startResize}
            title="Drag to resize"
            style={{
              position: "absolute",
              right: -7, bottom: -7,
              width: 14, height: 14,
              background: "#0D62F2",
              border: "2px solid #fff",
              borderRadius: 2,
              cursor: "nwse-resize",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete image"
            style={{
              position: "absolute",
              top: -28, right: 0,
              background: "rgba(40,40,40,0.95)",
              border: "none", color: "#fff",
              borderRadius: 4, padding: "3px 10px",
              cursor: "pointer", fontSize: 12, fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}

interface TextBoxProps {
  ann: TextAnnotation;
  pageWidth: number;
  pageHeight: number;
  onMove: (x: number, y: number) => void;
  onUpdate: (patch: Partial<TextAnnotation>) => void;
  onDelete: () => void;
}

function DraggableTextBox({ ann, pageWidth, pageHeight, onMove, onUpdate, onDelete }: TextBoxProps) {
  // Zoom-stable rendering: annotations carry normalized page coords
  // (fractions of page width/height) so the box stays anchored to the
  // same document position at every zoom level. Legacy annotations
  // without `norm` fall back to their raw pixel coords.
  const dispX = ann.norm ? ann.norm.x * pageWidth : ann.x;
  const dispY = ann.norm ? ann.norm.y * pageHeight : ann.y;
  const dispSize = ann.norm ? ann.norm.size * pageWidth : ann.fontSize;
  const [selected, setSelected] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localPos, setLocalPos] = useState({ x: dispX, y: dispY });
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const wrapperBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalPos({ x: dispX, y: dispY });
  }, [dispX, dispY]);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      if (wrapperBoxRef.current && !wrapperBoxRef.current.contains(e.target as Node)) {
        setSelected(false);
        setShowColorPicker(false);
        if (editing) {
          const ta = inputRef.current;
          if (ta) {
            const trimmed = ta.value.trim();
            if (trimmed) { onUpdate({ content: trimmed }); }
            else { onDelete(); }
          }
          setEditing(false);
          setInputWidth(null);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected, editing, onUpdate, onDelete]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let moved = false;
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: localPos.x,
      startY: localPos.y,
    };
    const handleDragMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startMouseX;
      const dy = me.clientY - dragRef.current.startMouseY;
      if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      moved = true;
      setLocalPos({
        x: dragRef.current.startX + dx,
        y: dragRef.current.startY + dy,
      });
    };
    const handleDragUp = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const wasMoved = moved;
      const newX = dragRef.current.startX + (me.clientX - dragRef.current.startMouseX);
      const newY = dragRef.current.startY + (me.clientY - dragRef.current.startMouseY);
      dragRef.current = null;
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragUp);
      if (!wasMoved) return; // plain click: just select, don't persist a move
      setLocalPos({ x: newX, y: newY });
      // Persist both raw pixels (legacy readers) and normalized coords
      // so the box stays anchored across zoom changes.
      onUpdate({
        x: newX, y: newY,
        norm: { x: newX / pageWidth, y: newY / pageHeight, size: dispSize / pageWidth },
      });
    };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragUp);
  }, [localPos, onUpdate, pageWidth, pageHeight, dispSize]);

  /** Build a patch that also refreshes `norm` (call for size changes). */
  const sizePatch = useCallback((newSize: number): Partial<TextAnnotation> => ({
    fontSize: Math.round(newSize),
    norm: { x: localPos.x / pageWidth, y: localPos.y / pageHeight, size: newSize / pageWidth },
  }), [localPos, pageWidth, pageHeight]);

  const lineH = Math.round(dispSize * 1.485);
  const maxW = Math.max(60, pageWidth - localPos.x - 4);
  const initialW = Math.min(maxW, Math.max(110, dispSize * 7));
  const ls = ann.letterSpacing ?? 0;
  const textDeco = [ann.underline && "underline", ann.strikethrough && "line-through"]
    .filter(Boolean).join(" ") || undefined;
  const fontWeight = ann.bold ? 700 : 400;
  const fontStyle = ann.italic ? "italic" : "normal";
  const showControls = selected || editing || showColorPicker;

  const updateInputWidth = useCallback(() => {
    if (measureRef.current && inputRef.current) {
      const textW = measureRef.current.offsetWidth + 20;
      setInputWidth(Math.min(maxW, Math.max(initialW, textW)));
    }
  }, [maxW, initialW]);

  const commitEdit = useCallback((val: string) => {
    const trimmed = val.trim();
    if (trimmed) { onUpdate({ content: trimmed }); }
    else { onDelete(); }
    setEditing(false);
    setInputWidth(null);
  }, [onUpdate, onDelete]);

  const tbtnStyle: React.CSSProperties = {
    background: "none", border: "none", color: "#3a3a3a", cursor: "pointer",
    fontSize: 14, padding: "3px 4px", display: "flex", alignItems: "center",
    lineHeight: 1, borderRadius: 3,
  };

  return (
    <div
      ref={wrapperBoxRef}
      className="text-box-wrapper"
      style={{
        position: "absolute",
        left: localPos.x,
        top: localPos.y,
        zIndex: selected || editing ? 30 : 20,
        userSelect: "none",
      }}
      onMouseDown={() => setSelected(true)}
    >
      {showControls && (
        <div style={{
          position: "absolute", top: -(showColorPicker ? 60 : 30), left: 0,
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          background: "#F7F7F7", borderRadius: 5,
          border: "1px solid #e0e0e0",
          padding: "3px 6px", zIndex: 40, gap: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
        }}>
          {showColorPicker && (
            <div style={{ display: "flex", gap: 4, padding: "3px 0" }}>
              {TEXT_CMYK_COLORS.map(c => (
                <div
                  key={c.hex}
                  onClick={e => { e.stopPropagation(); onUpdate({ color: c.hex }); setShowColorPicker(false); }}
                  title={c.name}
                  style={{
                    width: 17, height: 17, borderRadius: "50%",
                    background: c.hex, cursor: "pointer",
                    border: ann.color === c.hex ? "2.5px solid #0D62F2" : "1.5px solid rgba(0,0,0,0.2)",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div
              onMouseDown={startDrag}
              style={{ cursor: "grab", display: "flex", alignItems: "center", padding: "3px 4px" }}
              title="Drag to move"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5">
                <circle cx="8" cy="6" r="1.2"/><circle cx="16" cy="6" r="1.2"/>
                <circle cx="8" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/>
                <circle cx="8" cy="18" r="1.2"/><circle cx="16" cy="18" r="1.2"/>
              </svg>
            </div>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <select
              value={ann.fontFamily ?? "times"}
              title="Font"
              onMouseDown={e => e.stopPropagation()}
              onChange={e => { e.stopPropagation(); onUpdate({ fontFamily: e.target.value }); }}
              style={{
                background: "#fff", color: "#333",
                border: "1px solid #d0d0d0", borderRadius: 3,
                fontSize: 12, padding: "2px 4px", cursor: "pointer", maxWidth: 96,
              }}
            >
              {allTextFonts().map(f => (
                <option key={f.key} value={f.key} style={{ color: "#000" }}>{f.label}</option>
              ))}
            </select>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Color"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowColorPicker(p => !p); }}
            >
              <div style={{ width: 15, height: 15, borderRadius: 3, background: ann.color, border: "1.5px solid rgba(0,0,0,0.25)" }} />
            </button>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Decrease font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (dispSize > 8) onUpdate(sizePatch(dispSize - 2)); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span style={{ color: "#555", fontSize: 12, minWidth: 22, textAlign: "center", fontWeight: 500 }}>{Math.round(dispSize)}</span>
            <button
              style={tbtnStyle} title="Increase font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (dispSize < 72) onUpdate(sizePatch(dispSize + 2)); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <button
              style={{
                ...tbtnStyle,
                fontWeight: 800,
                background: ann.bold ? "rgba(13,98,242,0.14)" : "none",
              }}
              title={ann.bold ? "Remove bold" : "Bold"}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ bold: !ann.bold }); }}
            >B</button>
            <button
              style={{
                ...tbtnStyle,
                fontStyle: "italic",
                fontWeight: 600,
                fontFamily: "Georgia, 'Times New Roman', serif",
                background: ann.italic ? "rgba(13,98,242,0.14)" : "none",
              }}
              title={ann.italic ? "Remove italic" : "Italic"}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ italic: !ann.italic }); }}
            >I</button>
            <button
              style={{
                ...tbtnStyle,
                textDecoration: "underline",
                fontWeight: 700,
                background: ann.underline ? "rgba(13,98,242,0.14)" : "none",
              }}
              title={ann.underline ? "Remove underline" : "Underline"}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ underline: !ann.underline }); }}
            >U</button>
            <button
              style={{
                ...tbtnStyle,
                textDecoration: "line-through",
                fontWeight: 700,
                background: ann.strikethrough ? "rgba(13,98,242,0.14)" : "none",
              }}
              title={ann.strikethrough ? "Remove strikethrough" : "Strikethrough"}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ strikethrough: !ann.strikethrough }); }}
            >S</button>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Decrease letter spacing"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ letterSpacing: Math.max(-2, ls - 0.5) }); }}
            >
              <svg width="17" height="15" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="10" y1="10" x2="18" y2="10"/>
                <polyline points="13,7 10,10 13,13"/>
                <polyline points="15,7 18,10 15,13"/>
              </svg>
            </button>
            <button
              style={tbtnStyle} title="Increase letter spacing"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ letterSpacing: Math.min(10, ls + 0.5) }); }}
            >
              <svg width="17" height="15" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="10" x2="20" y2="10"/>
                <polyline points="11,7 8,10 11,13"/>
                <polyline points="17,7 20,10 17,13"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 18, background: "#dcdcdc", margin: "0 2px" }} />

            <button
              style={{ ...tbtnStyle, color: "#d43c3c" }} title="Delete"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6 L19,20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <span
        ref={measureRef}
        style={{
          position: "absolute", visibility: "hidden", whiteSpace: "pre",
          fontSize: dispSize, fontFamily: fontFamilyCss(ann.fontFamily),
          fontWeight, fontStyle,
          letterSpacing: ls, padding: "0 5px",
        }}
        aria-hidden="true"
      />

      {editing ? (
        <textarea
          ref={inputRef}
          autoFocus
          defaultValue={ann.content}
          rows={1}
          style={{
            fontSize: dispSize,
            color: ann.color,
            fontFamily: fontFamilyCss(ann.fontFamily),
            fontWeight, fontStyle,
            letterSpacing: ls,
            textDecoration: textDeco,
            background: "rgba(255,255,255,0.97)",
            border: "2.5px dashed #4169E1",
            outline: "none",
            minHeight: lineH,
            width: inputWidth ?? initialW,
            maxWidth: maxW,
            padding: "2px 5px",
            lineHeight: `${lineH}px`,
            pointerEvents: "all",
            borderRadius: 3,
            boxSizing: "border-box",
            resize: "horizontal",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            display: "block",
          }}
          onChange={e => {
            if (measureRef.current) {
              const longestLine = e.target.value.split("\n").reduce((a, b) => a.length > b.length ? a : b, "");
              measureRef.current.textContent = longestLine || "";
              updateInputWidth();
            }
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); commitEdit(e.currentTarget.value); }
          }}
          onBlur={e => {
            if (wrapperBoxRef.current?.contains(e.relatedTarget as Node)) return;
            commitEdit(e.target.value);
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          onMouseDown={e => { setSelected(true); startDrag(e); }}
          style={{
            fontSize: dispSize,
            color: ann.color,
            fontFamily: fontFamilyCss(ann.fontFamily),
            fontWeight, fontStyle,
            letterSpacing: ls,
            textDecoration: textDeco,
            lineHeight: `${lineH}px`,
            minHeight: lineH,
            maxWidth: maxW,
            cursor: selected ? "move" : "default",
            pointerEvents: "all",
            borderRadius: 3,
            border: showControls ? "2.5px dashed #4169E1" : "2.5px dashed transparent",
            padding: "2px 5px",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          title="Double-click to edit"
        >
          {ann.content}
        </div>
      )}
    </div>
  );
}

function ActiveTextInput({ editingText, textSize, textColor, textFont, textUnderline, textStrike, pageWidth, onCommit, onCancel }: {
  editingText: { id: string; x: number; y: number };
  textSize: number;
  textColor: string;
  textFont: string;
  textUnderline?: boolean;
  textStrike?: boolean;
  pageWidth: number;
  onCommit: (id: string, content: string, x: number, y: number) => void;
  onCancel: () => void;
}) {
  const lineH = Math.round(textSize * 1.485);
  const maxW = Math.max(60, pageWidth - editingText.x - 4);
  const initialW = Math.min(maxW, Math.max(110, textSize * 7));
  const textDeco = [textUnderline && "underline", textStrike && "line-through"]
    .filter(Boolean).join(" ") || undefined;
  const [width, setWidth] = useState(initialW);
  const measureRef = useRef<HTMLSpanElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (measureRef.current) {
      const longestLine = e.target.value.split("\n").reduce((a, b) => a.length > b.length ? a : b, "");
      measureRef.current.textContent = longestLine || "";
      const textW = measureRef.current.offsetWidth + 16;
      setWidth(Math.min(maxW, Math.max(initialW, textW)));
    }
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }, [maxW, initialW]);

  return (
    <>
      <span
        ref={measureRef}
        style={{
          position: "absolute", visibility: "hidden", whiteSpace: "pre",
          fontSize: textSize, fontFamily: fontFamilyCss(textFont), padding: "0 4px",
        }}
        aria-hidden="true"
      />
      <textarea
        autoFocus
        rows={1}
        style={{
          position: "absolute",
          left: editingText.x, top: editingText.y,
          fontSize: textSize, color: textColor,
          fontFamily: fontFamilyCss(textFont),
          textDecoration: textDeco,
          background: "rgba(255,255,255,0.97)",
          border: "2.5px dashed #4169E1",
          outline: "none",
          width,
          maxWidth: maxW,
          minHeight: lineH,
          lineHeight: `${lineH}px`,
          padding: "0 4px",
          pointerEvents: "all", zIndex: 50,
          borderRadius: 2,
          boxSizing: "border-box",
          resize: "horizontal",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          display: "block",
        }}
        placeholder="Type here…"
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === "Escape") { e.stopPropagation(); onCommit(editingText.id, e.currentTarget.value, editingText.x, editingText.y); }
        }}
        onBlur={e => onCommit(editingText.id, e.target.value, editingText.x, editingText.y)}
      />
    </>
  );
}

function highlightTextInLayer(container: HTMLElement, term: string) {
  container.querySelectorAll("mark.search-hl").forEach(mark => {
    const parent = mark.parentNode!;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  });
  if (!term) return;

  const termLower = term.toLowerCase();
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) textNodes.push(n);

  for (let i = textNodes.length - 1; i >= 0; i--) {
    const node = textNodes[i];
    const text = node.textContent || "";
    const lower = text.toLowerCase();
    const positions: number[] = [];
    let idx = 0;
    while ((idx = lower.indexOf(termLower, idx)) !== -1) { positions.push(idx); idx += termLower.length; }
    for (let j = positions.length - 1; j >= 0; j--) {
      try {
        const range = document.createRange();
        range.setStart(node, positions[j]);
        range.setEnd(node, positions[j] + termLower.length);
        const mark = document.createElement("mark");
        mark.className = "search-hl";
        range.surroundContents(mark);
      } catch { /* skip cross-node ranges */ }
    }
  }
}

/**
 * Stroke a freehand point trail as a smooth curve instead of jagged
 * straight segments. Uses quadratic Béziers with each raw point as the
 * control point and the midpoints between samples as curve anchors —
 * the standard "midpoint smoothing" technique used by native ink
 * renderers, so strokes look fluid at 60 Hz mouse sampling.
 */
function strokeSmoothPath(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

function drawArrowhead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

/**
 * Trace a revision-cloud outline: the rectangle border rendered as a run of
 * connected outward-bulging semicircle arcs (scallops). Callers stroke the
 * resulting path themselves.
 */
function traceCloudPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = Math.max(6, Math.min(22, Math.min(Math.abs(w), Math.abs(h)) / 4));
  // Normalize to a top-left + positive-size rect.
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  ctx.beginPath();
  // Edges as (start, end, outward-normal angle). Walk clockwise.
  const edges: [number, number, number, number, number][] = [
    [x, y, x + w, y, -Math.PI / 2],           // top, bulge up
    [x + w, y, x + w, y + h, 0],              // right, bulge right
    [x + w, y + h, x, y + h, Math.PI / 2],    // bottom, bulge down
    [x, y + h, x, y, Math.PI],                // left, bulge left
  ];
  for (const [ax, ay, bx, by, out] of edges) {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / (2 * r)));
    const step = len / n;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    for (let i = 0; i < n; i++) {
      const cx = ax + ux * (i + 0.5) * step;
      const cy = ay + uy * (i + 0.5) * step;
      const arcR = step / 2;
      ctx.arc(cx, cy, arcR, out - Math.PI / 2, out + Math.PI / 2, false);
    }
  }
  ctx.closePath();
}

/** Stroke (and optionally fill) a closed polygon from its vertex list. */
function tracePolygonPath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

function drawShapeOnCtx(ctx: CanvasRenderingContext2D, annIn: ShapeAnnotation) {
  // Normalized shapes (norm: true) are stored page-relative; convert to
  // this canvas's pixel space so they track the page through zoom changes.
  const ann = shapeToCanvasSpace(annIn, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (ann.type) {
    case "freehand": {
      strokeSmoothPath(ctx, ann.points);
      break;
    }
    case "line": {
      ctx.beginPath();
      ctx.moveTo(ann.x1, ann.y1);
      ctx.lineTo(ann.x2, ann.y2);
      ctx.stroke();
      break;
    }
    case "arrow": {
      ctx.beginPath();
      ctx.moveTo(ann.x1, ann.y1);
      ctx.lineTo(ann.x2, ann.y2);
      ctx.stroke();
      drawArrowhead(ctx, ann.x1, ann.y1, ann.x2, ann.y2, 14 * ann.lineWidth / 2);
      break;
    }
    case "oval": {
      ctx.beginPath();
      ctx.ellipse(ann.cx, ann.cy, Math.abs(ann.rx), Math.abs(ann.ry), 0, 0, 2 * Math.PI);
      if (ann.fill) {
        ctx.save();
        // Vibrant marker fill: `multiply` blend lets the page text show
        // through razor-sharp underneath while the color glows on white.
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = ann.fillOpacity ?? 0.4;
        ctx.globalCompositeOperation = "multiply";
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
      break;
    }
    case "rect": {
      if (ann.fill) {
        ctx.save();
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = ann.fillOpacity ?? 0.4;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillRect(ann.x, ann.y, ann.w, ann.h);
        ctx.restore();
      }
      ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
      break;
    }
    case "polygon": {
      tracePolygonPath(ctx, ann.points);
      if (ann.fill) {
        ctx.save();
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = ann.fillOpacity ?? 0.4;
        ctx.globalCompositeOperation = "multiply";
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
      break;
    }
    case "cloud": {
      traceCloudPath(ctx, ann.x, ann.y, ann.w, ann.h);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

export default function PDFPage({
  pdfDocument, pageNum, zoom, rotation, searchTerm, tool, annotations,
  highlightColor, textColor, textSize, textFont, textUnderline, textStrike, drawThickness, drawColor,
  shapeFill, shapeFillOpacity,
  onAnnotationAdd, onPolygonDone, onAnnotationUpdate, onAnnotationRemove,
  onVisible, onSearchTermChange,
  watermark, pageNo, totalPages, currentPage,
  formFillMode,
  defaultPageSize,
  commentRequest,
  markupRequest,
}: PDFPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const formLayerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  /** Inline Adobe-style "Edit Text" editor state. Coords are in CSS pixels
   *  relative to the page wrapper. fontSizePdf is post-zoom-normalized so
   *  it can be persisted unchanged into the EditTextAnnotation. */
  const [editingPdfText, setEditingPdfText] = useState<{
    id?: string;
    x: number; y: number; w: number; h: number;
    fontSizeCss: number;
    fontSizePdf: number;
    text: string;
    originalText: string;
    rotation: number;
  } | null>(null);
  const highlightRef = useRef<{ active: boolean; startX: number; startY: number } | null>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerTaskRef = useRef<any>(null);
  /** Captured during the last successful page render so the redact tool can
   *  store the total displayed rotation (page.rotate + viewer rotation). */
  const pageNativeRotationRef = useRef<number>(0);

  const shapeDrawRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    points: Point[];
    shiftKey: boolean;
  } | null>(null);

  /**
   * Edge-style eraser: touching any part of an annotation deletes the
   * whole thing. We track which IDs we've already removed during the
   * current drag so we don't try to remove the same one twice.
   */
  const eraserActiveRef = useRef(false);
  const erasedThisDragRef = useRef<Set<string>>(new Set());

  const [copiedToast, setCopiedToast] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    selectedText: string;
    rects: { x: number; y: number; width: number; height: number }[];
  } | null>(null);
  const [hlSubmenuOpen, setHlSubmenuOpen] = useState(false);
  const [commentInput, setCommentInput] = useState<{ open: boolean; text: string }>({ open: false, text: "" });

  // Floating quick-highlight toolbar shown over a live text selection
  // ("new" mode) or over an existing highlight that was clicked ("edit"
  // mode). Coords are in page-CSS pixels (same space as `contextMenu`).
  const [quickBar, setQuickBar] = useState<{
    x: number; y: number;
    mode: "new" | "edit";
    annId?: string;
    rects: Rect[];
    text: string;
  } | null>(null);
  const quickBarRef = useRef<HTMLDivElement | null>(null);

  // Re-clamp the quick bar horizontally using its real rendered width —
  // barPosForRects estimates with a fixed BAR_W, but the bar's actual
  // width varies by mode (extra divider + button in "new"/"edit").
  useLayoutEffect(() => {
    if (!quickBar) return;
    const el = quickBarRef.current;
    if (!el || pageSize.w === 0) return;
    const w = el.offsetWidth;
    const clampedX = Math.max(4, Math.min(quickBar.x, pageSize.w - w - 4));
    if (Math.abs(clampedX - quickBar.x) > 0.5) {
      setQuickBar((qb) => (qb ? { ...qb, x: clampedX } : qb));
    }
  }, [quickBar, pageSize.w]);

  // Right-click popup highlight swatches come from the central palette in
  // src/lib/annotationColors.ts. The hex `value` is stored on the
  // annotation and the renderer applies `opacity` via canvas globalAlpha.
  const SELECTION_HL_COLORS = HIGHLIGHT_PALETTE.map((c) => ({
    value: c.value,
    circle: c.value,
    opacity: c.opacity,
    label: c.name,
  }));

  const getSelectionRects = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    return readSelectionRects(wrapper);
  }, [pageSize]);

  useEffect(() => {
    const layer = textLayerRef.current;
    const wrapper = wrapperRef.current;
    if (!layer || !wrapper) return;

    const onContextMenu = (e: MouseEvent) => {
      const result = getSelectionRects();
      if (!result) return;
      e.preventDefault();
      e.stopPropagation();
      const wrapperRect = wrapper.getBoundingClientRect();
      const popScaleX = pageSize.w / wrapperRect.width;
      const popScaleY = pageSize.h / wrapperRect.height;
      const menuX = (e.clientX - wrapperRect.left) * popScaleX;
      const menuY = (e.clientY - wrapperRect.top) * popScaleY;
      setContextMenu({
        x: Math.min(menuX, pageSize.w - 180),
        y: Math.min(menuY, pageSize.h - 200),
        selectedText: result.text,
        rects: result.rects,
      });
      setHlSubmenuOpen(false);
      setCommentInput({ open: false, text: "" });
    };

    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-ctx-menu]")) return;
      setContextMenu(null);
      setHlSubmenuOpen(false);
      setCommentInput({ open: false, text: "" });
    };

    layer.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      layer.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [tool, pageSize, getSelectionRects]);

  /* Ribbon "Comment" button: open the sticky-note comment popup on the
   * current text selection. Only the page that owns the selection gets a
   * non-null result from getSelectionRects, so exactly one page responds. */
  const lastCommentReq = useRef(commentRequest ?? 0);
  useEffect(() => {
    const req = commentRequest ?? 0;
    if (req === lastCommentReq.current) return;
    lastCommentReq.current = req;
    const wrapper = wrapperRef.current;
    const sel = window.getSelection();
    if (!wrapper || !sel || sel.rangeCount === 0) return;
    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    if (!wrapper.contains(anchor)) return;
    const result = getSelectionRects();
    if (!result || !result.rects.length) return;
    const first = result.rects[0];
    setContextMenu({
      x: Math.min(first.x * pageSize.w, Math.max(0, pageSize.w - 180)),
      y: Math.min((first.y + first.height) * pageSize.h + 6, Math.max(0, pageSize.h - 200)),
      selectedText: result.text,
      rects: result.rects,
    });
    setHlSubmenuOpen(false);
    setCommentInput({ open: true, text: "" });
  }, [commentRequest, getSelectionRects, pageSize]);

  /* Menu bar "Underline / Strikeout Text": apply the markup directly to the
   * current text selection. Same ownership rule as commentRequest — only the
   * page whose text layer contains the selection responds. */
  const lastMarkupReq = useRef(markupRequest?.n ?? 0);
  useEffect(() => {
    const req = markupRequest?.n ?? 0;
    if (req === lastMarkupReq.current) return;
    lastMarkupReq.current = req;
    if (!markupRequest) return;
    const wrapper = wrapperRef.current;
    const sel = window.getSelection();
    if (!wrapper || !sel || sel.rangeCount === 0) return;
    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    if (!wrapper.contains(anchor)) return;
    const result = getSelectionRects();
    if (!result || !result.rects.length) return;
    const markupColor =
      markupRequest.kind === "underline" ? COLOR_DEFAULTS.underlineColor
        : markupRequest.kind === "strike" ? COLOR_DEFAULTS.strikeColor
        : COLOR_DEFAULTS.squigglyColor;
    const ann: Annotation = {
      id: genId(), type: markupRequest.kind, page: pageNum,
      rects: result.rects,
      color: markupColor,
      selectedText: result.text,
      createdAt: new Date().toISOString(),
    };
    onAnnotationAdd(ann);
    window.getSelection()?.removeAllRanges();
  }, [markupRequest, getSelectionRects, pageNum, onAnnotationAdd]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) onVisible(pageNum); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageNum, onVisible]);

  // ── Render virtualization ─────────────────────────────────────
  // Only pages near the viewport get a live canvas + text layer. This is
  // what lets arbitrarily large PDFs open instantly: instead of painting
  // every page up front, we paint the first couple immediately and the
  // rest on demand as the user scrolls near them. Pages that scroll far
  // away release their canvas bitmaps (dimensions kept, so layout and
  // scroll position never jump).
  const [nearView, setNearView] = useState(pageNum <= 2);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => setNearView(entries[0].isIntersecting),
      { rootMargin: `${RENDER_MARGIN} 0px` }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDocument || !pageCanvasRef.current) return;

    if (!nearView) {
      // Scrolled far away — cancel any in-flight work and free the
      // canvas bitmaps. CSS sizes stay in place so the page keeps its
      // footprint in the scroll layout.
      if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
      if (textLayerTaskRef.current) { textLayerTaskRef.current.cancel?.(); textLayerTaskRef.current = null; }
      const canvas = pageCanvasRef.current;
      if (canvas && canvas.width > 0) { canvas.width = 0; canvas.height = 0; }
      if (highlightCanvasRef.current && highlightCanvasRef.current.width > 0) {
        highlightCanvasRef.current.width = 0;
        highlightCanvasRef.current.height = 0;
      }
      if (drawCanvasRef.current && drawCanvasRef.current.width > 0) {
        drawCanvasRef.current.width = 0;
        drawCanvasRef.current.height = 0;
      }
      if (textLayerRef.current) textLayerRef.current.innerHTML = "";
      if (formLayerRef.current) formLayerRef.current.replaceChildren();
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        const page = await pdfDocument.getPage(pageNum);
        const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
        const totalRotation = ((page.rotate ?? 0) + rotation) % 360;
        pageNativeRotationRef.current = page.rotate ?? 0;
        // CSS size always tracks the zoom exactly; the physical canvas
        // scale is capped so a huge page × high zoom × retina DPR can't
        // allocate a tab-freezing multi-hundred-MB canvas.
        const baseVp = page.getViewport({ scale: 1, rotation: totalRotation });
        let renderScale = Math.max(zoom * dpr, MIN_RENDER_SCALE);
        if (baseVp.width * baseVp.height * renderScale * renderScale > MAX_CANVAS_PIXELS) {
          renderScale = Math.sqrt(MAX_CANVAS_PIXELS / (baseVp.width * baseVp.height));
        }
        const viewport = page.getViewport({ scale: renderScale, rotation: totalRotation });
        const cssW = baseVp.width * zoom;
        const cssH = baseVp.height * zoom;

        const canvas = pageCanvasRef.current!;
        if (cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        if (highlightCanvasRef.current) {
          highlightCanvasRef.current.width = viewport.width;
          highlightCanvasRef.current.height = viewport.height;
          highlightCanvasRef.current.style.width = `${cssW}px`;
          highlightCanvasRef.current.style.height = `${cssH}px`;
        }

        if (drawCanvasRef.current) {
          drawCanvasRef.current.width = viewport.width;
          drawCanvasRef.current.height = viewport.height;
          drawCanvasRef.current.style.width = `${cssW}px`;
          drawCanvasRef.current.style.height = `${cssH}px`;
        }

        setPageSize({ w: cssW, h: cssH });

        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // annotationMode 2 = ENABLE_FORMS: paint non-widget annotations on the
        // canvas but leave AcroForm fields for the interactive HTML annotation
        // layer so live widgets aren't double-drawn behind the inputs.
        const task = page.render({ canvasContext: ctx, viewport, annotationMode: 2 });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
        if (!cancelled) redrawAnnotations();

        if (textLayerRef.current && !cancelled) {
          if (textLayerTaskRef.current) {
            textLayerTaskRef.current.cancel?.();
            textLayerTaskRef.current = null;
          }
          textLayerRef.current.innerHTML = "";
          const textViewport = page.getViewport({ scale: zoom, rotation: totalRotation });
          const textContent = await page.getTextContent();
          const tl = new TextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport: textViewport,
          });
          textLayerTaskRef.current = tl;
          await tl.render();
          textLayerTaskRef.current = null;
          // pdf.js's TextLayerBuilder normally appends this sentinel div.
          // During a drag-selection it expands to cover the whole layer
          // (via the `.selecting` class, see pdf_viewer.css) so that the
          // browser anchors the selection to it instead of jumping to a
          // far-away span when the cursor passes over empty space between
          // lines. Without it, selecting 2 lines often grabs many lines.
          if (!cancelled && textLayerRef.current) {
            const eoc = document.createElement("div");
            eoc.className = "endOfContent";
            textLayerRef.current.append(eoc);
          }
        }

        // Interactive AcroForm widgets. We render the pdf.js AnnotationLayer
        // with renderForms:true bound to the shared annotationStorage so the
        // user's typed/checked values persist across zoom, page virtualization
        // and are later serialized by pdfDocument.saveDocument(). The layer is
        // always built (so values survive re-renders) but only accepts pointer
        // input when formFillMode is on — see the JSX wrapper below.
        if (formLayerRef.current && !cancelled) {
          const layerDiv = formLayerRef.current;
          try {
            const allAnnots = await page.getAnnotations({ intent: "display" });
            if (cancelled) return;
            // Only ever render interactive AcroForm widgets — never link, popup
            // or other annotation subtypes. This keeps the feature scoped to form
            // input and removes any PDF-controlled link-navigation surface.
            const annots = allAnnots.filter((a: any) => a.subtype === "Widget");
            const hasWidgets = annots.length > 0;
            layerDiv.replaceChildren();
            if (hasWidgets) {
              const annVp = page
                .getViewport({ scale: zoom, rotation: totalRotation })
                .clone({ dontFlip: true });
              layerDiv.style.setProperty("--scale-factor", String(zoom));
              layerDiv.style.setProperty("--total-scale-factor", String(zoom));
              const annotationLayer = new AnnotationLayer({
                div: layerDiv,
                page,
                viewport: annVp,
                annotationStorage: pdfDocument.annotationStorage,
                linkService: FORM_LINK_SERVICE,
              } as any);
              await annotationLayer.render({
                annotations: annots,
                page,
                viewport: annVp,
                annotationStorage: pdfDocument.annotationStorage,
                linkService: FORM_LINK_SERVICE,
                renderForms: true,
                imageResourcesPath: "",
                downloadManager: null,
                enableScripting: false,
                hasJSActions: false,
                fieldObjects: null,
              } as any);
            }
          } catch (formErr: any) {
            if (formErr?.name !== "RenderingCancelledException") console.error(formErr);
          }
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();

    return () => {
      cancelled = true;
      textLayerTaskRef.current?.cancel?.();
    };
  }, [pdfDocument, pageNum, zoom, rotation, nearView]);

  useEffect(() => { redrawAnnotations(); }, [annotations, pageSize]);

  // Toggle the `.selecting` class on ALL text layers while the user is
  // drag-selecting. pdf_viewer.css then stretches each layer's
  // .endOfContent sentinel to full size, which keeps the native selection
  // anchored under the cursor (and lets selections cross page boundaries)
  // instead of ballooning to unrelated lines.
  useEffect(() => {
    const layer = textLayerRef.current;
    if (!layer) return;
    const setSelecting = (on: boolean) => {
      document.querySelectorAll(".textLayer").forEach(l =>
        l.classList.toggle("selecting", on),
      );
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      setSelecting(true);
    };
    const onEnd = () => setSelecting(false);
    layer.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    window.addEventListener("blur", onEnd);
    return () => {
      layer.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      window.removeEventListener("blur", onEnd);
    };
  }, []);

  useEffect(() => {
    if (textLayerRef.current) highlightTextInLayer(textLayerRef.current, searchTerm);
  }, [searchTerm, pageSize]);

  // ── Custom blue selection overlay (Adobe / Edge style) ──────
  // The pdfjs text layer has one span per word, so the browser's native
  // selection paints with white gaps between words. We hide the native
  // background (in CSS) and paint our own continuous, line-merged blue
  // strip here. Recomputed on every selectionchange via rAF coalescing.
  const [selRects, setSelRects] = useState<Rect[]>([]);
  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      raf = 0;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelRects((prev) => (prev.length === 0 ? prev : []));
        return;
      }
      const range = sel.getRangeAt(0);
      let touchesPage = false;
      try { touchesPage = range.intersectsNode(wrapper); } catch { touchesPage = wrapper.contains(range.commonAncestorContainer); }
      if (!touchesPage) {
        setSelRects((prev) => (prev.length === 0 ? prev : []));
        return;
      }
      const result = readSelectionRects(wrapper);
      const rects = (result?.rects ?? []).filter(
        (r) => r.x + r.width > 0 && r.y + r.height > 0 && r.x < 1 && r.y < 1,
      );
      setSelRects(rects);
    };
    const onChange = () => {
      if (raf) return;
      raf = requestAnimationFrame(recompute);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pageSize]);

  function renderHighlights(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    list: Annotation[],
  ) {
    for (const ann of list) {
      if (ann.type !== "highlight") continue;
      if (ann.rects.length === 0) continue;
      ctx.save();
      // Highlights live on their own canvas whose CSS `mix-blend-mode` is
      // `multiply` on bright pages (and `screen` in night mode). That blend
      // is what keeps the letters underneath fully intact: multiplying the
      // colour onto white tints the background to the exact swatch hue while
      // black text (0 × colour = 0) stays black. So we paint the solid hex
      // at full opacity here and let the blend mode do the see-through work,
      // rather than a translucent source-over fill that muddies the text.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = ann.color;
      ctx.globalAlpha = 1;
      for (const r of ann.rects) {
        ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.width * canvas.width, r.height * canvas.height);
      }
      ctx.restore();
    }
  }

  function redrawAnnotations() {
    const canvas = drawCanvasRef.current;
    if (!canvas || pageSize.w === 0) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Highlights render on their own blend-mode canvas so the text under
    // them stays intact; every other annotation type stays on drawCanvas.
    const hlCanvas = highlightCanvasRef.current;
    if (hlCanvas) {
      const hlCtx = hlCanvas.getContext("2d")!;
      hlCtx.clearRect(0, 0, hlCanvas.width, hlCanvas.height);
      renderHighlights(hlCtx, hlCanvas, annotations);
    }
    for (const ann of annotations) {
      if (ann.type === "highlight") {
        // drawn on the dedicated highlight canvas above
      } else if (ann.type === "underline") {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(0.75, canvas.height * 0.0011);
        ctx.lineCap = "round";
        for (const r of ann.rects) {
          const y = (r.y + r.height) * canvas.height - ctx.lineWidth * 0.5;
          ctx.beginPath();
          ctx.moveTo(r.x * canvas.width, y);
          ctx.lineTo((r.x + r.width) * canvas.width, y);
          ctx.stroke();
        }
        ctx.restore();
      } else if (ann.type === "squiggly") {
        // Wavy underline: a small sine wave along the bottom edge of each
        // selected-text rect. Amplitude/wavelength scale with page height
        // so the wave stays readable at every zoom level.
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(0.75, canvas.height * 0.0011);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const amp = Math.max(1.2, canvas.height * 0.0018);
        const wave = amp * 4;
        for (const r of ann.rects) {
          const x0 = r.x * canvas.width;
          const x1 = (r.x + r.width) * canvas.width;
          const y = (r.y + r.height) * canvas.height - amp - ctx.lineWidth * 0.5;
          ctx.beginPath();
          ctx.moveTo(x0, y);
          for (let x = x0; x < x1; x += 1) {
            ctx.lineTo(x, y + Math.sin(((x - x0) / wave) * 2 * Math.PI) * amp);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (ann.type === "strike") {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(0.75, canvas.height * 0.0011);
        ctx.lineCap = "round";
        for (const r of ann.rects) {
          const y = (r.y + r.height * 0.55) * canvas.height;
          ctx.beginPath();
          ctx.moveTo(r.x * canvas.width, y);
          ctx.lineTo((r.x + r.width) * canvas.width, y);
          ctx.stroke();
        }
        ctx.restore();
      } else if (ann.type === "comment") {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#4169E1";
        for (const r of ann.rects) ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.width * canvas.width, r.height * canvas.height);
        ctx.restore();
      } else if (ann.type === "redact") {
        ctx.save();
        ctx.fillStyle = ann.fill === "white" ? "#FFFFFF" : "#000000";
        ctx.globalAlpha = 1;
        const rx = ann.x * canvas.width, ry = ann.y * canvas.height;
        const rw = ann.w * canvas.width, rh = ann.h * canvas.height;
        ctx.fillRect(rx, ry, rw, rh);
        if (ann.fill === "white") {
          // Subtle dashed outline so the whiteout patch stays findable
          // on screen (the outline is display-only, never exported).
          ctx.strokeStyle = "rgba(0,0,0,0.18)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.strokeRect(rx, ry, rw, rh);
        }
        ctx.restore();
      } else if (ann.type !== "text") {
        drawShapeOnCtx(ctx, ann as ShapeAnnotation);
      }
    }
  }

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onHighlightMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);
    highlightRef.current = { active: true, startX: pos.x, startY: pos.y };
  }, []);

  const onHighlightMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!highlightRef.current?.active) return;
    const pos = getCanvasPos(e);
    // Preview draws on the highlight canvas so it gets the same blend-mode
    // treatment (text stays intact) as the committed highlight.
    const canvas = highlightCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    redrawAnnotations();
    const { startX, startY } = highlightRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = highlightColor;
    ctx.fillRect(startX, startY, pos.x - startX, pos.y - startY);
    ctx.restore();
  }, [highlightColor, annotations, pageSize]);

  const onHighlightMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!highlightRef.current?.active) return;
    const pos = getCanvasPos(e);
    const { startX, startY } = highlightRef.current;
    highlightRef.current = null;
    const w = pos.x - startX, h = pos.y - startY;
    if (Math.abs(w) > 4 && Math.abs(h) > 4) {
      const canvas = drawCanvasRef.current!;
      const ann: HighlightAnnotation = {
        id: genId(), type: "highlight", page: pageNum,
        rects: [{
          x: Math.min(startX, pos.x) / canvas.width,
          y: Math.min(startY, pos.y) / canvas.height,
          width: Math.abs(w) / canvas.width,
          height: Math.abs(h) / canvas.height,
        }],
        color: highlightColor,
        opacity: highlightOpacityFor(highlightColor),
        selectedText: "",
        createdAt: new Date().toISOString(),
      };
      onAnnotationAdd(ann);
    } else {
      redrawAnnotations();
    }
  }, [pageNum, highlightColor, onAnnotationAdd]);

  // ── Edge-style eraser ────────────────────────────────────
  // On pointer down/move while eraser active, hit-test every annotation
  // on the current page and call onAnnotationRemove for each one we
  // touch. Each annotation is removed AT MOST ONCE per drag.

  const getCssPosFromEvent = (e: { clientX: number; clientY: number }) => {
    const wrapper = wrapperRef.current!;
    const rect = wrapper.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const buildHitContext = useCallback((cssX: number, cssY: number): HitContext | null => {
    const canvas = drawCanvasRef.current;
    if (!canvas || pageSize.w === 0) return null;
    const canvasScaleX = canvas.width / pageSize.w;
    const canvasScaleY = canvas.height / pageSize.h;
    return {
      cssX, cssY,
      canvasX: cssX * canvasScaleX,
      canvasY: cssY * canvasScaleY,
      normX: cssX / pageSize.w,
      normY: cssY / pageSize.h,
      radiusCss: ERASER_RADIUS_CSS,
      radiusCanvas: ERASER_RADIUS_CSS * canvasScaleX,
      radiusNormX: ERASER_RADIUS_CSS / pageSize.w,
      radiusNormY: ERASER_RADIUS_CSS / pageSize.h,
      canvasW: canvas.width,
      canvasH: canvas.height,
    };
  }, [pageSize]);

  // ── Floating quick-highlight toolbar ─────────────────────────
  // Return the top-most highlight on this page hit at the given CSS point.
  const hitTestHighlightAt = useCallback(
    (cssX: number, cssY: number): HighlightAnnotation | null => {
      const ctx = buildHitContext(cssX, cssY);
      if (!ctx) return null;
      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (ann.type !== "highlight" || ann.page !== pageNum) continue;
        if (hitTestAnnotation(ann, ctx)) return ann as HighlightAnnotation;
      }
      return null;
    },
    [annotations, pageNum, buildHitContext],
  );

  // Position the toolbar centered above a set of normalized rects (falls
  // back to just below them when there isn't room above). Output is in
  // page-CSS pixels, clamped within the page bounds.
  const barPosForRects = useCallback(
    (rects: Rect[]) => {
      const BAR_W = 176;
      const BAR_H = 40;
      const GAP = 8;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const r of rects) {
        minX = Math.min(minX, r.x);
        maxX = Math.max(maxX, r.x + r.width);
        minY = Math.min(minY, r.y);
        maxY = Math.max(maxY, r.y + r.height);
      }
      const centerX = ((minX + maxX) / 2) * pageSize.w;
      let x = centerX - BAR_W / 2;
      x = Math.max(4, Math.min(x, pageSize.w - BAR_W - 4));
      let y = minY * pageSize.h - BAR_H - GAP;
      if (y < 4) y = maxY * pageSize.h + GAP;
      y = Math.max(4, Math.min(y, pageSize.h - BAR_H - 4));
      return { x, y };
    },
    [pageSize],
  );

  const onWrapperPointerUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      // Only when text is selectable (hand / highlight, not draw tools).
      if (isShapeTool(tool) || tool === "eraser" || tool === "edittext") return;
      const wrapper = wrapperRef.current;
      if (!wrapper || pageSize.w === 0) return;

      // 1) Non-empty selection intersecting this page → "new" bar.
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (sel && !sel.isCollapsed && text) {
        let touches = false;
        try {
          touches = sel.rangeCount > 0 && sel.getRangeAt(0).intersectsNode(wrapper);
        } catch {
          touches = false;
        }
        if (touches) {
          const result = getSelectionRects();
          if (result && result.rects.length > 0) {
            setQuickBar({ ...barPosForRects(result.rects), mode: "new", rects: result.rects, text: result.text });
            return;
          }
        }
      }

      // 2) Collapsed click on an existing highlight → "edit" bar.
      const clientX = "changedTouches" in e ? e.changedTouches[0]?.clientX : e.clientX;
      const clientY = "changedTouches" in e ? e.changedTouches[0]?.clientY : e.clientY;
      if (clientX == null || clientY == null) {
        setQuickBar(null);
        return;
      }
      const rect = wrapper.getBoundingClientRect();
      const hit = hitTestHighlightAt(clientX - rect.left, clientY - rect.top);
      if (hit) {
        setQuickBar({ ...barPosForRects(hit.rects), mode: "edit", annId: hit.id, rects: hit.rects, text: hit.selectedText ?? "" });
      } else {
        setQuickBar(null);
      }
    },
    [tool, pageSize, getSelectionRects, hitTestHighlightAt, barPosForRects],
  );

  // Dismiss the quick bar on outside mousedown, scroll, tool change, or
  // when a "new"-mode selection is cleared.
  useEffect(() => {
    if (!quickBar) return;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-quick-bar]")) return;
      setQuickBar(null);
    };
    const onScroll = () => setQuickBar(null);
    const onSelChange = () => {
      const sel = window.getSelection();
      if (quickBar.mode === "new" && (!sel || sel.isCollapsed)) setQuickBar(null);
    };
    document.addEventListener("mousedown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("selectionchange", onSelChange);
    };
  }, [quickBar]);

  useEffect(() => { setQuickBar(null); }, [tool, pageNum, zoom, rotation]);

  const eraseAt = useCallback((cssX: number, cssY: number) => {
    const ctx = buildHitContext(cssX, cssY);
    if (!ctx) return;
    for (const ann of annotations) {
      if (ann.page !== pageNum) continue;
      if (erasedThisDragRef.current.has(ann.id)) continue;
      if (hitTestAnnotation(ann, ctx)) {
        erasedThisDragRef.current.add(ann.id);
        onAnnotationRemove(ann.id);
      }
    }
  }, [annotations, pageNum, buildHitContext, onAnnotationRemove]);

  const onEraserPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    eraserActiveRef.current = true;
    erasedThisDragRef.current = new Set();
    const p = getCssPosFromEvent(e);
    eraseAt(p.x, p.y);
  }, [eraseAt]);

  const onEraserPointerMove = useCallback((e: React.PointerEvent) => {
    if (!eraserActiveRef.current) return;
    const p = getCssPosFromEvent(e);
    eraseAt(p.x, p.y);
  }, [eraseAt]);

  const onEraserPointerUp = useCallback(() => {
    eraserActiveRef.current = false;
    erasedThisDragRef.current = new Set();
  }, []);

  // ── Polygon tool: click to add vertices, double-click closes ──────
  // Vertices accumulate in canvas-pixel space in polygonRef; the preview
  // repaints on every move. Escape cancels an in-progress polygon.
  const polygonRef = useRef<Point[] | null>(null);

  const drawPolygonPreview = useCallback((cursor?: Point) => {
    const canvas = drawCanvasRef.current;
    const pts = polygonRef.current;
    if (!canvas || !pts || pts.length === 0) return;
    const ctx = canvas.getContext("2d")!;
    redrawAnnotations();
    ctx.save();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawThickness * (canvas.width / pageSize.w);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (cursor) ctx.lineTo(cursor.x, cursor.y);
    ctx.stroke();
    // Vertex dots so the user can see committed corners.
    ctx.fillStyle = drawColor;
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(3, ctx.lineWidth * 1.2), 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }, [drawColor, drawThickness, pageSize, annotations]);

  const commitPolygon = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const pts = polygonRef.current;
    polygonRef.current = null;
    if (!canvas || !pts) return;
    // Drop near-duplicate consecutive vertices (double-click adds a repeat).
    const clean: Point[] = [];
    for (const p of pts) {
      const last = clean[clean.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 4) clean.push(p);
    }
    if (clean.length < 3) { redrawAnnotations(); return; }
    const cw = canvas.width, ch = canvas.height;
    const nLw = (drawThickness * (cw / pageSize.w)) / cw;
    onAnnotationAdd({
      id: genId(), type: "polygon", page: pageNum,
      points: clean.map(p => ({ x: p.x / cw, y: p.y / ch })),
      color: drawColor, lineWidth: nLw,
      fill: shapeFill, fillOpacity: shapeFillOpacity ?? 0.4,
      norm: true,
    });
  }, [drawColor, drawThickness, pageSize, pageNum, shapeFill, shapeFillOpacity, onAnnotationAdd]);

  // Cancel an in-progress polygon on Escape or when the tool changes.
  useEffect(() => {
    if (tool !== "polygon" && polygonRef.current) {
      polygonRef.current = null;
      redrawAnnotations();
    }
    if (tool !== "polygon") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && polygonRef.current) {
        polygonRef.current = null;
        redrawAnnotations();
      } else if (e.key === "Enter" && polygonRef.current) {
        commitPolygon();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, commitPolygon]);

  const onShapeDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "polygon") return;
    e.preventDefault();
    commitPolygon();
    // Double-click both closes the polygon and stops the tool.
    onPolygonDone?.();
  }, [tool, commitPolygon, onPolygonDone]);

  const onShapeMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);
    if (tool === "polygon") {
      const pts = polygonRef.current ?? [];
      pts.push({ x: pos.x, y: pos.y });
      polygonRef.current = pts;
      drawPolygonPreview();
      return;
    }
    shapeDrawRef.current = {
      active: true,
      startX: pos.x,
      startY: pos.y,
      points: [{ x: pos.x, y: pos.y }],
      shiftKey: e.shiftKey,
    };
  }, [tool, drawPolygonPreview]);

  const onShapeMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "polygon") {
      if (polygonRef.current?.length) drawPolygonPreview(getCanvasPos(e));
      return;
    }
    const state = shapeDrawRef.current;
    if (!state?.active) return;
    const pos = getCanvasPos(e);
    state.shiftKey = e.shiftKey;

    if (tool === "freehand") {
      state.points.push({ x: pos.x, y: pos.y });
    }

    const canvas = drawCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    redrawAnnotations();

    ctx.save();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawThickness * (canvas.width / pageSize.w);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { startX, startY, shiftKey, points } = state;

    switch (tool) {
      case "freehand": {
        strokeSmoothPath(ctx, points);
        break;
      }
      case "line": {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        break;
      }
      case "arrow": {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        drawArrowhead(ctx, startX, startY, pos.x, pos.y, 14 * ctx.lineWidth / 2);
        break;
      }
      case "oval": {
        let rx = Math.abs(pos.x - startX) / 2;
        let ry = Math.abs(pos.y - startY) / 2;
        if (shiftKey) { const r = Math.max(rx, ry); rx = r; ry = r; }
        const cx = (startX + pos.x) / 2;
        const cy = (startY + pos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (shapeFill) {
          ctx.save();
          ctx.fillStyle = drawColor;
          ctx.globalAlpha = shapeFillOpacity ?? 0.4;
          ctx.globalCompositeOperation = "multiply";
          ctx.fill();
          ctx.restore();
        }
        ctx.stroke();
        break;
      }
      case "rectangle": {
        let w = pos.x - startX;
        let h = pos.y - startY;
        if (shiftKey) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * side;
          h = Math.sign(h) * side;
        }
        if (shapeFill) {
          ctx.save();
          ctx.fillStyle = drawColor;
          ctx.globalAlpha = shapeFillOpacity ?? 0.4;
          ctx.globalCompositeOperation = "multiply";
          ctx.fillRect(startX, startY, w, h);
          ctx.restore();
        }
        ctx.strokeRect(startX, startY, w, h);
        break;
      }
      case "redact": {
        const w = pos.x - startX;
        const h = pos.y - startY;
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 1;
        ctx.fillRect(startX, startY, w, h);
        ctx.restore();
        break;
      }
      case "whiteout": {
        const w = pos.x - startX;
        const h = pos.y - startY;
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = 1;
        ctx.fillRect(startX, startY, w, h);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(startX, startY, w, h);
        ctx.restore();
        break;
      }
      case "cloud": {
        traceCloudPath(ctx, startX, startY, pos.x - startX, pos.y - startY);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }, [tool, drawColor, annotations, pageSize, shapeFill, shapeFillOpacity, drawPolygonPreview]);

  const onShapeMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = shapeDrawRef.current;
    if (!state?.active) return;
    const pos = getCanvasPos(e);
    state.shiftKey = e.shiftKey;
    shapeDrawRef.current = null;

    const canvas = drawCanvasRef.current!;
    const lw = drawThickness * (canvas.width / pageSize.w);
    const { startX, startY, shiftKey, points } = state;

    // New shapes are stored NORMALIZED (0..1 of the rendered page, with
    // lineWidth as a fraction of page width) so they scale and reposition
    // correctly when the user zooms. `norm: true` marks the new format.
    const cw = canvas.width, ch = canvas.height;
    const nLw = lw / cw;

    let ann: ShapeAnnotation | RedactionAnnotation | null = null;

    switch (tool) {
      case "freehand": {
        points.push({ x: pos.x, y: pos.y });
        if (points.length >= 2) {
          ann = { id: genId(), type: "freehand", page: pageNum, points: points.map(p => ({ x: p.x / cw, y: p.y / ch })), color: drawColor, lineWidth: nLw, norm: true };
        }
        break;
      }
      case "line": {
        const dx = pos.x - startX, dy = pos.y - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          ann = { id: genId(), type: "line", page: pageNum, x1: startX / cw, y1: startY / ch, x2: pos.x / cw, y2: pos.y / ch, color: drawColor, lineWidth: nLw, norm: true };
        }
        break;
      }
      case "arrow": {
        const dx = pos.x - startX, dy = pos.y - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          ann = { id: genId(), type: "arrow", page: pageNum, x1: startX / cw, y1: startY / ch, x2: pos.x / cw, y2: pos.y / ch, color: drawColor, lineWidth: nLw, norm: true };
        }
        break;
      }
      case "oval": {
        let rx = Math.abs(pos.x - startX) / 2;
        let ry = Math.abs(pos.y - startY) / 2;
        if (shiftKey) { const r = Math.max(rx, ry); rx = r; ry = r; }
        if (rx > 3 && ry > 3) {
          const cx = (startX + pos.x) / 2;
          const cy = (startY + pos.y) / 2;
          ann = { id: genId(), type: "oval", page: pageNum, cx: cx / cw, cy: cy / ch, rx: rx / cw, ry: ry / ch, color: drawColor, lineWidth: nLw, fill: shapeFill, fillOpacity: shapeFillOpacity ?? 0.4, norm: true };
        }
        break;
      }
      case "rectangle": {
        let w = pos.x - startX;
        let h = pos.y - startY;
        if (shiftKey) {
          const side = Math.max(Math.abs(w), Math.abs(h));
          w = Math.sign(w) * side;
          h = Math.sign(h) * side;
        }
        if (Math.abs(w) > 3 && Math.abs(h) > 3) {
          ann = { id: genId(), type: "rect", page: pageNum, x: startX / cw, y: startY / ch, w: w / cw, h: h / ch, color: drawColor, lineWidth: nLw, fill: shapeFill, fillOpacity: shapeFillOpacity ?? 0.4, norm: true };
        }
        break;
      }
      case "cloud": {
        let x = startX, y = startY, w = pos.x - startX, h = pos.y - startY;
        if (w < 0) { x = pos.x; w = -w; }
        if (h < 0) { y = pos.y; h = -h; }
        if (w > 3 && h > 3) {
          ann = { id: genId(), type: "cloud", page: pageNum, x: x / cw, y: y / ch, w: w / cw, h: h / ch, color: drawColor, lineWidth: nLw, norm: true };
        }
        break;
      }
      case "redact":
      case "whiteout": {
        // Normalize the drag rect into a top-left + positive size in CANVAS
        // pixels, then convert to 0..1 page-relative coords for storage.
        let x = startX, y = startY, w = pos.x - startX, h = pos.y - startY;
        if (w < 0) { x = pos.x; w = -w; }
        if (h < 0) { y = pos.y; h = -h; }
        if (w > 3 && h > 3) {
          ann = {
            id: genId(),
            type: "redact",
            page: pageNum,
            x: x / canvas.width,
            y: y / canvas.height,
            w: w / canvas.width,
            h: h / canvas.height,
            // Capture the displayed orientation. Includes both the PDF's
            // native page rotation and the user-applied viewer rotation so
            // the export pipeline can unrotate back into PDF user-space.
            rotation: ((pageNativeRotationRef.current + rotation) % 360 + 360) % 360,
            fill: tool === "whiteout" ? "white" : "black",
            createdAt: new Date().toISOString(),
          };
        }
        break;
      }
    }

    if (ann) {
      onAnnotationAdd(ann);
    } else {
      redrawAnnotations();
    }
  }, [tool, pageNum, drawColor, onAnnotationAdd, pageSize, shapeFill, shapeFillOpacity]);

  const handleTextClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "text") return;
    setEditingText({ id: genId(), x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  }, [tool]);

  const handleTextCommit = (id: string, content: string, x: number, y: number) => {
    if (content.trim()) {
      const ann: TextAnnotation = {
        id, type: "text", page: pageNum,
        x, y, content: content.trim(), fontSize: textSize, color: textColor, letterSpacing: 0, fontFamily: textFont,
        underline: textUnderline || undefined, strikethrough: textStrike || undefined,
        norm: pageSize.w > 0 && pageSize.h > 0
          ? { x: x / pageSize.w, y: y / pageSize.h, size: textSize / pageSize.w }
          : undefined,
      };
      onAnnotationAdd(ann);
    }
    setEditingText(null);
  };

  const textAnnotations = annotations.filter(a => a.type === "text") as TextAnnotation[];

  // One-time upgrade of legacy text annotations (pixel-only coords) to
  // zoom-stable normalized coords, using the current render size. After
  // this they survive zoom changes and can be flattened into exports.
  useEffect(() => {
    if (pageSize.w <= 0 || pageSize.h <= 0) return;
    for (const t of textAnnotations) {
      if (!t.norm) {
        onAnnotationUpdate(t.id, {
          norm: { x: t.x / pageSize.w, y: t.y / pageSize.h, size: t.fontSize / pageSize.w },
        } as Partial<TextAnnotation> as any);
      }
    }
  }, [textAnnotations, pageSize.w, pageSize.h, onAnnotationUpdate]);
  const commentAnnotations = annotations.filter(a => a.type === "comment") as CommentAnnotation[];
  const imageAnnotations = annotations.filter(a => a.type === "image" && a.page === pageNum) as ImageAnnotation[];
  const editTextAnnotations = annotations.filter(
    a => a.type === "edittext" && a.page === pageNum,
  ) as import("@/lib/annotationTypes").EditTextAnnotation[];

  // Edit-Text tool: when active, clicking any text-layer span (i.e. the
  // original PDF text) opens the inline replacement editor over that
  // span. We use event delegation on the textLayer container so the
  // handler survives every textLayer re-render. We also bail out when
  // the page is rotated, since v1 doesn't support rotated burn-in.
  useEffect(() => {
    if (tool !== "edittext") return;
    const layer = textLayerRef.current;
    const wrap = wrapperRef.current;
    if (!layer || !wrap) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.tagName !== "SPAN") return;
      const text = target.textContent ?? "";
      if (!text.trim()) return;
      const totalRot =
        ((pageNativeRotationRef.current + rotation) % 360 + 360) % 360;
      if (totalRot !== 0) {
        alert("Edit Text only works on un-rotated pages — please reset rotation first.");
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      const wrapBox = wrap.getBoundingClientRect();
      const spanBox = target.getBoundingClientRect();
      const x = spanBox.left - wrapBox.left;
      const y = spanBox.top - wrapBox.top;
      const w = Math.max(spanBox.width, 24);
      const h = Math.max(spanBox.height, 12);
      const fontSizeCss = parseFloat(getComputedStyle(target).fontSize) || h;
      const fontSizePdf = fontSizeCss / Math.max(zoom, 0.0001);
      setEditingPdfText({
        x, y, w, h, fontSizeCss, fontSizePdf,
        text, originalText: text, rotation: 0,
      });
    };
    layer.addEventListener("click", onClick, true);
    return () => layer.removeEventListener("click", onClick, true);
  }, [tool, zoom, rotation, pageNum]);

  const commitEditText = useCallback((newText: string) => {
    setEditingPdfText(prev => {
      if (!prev) return null;
      // No-op (unchanged & not yet stored) → just close.
      if (!prev.id && newText === prev.originalText) return null;
      // Empty replacement on a brand-new edit → close without storing.
      if (!prev.id && !newText.trim()) return null;
      const W = pageSize.w || 1;
      const H = pageSize.h || 1;
      if (prev.id) {
        // Re-edit of existing annotation: only the text content changes.
        onAnnotationUpdate(prev.id, { text: newText } as any);
      } else {
        const ann: import("@/lib/annotationTypes").EditTextAnnotation = {
          id: genId(),
          type: "edittext",
          page: pageNum,
          x: prev.x / W,
          y: prev.y / H,
          w: prev.w / W,
          h: prev.h / H,
          fontSize: prev.fontSizePdf,
          text: newText,
          originalText: prev.originalText,
          coverColor: "#FFFFFF",
          textColor: "#000000",
          rotation: prev.rotation,
          createdAt: new Date().toISOString(),
        };
        onAnnotationAdd(ann);
      }
      return null;
    });
  }, [pageSize.w, pageSize.h, pageNum, onAnnotationAdd, onAnnotationUpdate]);
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);

  // Highlight tool is now Adobe/Edge-style: it uses real text selection on
  // the textLayer beneath. The drawCanvas must NOT capture events for it,
  // otherwise the user can't drag-select text. Shape tools still use the
  // canvas. Right-click on a selection opens the markup popup (handled by
  // the contextmenu listener on the textLayer).
  const drawCanvasActive = isShapeTool(tool);

  // Inline SVG cursor for the eraser — circle the same size as ERASER_RADIUS_CSS.
  const eraserCursorCss = `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${ERASER_RADIUS_CSS * 2 + 4}' height='${ERASER_RADIUS_CSS * 2 + 4}'>` +
    `<circle cx='${ERASER_RADIUS_CSS + 2}' cy='${ERASER_RADIUS_CSS + 2}' r='${ERASER_RADIUS_CSS}' fill='rgba(255,255,255,0.55)' stroke='rgba(0,0,0,0.85)' stroke-width='1.2'/>` +
    `</svg>`
  )}") ${ERASER_RADIUS_CSS + 2} ${ERASER_RADIUS_CSS + 2}, crosshair`;

  return (
    <div
      ref={wrapperRef}
      className={`pdf-page-wrapper${tool === "edittext" ? " edit-text-mode" : ""}`}
      style={{
        width: pageSize.w || defaultPageSize?.w || "auto",
        height: pageSize.h || defaultPageSize?.h || "auto",
        "--scale-factor": zoom,
      } as React.CSSProperties}
      id={`page-${pageNum}`}
      data-edit-text-mode={tool === "edittext" ? "" : undefined}
      onMouseUp={onWrapperPointerUp}
      onTouchEnd={onWrapperPointerUp}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

      {/* Committed + preview highlights render here. The dedicated canvas
          uses `mix-blend-mode` (multiply on bright pages, screen in night
          mode) so the colour tints the page while the letters underneath
          stay fully intact. */}
      <canvas ref={highlightCanvasRef} className="pdf-highlight-canvas" />

      {/* Watermark / page-number on-screen overlays. These mirror what
          the pdf-lib export burns into the saved PDF. */}
      {pageSize.w > 0 && (watermark || pageNo) && (() => {
        const showWatermark = watermark && watermarkAppliesTo(watermark, pageNum, currentPage ?? pageNum);
        const showPageNo = pageNo && pageNoAppliesTo(pageNo, pageNum);
        // Margins are in PDF user-space units to mirror pdfExport.ts; we
        // scale by `zoom` once for CSS pixels.
        const cssWatermarkPos = (pos: string): React.CSSProperties => {
          const M = 36 * zoom;
          if (pos === "center")       return { left: "50%", top: "50%", transform: "translate(-50%,-50%)" };
          if (pos === "top-left")     return { left: M, top: M };
          if (pos === "top-right")    return { right: M, top: M };
          if (pos === "bottom-left")  return { left: M, bottom: M };
          if (pos === "bottom-right") return { right: M, bottom: M };
          return { left: 0, top: 0 };
        };
        const cssPageNoPos = (pos: string): React.CSSProperties => {
          const M = 24 * zoom;
          switch (pos) {
            case "bottom-center": return { left: "50%", bottom: M, transform: "translateX(-50%)" };
            case "bottom-left":   return { left: M, bottom: M };
            case "bottom-right":  return { right: M, bottom: M };
            case "top-center":    return { left: "50%", top: M, transform: "translateX(-50%)" };
            case "top-left":      return { left: M, top: M };
            case "top-right":     return { right: M, top: M };
          }
          return {};
        };
        return (
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0,
              pointerEvents: "none",
              overflow: "hidden",
              zIndex: 5,
            }}
          >
            {showWatermark && watermark && watermark.position !== "tiled" && (
              <div style={{
                position: "absolute",
                ...cssWatermarkPos(watermark.position),
                color: watermark.color,
                opacity: watermark.opacity,
                fontSize: watermark.fontSize * zoom,
                fontWeight: 700,
                letterSpacing: 1.5,
                whiteSpace: "nowrap",
                transform: `${watermark.position === "center" ? "translate(-50%,-50%) " : ""}rotate(${watermark.rotation}deg)`,
                transformOrigin: "center center",
                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
              }}>{watermark.text}</div>
            )}
            {showWatermark && watermark && watermark.position === "tiled" && (() => {
              const stepX = Math.max(150, watermark.fontSize * 4) * zoom;
              const stepY = Math.max(120, watermark.fontSize * 3) * zoom;
              const cols = Math.ceil(pageSize.w / stepX) + 1;
              const rows = Math.ceil(pageSize.h / stepY) + 1;
              const tiles: React.ReactNode[] = [];
              for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                tiles.push(
                  <div key={`${r}-${c}`} style={{
                    position: "absolute",
                    left: c * stepX,
                    top: r * stepY,
                    color: watermark.color,
                    opacity: watermark.opacity,
                    fontSize: watermark.fontSize * zoom,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    whiteSpace: "nowrap",
                    transform: `rotate(${watermark.rotation}deg)`,
                    transformOrigin: "0 0",
                    fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                  }}>{watermark.text}</div>
                );
              }
              return tiles;
            })()}
            {showPageNo && pageNo && (
              <div style={{
                position: "absolute",
                ...cssPageNoPos(pageNo.position),
                color: pageNo.color,
                fontSize: pageNo.fontSize * zoom,
                fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}>{formatPageLabel(pageNo, pageNum, totalPages ?? pageNum)}</div>
            )}
          </div>
        );
      })()}

      <div
        ref={textLayerRef}
        className="textLayer"
      />

      {/* Interactive AcroForm widgets (pdf.js AnnotationLayer, renderForms).
          Only accepts pointer input while the user is in Fill-form mode so it
          never steals clicks from text selection or the annotation tools. */}
      <div
        ref={formLayerRef}
        className={`annotationLayer${formFillMode ? "" : " disabled"}`}
        style={{
          position: "absolute", top: 0, left: 0,
          width: pageSize.w || undefined, height: pageSize.h || undefined,
          zIndex: 4,
        }}
      />

      {selRects.length > 0 && pageSize.w > 0 && (
        <div
          className="selection-overlay"
          style={{ width: pageSize.w, height: pageSize.h }}
          aria-hidden="true"
        >
          {selRects.map((r, i) => (
            <div
              key={i}
              style={{
                left: r.x * pageSize.w,
                top: r.y * pageSize.h,
                width: r.width * pageSize.w,
                height: r.height * pageSize.h,
              }}
            />
          ))}
        </div>
      )}

      <canvas
        ref={drawCanvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          display: "block",
          zIndex: 3,
          pointerEvents: drawCanvasActive ? "all" : "none",
          cursor: drawCanvasActive ? "crosshair" : "inherit",
        }}
        onMouseDown={
          tool === "highlight" ? onHighlightMouseDown
            : isShapeTool(tool) ? onShapeMouseDown
            : undefined
        }
        onMouseMove={
          tool === "highlight" ? onHighlightMouseMove
            : isShapeTool(tool) ? onShapeMouseMove
            : undefined
        }
        onMouseUp={
          tool === "highlight" ? onHighlightMouseUp
            : isShapeTool(tool) ? onShapeMouseUp
            : undefined
        }
        onMouseLeave={
          tool === "highlight" ? onHighlightMouseUp
            : isShapeTool(tool) ? onShapeMouseUp
            : undefined
        }
        onDoubleClick={tool === "polygon" ? onShapeDoubleClick : undefined}
      />

      {tool === "eraser" && (
        <div
          className="eraser-overlay"
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: pageSize.w || "100%",
            height: pageSize.h || "100%",
            zIndex: 150,
            cursor: eraserCursorCss,
            touchAction: "none",
            userSelect: "none",
          }}
          onPointerDown={onEraserPointerDown}
          onPointerMove={onEraserPointerMove}
          onPointerUp={onEraserPointerUp}
          onPointerCancel={onEraserPointerUp}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {copiedToast && (
        <div style={{
          position: "absolute", top: 8, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(30,30,30,0.88)",
          color: "#fff", fontSize: 12, fontWeight: 600,
          padding: "4px 12px", borderRadius: 6,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          zIndex: 100,
        }}>
          Copied!
        </div>
      )}

      {quickBar && pageSize.w > 0 && (
        <div
          data-quick-bar
          ref={quickBarRef}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.stopPropagation(); }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
          style={{
            position: "absolute",
            left: quickBar.x,
            top: quickBar.y,
            zIndex: 201,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#2a2a2e",
            borderRadius: 9,
            padding: "6px 8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
            pointerEvents: "all",
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {QUICK_HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.name}
              onClick={() => {
                if (quickBar.mode === "new") {
                  const ann = createHighlightFromSelection({
                    id: genId(),
                    page: pageNum,
                    selection: { text: quickBar.text, rects: quickBar.rects },
                    color: c.value,
                    opacity: c.opacity,
                  });
                  onAnnotationAdd(ann);
                  window.getSelection()?.removeAllRanges();
                } else if (quickBar.annId) {
                  onAnnotationUpdate(quickBar.annId, { color: c.value, opacity: c.opacity } as Partial<Annotation>);
                }
                setQuickBar(null);
              }}
              style={{
                width: 22, height: 22, borderRadius: "50%",
                background: c.value, cursor: "pointer",
                border: "2px solid rgba(255,255,255,0.35)",
                boxSizing: "border-box", padding: 0,
                transition: "transform 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          ))}
          {quickBar.mode === "edit" && (
            <>
              <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />
              <button
                type="button"
                title="Delete highlight"
                onClick={() => {
                  if (quickBar.annId) onAnnotationRemove(quickBar.annId);
                  setQuickBar(null);
                }}
                style={{
                  width: 26, height: 24, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#ff6b6b", padding: 0, borderRadius: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19,6 L19,20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6" />
                  <path d="M8,6 V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          data-ctx-menu
          style={{
            position: "absolute",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 200,
            background: "#2a2a2e",
            borderRadius: 8,
            padding: "4px 0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
            minWidth: 180,
            pointerEvents: "all",
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              position: "relative",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#3a3a40"; setHlSubmenuOpen(true); }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; setHlSubmenuOpen(false); }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>🖍️</span>
            <span style={{ flex: 1 }}>Highlight</span>
            <span style={{ fontSize: 11, color: "#888" }}>▶</span>
            {hlSubmenuOpen && (
              <div
                data-ctx-menu
                style={{
                  position: "absolute", left: "100%", top: -4,
                  background: "#2a2a2e",
                  borderRadius: 8, padding: "6px 10px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                  display: "flex", gap: 6, alignItems: "center",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={() => setHlSubmenuOpen(true)}
                onMouseLeave={() => setHlSubmenuOpen(false)}
              >
                {SELECTION_HL_COLORS.map(c => (
                  <div
                    key={c.value}
                    title={c.label}
                    onClick={() => {
                      const ann = createHighlightFromSelection({
                        id: genId(),
                        page: pageNum,
                        selection: { text: contextMenu.selectedText, rects: contextMenu.rects },
                        color: c.value,
                        opacity: c.opacity,
                      });
                      onAnnotationAdd(ann);
                      setContextMenu(null);
                      window.getSelection()?.removeAllRanges();
                    }}
                    style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: c.circle,
                      cursor: "pointer",
                      border: "2px solid rgba(255,255,255,0.3)",
                      boxSizing: "border-box",
                      transition: "transform 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => {
              const ann: Annotation = {
                id: genId(), type: "underline", page: pageNum,
                rects: contextMenu.rects,
                color: COLOR_DEFAULTS.underlineColor,
                selectedText: contextMenu.selectedText,
                createdAt: new Date().toISOString(),
              };
              onAnnotationAdd(ann);
              setContextMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center", textDecoration: "underline" }}>U</span>
            <span>Underline</span>
          </div>

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => {
              const ann: Annotation = {
                id: genId(), type: "strike", page: pageNum,
                rects: contextMenu.rects,
                color: COLOR_DEFAULTS.strikeColor,
                selectedText: contextMenu.selectedText,
                createdAt: new Date().toISOString(),
              };
              onAnnotationAdd(ann);
              setContextMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center", textDecoration: "line-through" }}>S</span>
            <span>Strikethrough</span>
          </div>

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.selectedText).then(() => {
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 1800);
              }).catch(() => {});
              setContextMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>📋</span>
            <span>Copy</span>
          </div>

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => {
              if (onSearchTermChange) onSearchTermChange(contextMenu.selectedText);
              setContextMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>🔍</span>
            <span>Search</span>
          </div>

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              position: "relative",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => setCommentInput({ open: true, text: "" })}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>💬</span>
            <span>Add Comment</span>
          </div>

          {commentInput.open && (
            <div data-ctx-menu style={{ padding: "4px 10px 8px" }}>
              <textarea
                autoFocus
                value={commentInput.text}
                onChange={e => setCommentInput({ open: true, text: e.target.value })}
                placeholder="Type your comment..."
                style={{
                  width: "100%", minHeight: 50, maxHeight: 120,
                  background: "#1e1e22", border: "1px solid #555",
                  borderRadius: 5, color: "#e0e0e0", fontSize: 12,
                  padding: "6px 8px", resize: "vertical",
                  outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && commentInput.text.trim()) {
                    e.preventDefault();
                    const firstRect = contextMenu.rects[0];
                    const ann: CommentAnnotation = {
                      id: genId(), type: "comment", page: pageNum,
                      x: firstRect.x, y: firstRect.y,
                      text: commentInput.text.trim(),
                      selectedText: contextMenu.selectedText,
                      rects: contextMenu.rects,
                    };
                    onAnnotationAdd(ann);
                    setContextMenu(null);
                    setCommentInput({ open: false, text: "" });
                    window.getSelection()?.removeAllRanges();
                  }
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
                <button
                  style={{
                    background: "transparent", border: "1px solid #555",
                    color: "#aaa", borderRadius: 4, padding: "3px 10px",
                    fontSize: 11, cursor: "pointer",
                  }}
                  onClick={() => setCommentInput({ open: false, text: "" })}
                >Cancel</button>
                <button
                  style={{
                    background: "#4169E1", border: "none",
                    color: "#fff", borderRadius: 4, padding: "3px 10px",
                    fontSize: 11, cursor: "pointer",
                    opacity: commentInput.text.trim() ? 1 : 0.5,
                  }}
                  disabled={!commentInput.text.trim()}
                  onClick={() => {
                    if (!commentInput.text.trim()) return;
                    const firstRect = contextMenu.rects[0];
                    const ann: CommentAnnotation = {
                      id: genId(), type: "comment", page: pageNum,
                      x: firstRect.x, y: firstRect.y,
                      text: commentInput.text.trim(),
                      selectedText: contextMenu.selectedText,
                      rects: contextMenu.rects,
                    };
                    onAnnotationAdd(ann);
                    setContextMenu(null);
                    setCommentInput({ open: false, text: "" });
                    window.getSelection()?.removeAllRanges();
                  }}
                >Save</button>
              </div>
            </div>
          )}

          <div style={{ height: 1, background: "#444", margin: "2px 8px" }} />

          <div
            style={{
              padding: "7px 14px", color: "#e0e0e0", fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3a3a40")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            onClick={() => {
              searchWebFor(contextMenu.selectedText);
              setContextMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>🌐</span>
            <span>Search the Web</span>
          </div>
        </div>
      )}

      {tool === "text" && (
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            cursor: "text", zIndex: 5,
          }}
          onClick={handleTextClick}
        />
      )}

      {textAnnotations.map(ann => (
        <DraggableTextBox
          key={ann.id}
          ann={ann}
          pageWidth={pageSize.w}
          pageHeight={pageSize.h}
          onMove={(x, y) => onAnnotationUpdate(ann.id, { x, y } as any)}
          onUpdate={patch => onAnnotationUpdate(ann.id, patch as any)}
          onDelete={() => onAnnotationRemove(ann.id)}
        />
      ))}

      {imageAnnotations.map(ann => (
        <ImageOverlay
          key={ann.id}
          ann={ann}
          pageSize={pageSize}
          isInteractive={tool === "hand"}
          onMove={(x, y) => onAnnotationUpdate(ann.id, { x, y } as any)}
          onResize={(w, h) => onAnnotationUpdate(ann.id, { w, h } as any)}
          onDelete={() => onAnnotationRemove(ann.id)}
        />
      ))}

      {/* Adobe-style "Edit Text" replacements rendered on screen. The white
          cover sits at the original PDF text rect; the new text is drawn
          on top in the same approximate font size. Clicking it while the
          edittext tool is active re-opens the inline editor. */}
      {editTextAnnotations.map(ann => {
        const left = ann.x * pageSize.w;
        const top = ann.y * pageSize.h;
        const width = ann.w * pageSize.w;
        const height = ann.h * pageSize.h;
        return (
          <div
            key={ann.id}
            style={{
              position: "absolute",
              left, top,
              minWidth: width,
              height,
              background: ann.coverColor ?? "#FFFFFF",
              color: ann.textColor ?? "#000000",
              fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
              fontSize: ann.fontSize * zoom,
              lineHeight: `${height}px`,
              whiteSpace: "pre",
              paddingLeft: 1,
              boxSizing: "border-box",
              zIndex: 14,
              cursor: tool === "edittext" ? "text" : "default",
              pointerEvents: tool === "edittext" ? "auto" : "none",
              outline: tool === "edittext" ? "1px dashed rgba(13,98,242,0.55)" : "none",
            }}
            onClick={(e) => {
              if (tool !== "edittext") return;
              e.stopPropagation();
              setEditingPdfText({
                id: ann.id,
                x: left, y: top, w: width, h: height,
                fontSizeCss: ann.fontSize * zoom,
                fontSizePdf: ann.fontSize,
                text: ann.text,
                originalText: ann.originalText ?? "",
                rotation: ann.rotation ?? 0,
              });
            }}
          >
            {ann.text}
          </div>
        );
      })}

      {/* Inline editor for the active text replacement. Auto-focuses,
          commits on Enter / blur, cancels on Escape. */}
      {editingPdfText && (
        <input
          type="text"
          autoFocus
          defaultValue={editingPdfText.text}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEditText((e.target as HTMLInputElement).value);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setEditingPdfText(null);
            }
            e.stopPropagation();
          }}
          onBlur={(e) => commitEditText(e.target.value)}
          style={{
            position: "absolute",
            left: editingPdfText.x,
            top: editingPdfText.y,
            minWidth: Math.max(editingPdfText.w, 60),
            height: editingPdfText.h,
            fontSize: editingPdfText.fontSizeCss,
            fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
            lineHeight: `${editingPdfText.h}px`,
            padding: "0 1px",
            margin: 0,
            background: "#FFFFFF",
            color: "#000000",
            border: "2px solid #0D62F2",
            outline: "none",
            borderRadius: 2,
            boxSizing: "border-box",
            zIndex: 50,
            boxShadow: "0 0 0 4px rgba(13,98,242,0.15)",
          }}
        />
      )}

      {commentAnnotations.map(ann => {
        const iconX = ann.rects[0] ? ann.rects[0].x * pageSize.w : ann.x * pageSize.w;
        const iconY = ann.rects[0] ? ann.rects[0].y * pageSize.h : ann.y * pageSize.h;
        return (
          <div
            key={ann.id}
            style={{
              position: "absolute",
              left: iconX - 10,
              top: iconY - 10,
              zIndex: 50,
              cursor: "pointer",
              pointerEvents: "all",
            }}
            onMouseEnter={() => setHoveredComment(ann.id)}
            onMouseLeave={() => setHoveredComment(null)}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#4169E1", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              fontSize: 12, color: "#fff",
            }}>💬</div>
            {hoveredComment === ann.id && (
              <div style={{
                position: "absolute", left: 28, top: -8,
                background: "#2a2a2e", color: "#e0e0e0",
                borderRadius: 8, padding: "8px 12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                fontSize: 12, minWidth: 140, maxWidth: 260,
                zIndex: 100, lineHeight: 1.4,
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 4, fontStyle: "italic" }}>
                  "{ann.selectedText.length > 60 ? ann.selectedText.slice(0, 60) + "…" : ann.selectedText}"
                </div>
                <div>{ann.text}</div>
                <div
                  style={{
                    marginTop: 6, fontSize: 10, color: "#f44",
                    cursor: "pointer", textAlign: "right",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnnotationRemove(ann.id);
                  }}
                >Delete</div>
              </div>
            )}
          </div>
        );
      })}

      {editingText && <ActiveTextInput
        editingText={editingText}
        textSize={textSize}
        textColor={textColor}
        textFont={textFont}
        textUnderline={textUnderline}
        textStrike={textStrike}
        pageWidth={pageSize.w}
        onCommit={(id, content, x, y) => handleTextCommit(id, content, x, y)}
        onCancel={() => setEditingText(null)}
      />}
    </div>
  );
}
