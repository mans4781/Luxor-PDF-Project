import { useRef, useEffect, useState, useCallback } from "react";
import { TextLayer } from "pdfjs-dist";
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
import { hitTestAnnotation, type HitContext } from "@/lib/hitTest";
import { watermarkAppliesTo, pageNoAppliesTo, formatPageLabel } from "@/lib/editTypes";
import {
  HIGHLIGHT_COLORS as HIGHLIGHT_PALETTE,
  DEFAULTS as COLOR_DEFAULTS,
  highlightOpacityFor,
} from "@/lib/annotationColors";

const SHAPE_TOOLS: ToolType[] = ["freehand", "line", "arrow", "oval", "rectangle", "redact"];
const isShapeTool = (t: ToolType) => SHAPE_TOOLS.includes(t);

/** Eraser cursor radius in CSS pixels — matches the visual cursor circle. */
const ERASER_RADIUS_CSS = 10;
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
  drawThickness: number;
  drawColor: string;
  /** When true, oval/rectangle shapes are also filled with `drawColor`. */
  shapeFill: boolean;
  shapeFillOpacity?: number;
  onAnnotationAdd: (a: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (id: string) => void;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
  onSearchTermChange?: (term: string) => void;
  watermark?: import("@/lib/editTypes").WatermarkConfig | null;
  pageNo?: import("@/lib/editTypes").PageNoConfig | null;
  totalPages?: number;
  currentPage?: number;
}

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
  onMove: (x: number, y: number) => void;
  onUpdate: (patch: Partial<TextAnnotation>) => void;
  onDelete: () => void;
}

