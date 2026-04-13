import { useRef, useEffect, useState, useCallback } from "react";
import { TextLayer } from "pdfjs-dist";
import {
  Annotation, HighlightAnnotation, TextAnnotation, CommentAnnotation, ToolType,
  FreehandAnnotation, LineAnnotation, ArrowAnnotation, OvalAnnotation, RectAnnotation,
  ShapeAnnotation, Point,
} from "@/lib/annotationTypes";

const SHAPE_TOOLS: ToolType[] = ["freehand", "line", "arrow", "oval", "rectangle"];
const isShapeTool = (t: ToolType) => SHAPE_TOOLS.includes(t);

type Rect = { x: number; y: number; width: number; height: number };
function mergeOverlappingRects(rects: Rect[]): Rect[] {
  if (rects.length <= 1) return rects;
  const rows: Rect[][] = [];
  for (const r of rects) {
    let placed = false;
    for (const row of rows) {
      const sample = row[0];
      if (Math.abs(r.y - sample.y) < sample.height * 0.5) {
        row.push(r);
        placed = true;
        break;
      }
    }
    if (!placed) rows.push([r]);
  }
  const merged: Rect[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let cur = { ...row[0] };
    for (let i = 1; i < row.length; i++) {
      const r = row[i];
      const curRight = cur.x + cur.width;
      if (r.x <= curRight + 2) {
        const newRight = Math.max(curRight, r.x + r.width);
        const newY = Math.min(cur.y, r.y);
        const newBottom = Math.max(cur.y + cur.height, r.y + r.height);
        cur.x = Math.min(cur.x, r.x);
        cur.y = newY;
        cur.width = newRight - cur.x;
        cur.height = newBottom - newY;
      } else {
        merged.push(cur);
        cur = { ...r };
      }
    }
    merged.push(cur);
  }
  return merged;
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
  drawThickness: number;
  drawColor: string;
  onAnnotationAdd: (a: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (id: string) => void;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
  onSearchTermChange?: (term: string) => void;
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
      ctx.stroke();
      break;
    }
    case "rect": {
      ctx.strokeRect(ann.x, ann.y, ann.w, ann.h);
      break;
    }
  }
  ctx.restore();
}

export default function PDFPage({
  pdfDocument, pageNum, zoom, rotation, searchTerm, tool, annotations,
  highlightColor, textColor, textSize, drawThickness, drawColor,
  onAnnotationAdd, onAnnotationUpdate, onAnnotationRemove,
  onVisible, onSearchTermChange,
}: PDFPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  const highlightRef = useRef<{ active: boolean; startX: number; startY: number } | null>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerTaskRef = useRef<any>(null);

  const shapeDrawRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    points: Point[];
    shiftKey: boolean;
  } | null>(null);

  const [copiedToast, setCopiedToast] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    selectedText: string;
    rects: { x: number; y: number; width: number; height: number }[];
  } | null>(null);
  const [hlSubmenuOpen, setHlSubmenuOpen] = useState(false);
  const [commentInput, setCommentInput] = useState<{ open: boolean; text: string }>({ open: false, text: "" });

  const SELECTION_HL_COLORS = [
    { value: "rgba(255,255,0,0.3)", circle: "#FFFF00" },
    { value: "rgba(0,255,0,0.3)", circle: "#00FF00" },
    { value: "rgba(0,255,255,0.3)", circle: "#00FFFF" },
    { value: "rgba(255,0,255,0.3)", circle: "#FF00FF" },
    { value: "rgba(255,0,0,0.3)", circle: "#FF0000" },
  ];

  const getSelectionRects = useCallback(() => {
    const wrapper = wrapperRef.current;
    const sel = window.getSelection();
    if (!wrapper || !sel || sel.rangeCount === 0) return null;
    const txt = sel.toString().trim();
    if (!txt) return null;
    const range = sel.getRangeAt(0);
    const clientRects = range.getClientRects();
    if (clientRects.length === 0) return null;

    const wrapperRect = wrapper.getBoundingClientRect();

    const rawRects: { x: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < clientRects.length; i++) {
      const r = clientRects[i];
      rawRects.push({
        x: (r.left - wrapperRect.left) / wrapperRect.width,
        y: (r.top - wrapperRect.top) / wrapperRect.height,
        width: r.width / wrapperRect.width,
        height: r.height / wrapperRect.height,
      });
    }
    const rects = mergeOverlappingRects(rawRects);
    return { text: txt, rects };
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

  function redrawAnnotations() {
    const canvas = drawCanvasRef.current;
    if (!canvas || pageSize.w === 0) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const ann of annotations) {
      if (ann.type === "highlight") {
        ctx.save();
        ctx.fillStyle = ann.color;
        for (const r of ann.rects) ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.width * canvas.width, r.height * canvas.height);
        ctx.restore();
      } else if (ann.type === "comment") {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#4169E1";
        for (const r of ann.rects) ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.width * canvas.width, r.height * canvas.height);
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
    ctx.globalAlpha = 0.38;
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
      };
      onAnnotationAdd(ann);
    } else {
      redrawAnnotations();
    }
  }, [pageNum, highlightColor, onAnnotationAdd]);

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
        ctx.strokeRect(startX, startY, w, h);
        break;
      }
    }
    ctx.restore();
  }, [tool, drawColor, annotations, pageSize]);

  const onShapeMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = shapeDrawRef.current;
    if (!state?.active) return;
    const pos = getCanvasPos(e);
    state.shiftKey = e.shiftKey;
    shapeDrawRef.current = null;

    const canvas = drawCanvasRef.current!;
    const lw = drawThickness * (canvas.width / pageSize.w);
    const { startX, startY, shiftKey, points } = state;

    let ann: ShapeAnnotation | null = null;

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
          ann = { id: genId(), type: "oval", page: pageNum, cx, cy, rx, ry, color: drawColor, lineWidth: lw };
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
          ann = { id: genId(), type: "rect", page: pageNum, x: startX, y: startY, w, h, color: drawColor, lineWidth: lw };
        }
        break;
      }
    }

    if (ann) {
      onAnnotationAdd(ann);
    } else {
      redrawAnnotations();
    }
  }, [tool, pageNum, drawColor, onAnnotationAdd, pageSize]);

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
  const [hoveredComment, setHoveredComment] = useState<string | null>(null);

  const drawCanvasActive = tool === "highlight" || isShapeTool(tool);

  return (
    <div
      ref={wrapperRef}
      className="pdf-page-wrapper"
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto", "--scale-factor": zoom } as React.CSSProperties}
      id={`page-${pageNum}`}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

      <div
        ref={textLayerRef}
        className="textLayer"
      />

      <canvas
        ref={drawCanvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          display: "block",
          zIndex: 3,
          pointerEvents: drawCanvasActive ? "all" : "none",
          cursor: drawCanvasActive ? "crosshair" : "inherit",
        }}
        onMouseDown={tool === "highlight" ? onHighlightMouseDown : isShapeTool(tool) ? onShapeMouseDown : undefined}
        onMouseMove={tool === "highlight" ? onHighlightMouseMove : isShapeTool(tool) ? onShapeMouseMove : undefined}
        onMouseUp={tool === "highlight" ? onHighlightMouseUp : isShapeTool(tool) ? onShapeMouseUp : undefined}
        onMouseLeave={tool === "highlight" ? onHighlightMouseUp : isShapeTool(tool) ? onShapeMouseUp : undefined}
      />

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
                    onClick={() => {
                      const ann: HighlightAnnotation = {
                        id: genId(), type: "highlight", page: pageNum,
                        rects: contextMenu.rects, color: c.value,
                      };
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