function DraggableTextBox({ ann, pageWidth, onMove, onUpdate, onDelete }: TextBoxProps) {
  const [selected, setSelected] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localPos, setLocalPos] = useState({ x: ann.x, y: ann.y });
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const wrapperBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalPos({ x: ann.x, y: ann.y });
  }, [ann.x, ann.y]);

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
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: localPos.x,
      startY: localPos.y,
    };
    const handleDragMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      setLocalPos({
        x: dragRef.current.startX + (me.clientX - dragRef.current.startMouseX),
        y: dragRef.current.startY + (me.clientY - dragRef.current.startMouseY),
      });
    };
    const handleDragUp = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const newX = dragRef.current.startX + (me.clientX - dragRef.current.startMouseX);
      const newY = dragRef.current.startY + (me.clientY - dragRef.current.startMouseY);
      dragRef.current = null;
      setLocalPos({ x: newX, y: newY });
      onMove(newX, newY);
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragUp);
    };
    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragUp);
  }, [localPos, onMove]);

  const lineH = Math.round(ann.fontSize * 1.485);
  const maxW = Math.max(60, pageWidth - localPos.x - 4);
  const initialW = Math.min(maxW, Math.max(288, ann.fontSize * 20));
  const ls = ann.letterSpacing ?? 0;
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
    background: "none", border: "none", color: "#ddd", cursor: "pointer",
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
          background: "rgba(40,40,40,0.95)", borderRadius: 5,
          padding: "3px 6px", zIndex: 40, gap: 3,
          boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
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
                    border: ann.color === c.hex ? "2.5px solid #fff" : "1.5px solid rgba(255,255,255,0.3)",
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                <circle cx="8" cy="6" r="1.2"/><circle cx="16" cy="6" r="1.2"/>
                <circle cx="8" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/>
                <circle cx="8" cy="18" r="1.2"/><circle cx="16" cy="18" r="1.2"/>
              </svg>
            </div>

            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Color"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowColorPicker(p => !p); }}
            >
              <div style={{ width: 15, height: 15, borderRadius: 3, background: ann.color, border: "1.5px solid rgba(255,255,255,0.3)" }} />
            </button>

            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Decrease font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (ann.fontSize > 8) onUpdate({ fontSize: ann.fontSize - 2 }); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span style={{ color: "#bbb", fontSize: 12, minWidth: 22, textAlign: "center", fontWeight: 500 }}>{ann.fontSize}</span>
            <button
              style={tbtnStyle} title="Increase font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (ann.fontSize < 72) onUpdate({ fontSize: ann.fontSize + 2 }); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

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

            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={{ ...tbtnStyle, color: "#ff6b6b" }} title="Delete"
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
          fontSize: ann.fontSize, fontFamily: "Times New Roman, serif",
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
            fontSize: ann.fontSize,
            color: ann.color,
            fontFamily: "Times New Roman, serif",
            letterSpacing: ls,
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
          style={{
            fontSize: ann.fontSize,
            color: ann.color,
            fontFamily: "Times New Roman, serif",
            letterSpacing: ls,
            lineHeight: `${lineH}px`,
            minHeight: lineH,
            maxWidth: maxW,
            cursor: "default",
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

function ActiveTextInput({ editingText, textSize, textColor, pageWidth, onCommit, onCancel }: {
  editingText: { id: string; x: number; y: number };
  textSize: number;
  textColor: string;
  pageWidth: number;
  onCommit: (id: string, content: string, x: number, y: number) => void;
  onCancel: () => void;
}) {
  const lineH = Math.round(textSize * 1.485);
  const maxW = Math.max(60, pageWidth - editingText.x - 4);
  const initialW = Math.min(maxW, Math.max(288, textSize * 20));
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
          fontSize: textSize, fontFamily: "Times New Roman, serif", padding: "0 4px",
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
          fontFamily: "Times New Roman, serif",
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

function drawArrowhead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawShapeOnCtx(ctx: CanvasRenderingContext2D, ann: ShapeAnnotation) {
  ctx.save();
  ctx.strokeStyle = ann.color;
  ctx.lineWidth = ann.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (ann.type) {
    case "freehand": {
      if (ann.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y);
      }
      ctx.stroke();
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
  }
  ctx.restore();
}

export default function PDFPage({
  pdfDocument, pageNum, zoom, rotation, searchTerm, tool, annotations,
  highlightColor, textColor, textSize, drawThickness, drawColor,
  shapeFill, shapeFillOpacity,
  onAnnotationAdd, onAnnotationUpdate, onAnnotationRemove,
  onVisible, onSearchTermChange,
  watermark, pageNo, totalPages, currentPage,
}: PDFPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!pdfDocument || !pageCanvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        const page = await pdfDocument.getPage(pageNum);
        const dpr = Math.max(2, window.devicePixelRatio || 1);
        const totalRotation = ((page.rotate ?? 0) + rotation) % 360;
        pageNativeRotationRef.current = page.rotate ?? 0;
        const viewport = page.getViewport({ scale: zoom * dpr, rotation: totalRotation });
        const cssW = viewport.width / dpr;
        const cssH = viewport.height / dpr;

        const canvas = pageCanvasRef.current!;
        if (cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

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
        const task = page.render({ canvasContext: ctx, viewport });
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
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();

    return () => {
      cancelled = true;
      textLayerTaskRef.current?.cancel?.();
    };
  }, [pdfDocument, pageNum, zoom, rotation]);

  useEffect(() => { redrawAnnotations(); }, [annotations, pageSize]);

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
      // Vibrant marker fill: paint the swatch's hex at its own alpha
      // straight onto the page (default `source-over` blend, no
      // multiply). This is the canvas equivalent of a DOM rect with
      // `background: rgba(R,G,B,a); opacity: 1; mix-blend-mode: normal`
      // and is what keeps the color crisp and bright instead of
      // washed-out. PDF text is dark enough that a 0.56–0.72 alpha
      // tint still reads sharply through the highlight.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = ann.color;
      ctx.globalAlpha = typeof ann.opacity === "number" ? ann.opacity : highlightOpacityFor(ann.color);
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
    renderHighlights(ctx, canvas, annotations);
    for (const ann of annotations) {
      if (ann.type === "highlight") {
        // already drawn above
      } else if (ann.type === "underline") {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(1.5, canvas.height * 0.0022);
        ctx.lineCap = "round";
        for (const r of ann.rects) {
          const y = (r.y + r.height) * canvas.height - ctx.lineWidth * 0.5;
          ctx.beginPath();
          ctx.moveTo(r.x * canvas.width, y);
          ctx.lineTo((r.x + r.width) * canvas.width, y);
          ctx.stroke();
        }
        ctx.restore();
      } else if (ann.type === "strike") {
        ctx.save();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = Math.max(1.5, canvas.height * 0.002);
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
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 1;
        ctx.fillRect(ann.x * canvas.width, ann.y * canvas.height, ann.w * canvas.width, ann.h * canvas.height);
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
    const canvas = drawCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    redrawAnnotations();
    const { startX, startY } = highlightRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = highlightOpacityFor(highlightColor);
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
    };
  }, [pageSize]);

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

  const onShapeMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);
    shapeDrawRef.current = {
      active: true,
      startX: pos.x,
      startY: pos.y,
      points: [{ x: pos.x, y: pos.y }],
      shiftKey: e.shiftKey,
    };
  }, []);

  const onShapeMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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
        if (points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
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
    }
    ctx.restore();
  }, [tool, drawColor, annotations, pageSize, shapeFill, shapeFillOpacity]);

  const onShapeMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = shapeDrawRef.current;
    if (!state?.active) return;
    const pos = getCanvasPos(e);
    state.shiftKey = e.shiftKey;
    shapeDrawRef.current = null;

    const canvas = drawCanvasRef.current!;
    const lw = drawThickness * (canvas.width / pageSize.w);
    const { startX, startY, shiftKey, points } = state;

    let ann: ShapeAnnotation | RedactionAnnotation | null = null;

    switch (tool) {
      case "freehand": {
        points.push({ x: pos.x, y: pos.y });
        if (points.length >= 2) {
          ann = { id: genId(), type: "freehand", page: pageNum, points, color: drawColor, lineWidth: lw };
        }
        break;
      }
      case "line": {
        const dx = pos.x - startX, dy = pos.y - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          ann = { id: genId(), type: "line", page: pageNum, x1: startX, y1: startY, x2: pos.x, y2: pos.y, color: drawColor, lineWidth: lw };
        }
        break;
      }
      case "arrow": {
        const dx = pos.x - startX, dy = pos.y - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          ann = { id: genId(), type: "arrow", page: pageNum, x1: startX, y1: startY, x2: pos.x, y2: pos.y, color: drawColor, lineWidth: lw };
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
          ann = { id: genId(), type: "oval", page: pageNum, cx, cy, rx, ry, color: drawColor, lineWidth: lw, fill: shapeFill, fillOpacity: shapeFillOpacity ?? 0.4 };
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
          ann = { id: genId(), type: "rect", page: pageNum, x: startX, y: startY, w, h, color: drawColor, lineWidth: lw, fill: shapeFill, fillOpacity: shapeFillOpacity ?? 0.4 };
        }
        break;
      }
      case "redact": {
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
        x, y, content: content.trim(), fontSize: textSize, color: textColor, letterSpacing: 0,
      };
      onAnnotationAdd(ann);
    }
    setEditingText(null);
  };

  const textAnnotations = annotations.filter(a => a.type === "text") as TextAnnotation[];
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
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto", "--scale-factor": zoom } as React.CSSProperties}
      id={`page-${pageNum}`}
      data-edit-text-mode={tool === "edittext" ? "" : undefined}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

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
                fontFamily: "Helvetica, Arial, sans-serif",
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
                    fontFamily: "Helvetica, Arial, sans-serif",
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
                fontFamily: "Helvetica, Arial, sans-serif",
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
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
              const q = encodeURIComponent(contextMenu.selectedText);
              window.open(`https://www.google.com/search?q=${q}`, "_blank");
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
              fontFamily: "Helvetica, Arial, sans-serif",
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
            fontFamily: "Helvetica, Arial, sans-serif",
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
        pageWidth={pageSize.w}
        onCommit={(id, content, x, y) => handleTextCommit(id, content, x, y)}
        onCancel={() => setEditingText(null)}
      />}
    </div>
  );
}
