import { useRef, useEffect, useState, useCallback } from "react";
import { TextLayer } from "pdfjs-dist";
import {
  Annotation, HighlightAnnotation, TextAnnotation, ToolType,
  FreehandAnnotation, LineAnnotation, ArrowAnnotation, OvalAnnotation, RectAnnotation,
  ShapeAnnotation, Point,
} from "@/lib/annotationTypes";

const SHAPE_TOOLS: ToolType[] = ["freehand", "line", "arrow", "oval", "rectangle"];
const isShapeTool = (t: ToolType) => SHAPE_TOOLS.includes(t);
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
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localPos, setLocalPos] = useState({ x: ann.x, y: ann.y });
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setLocalPos({ x: ann.x, y: ann.y });
  }, [ann.x, ann.y]);

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

  const lineH = Math.round(ann.fontSize * 1.35);
  const maxW = Math.max(60, pageWidth - localPos.x - 4);
  const initialW = Math.min(maxW, Math.max(120, ann.fontSize * 8));
  const ls = ann.letterSpacing ?? 0;
  const showControls = hovered || editing || showColorPicker;

  const updateInputWidth = useCallback(() => {
    if (measureRef.current && inputRef.current) {
      const textW = measureRef.current.offsetWidth + 16;
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
    fontSize: 12, padding: "2px 3px", display: "flex", alignItems: "center",
    lineHeight: 1, borderRadius: 2,
  };

  return (
    <div
      className="text-box-wrapper"
      style={{
        position: "absolute",
        left: localPos.x,
        top: localPos.y,
        zIndex: editing ? 30 : 20,
        userSelect: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowColorPicker(false); }}
    >
      {showControls && (
        <div style={{
          position: "absolute", top: -(showColorPicker ? 50 : 24), left: 0,
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          background: "rgba(40,40,40,0.95)", borderRadius: 4,
          padding: "2px 4px", zIndex: 40, gap: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}>
          {showColorPicker && (
            <div style={{ display: "flex", gap: 3, padding: "2px 0" }}>
              {TEXT_CMYK_COLORS.map(c => (
                <div
                  key={c.hex}
                  onClick={e => { e.stopPropagation(); onUpdate({ color: c.hex }); setShowColorPicker(false); }}
                  title={c.name}
                  style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: c.hex, cursor: "pointer",
                    border: ann.color === c.hex ? "2px solid #fff" : "1px solid rgba(255,255,255,0.3)",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <div
              onMouseDown={startDrag}
              style={{ cursor: "grab", display: "flex", alignItems: "center", padding: "2px 3px" }}
              title="Drag to move"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                <circle cx="8" cy="6" r="1.2"/><circle cx="16" cy="6" r="1.2"/>
                <circle cx="8" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/>
                <circle cx="8" cy="18" r="1.2"/><circle cx="16" cy="18" r="1.2"/>
              </svg>
            </div>

            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Color"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowColorPicker(p => !p); }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: ann.color, border: "1px solid rgba(255,255,255,0.3)" }} />
            </button>

            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Decrease font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (ann.fontSize > 8) onUpdate({ fontSize: ann.fontSize - 2 }); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span style={{ color: "#bbb", fontSize: 10, minWidth: 18, textAlign: "center" }}>{ann.fontSize}</span>
            <button
              style={tbtnStyle} title="Increase font size"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); if (ann.fontSize < 72) onUpdate({ fontSize: ann.fontSize + 2 }); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={tbtnStyle} title="Decrease letter spacing"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ letterSpacing: Math.max(-2, ls - 0.5) }); }}
            >
              <svg width="14" height="12" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              <svg width="14" height="12" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="8" y1="10" x2="20" y2="10"/>
                <polyline points="11,7 8,10 11,13"/>
                <polyline points="17,7 20,10 17,13"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)", margin: "0 2px" }} />

            <button
              style={{ ...tbtnStyle, color: "#ff6b6b" }} title="Delete"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
          letterSpacing: ls, padding: "0 4px",
        }}
        aria-hidden="true"
      />

      {editing ? (
        <input
          ref={inputRef}
          autoFocus
          defaultValue={ann.content}
          style={{
            fontSize: ann.fontSize,
            color: ann.color,
            fontFamily: "Times New Roman, serif",
            letterSpacing: ls,
            background: "rgba(255,255,255,0.97)",
            border: "1.5px dashed #E81123",
            outline: "none",
            height: lineH,
            width: inputWidth ?? initialW,
            maxWidth: maxW,
            padding: "0 4px",
            lineHeight: `${lineH}px`,
            pointerEvents: "all",
            borderRadius: 2,
            boxSizing: "border-box",
          }}
          onChange={e => {
            if (measureRef.current) {
              measureRef.current.textContent = e.target.value || "";
              updateInputWidth();
            }
          }}
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); setEditing(false); setInputWidth(null); }
            if (e.key === "Enter") { e.preventDefault(); commitEdit(e.currentTarget.value); }
          }}
          onBlur={e => commitEdit(e.target.value)}
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
            height: lineH,
            maxWidth: maxW,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "default",
            pointerEvents: "all",
            borderRadius: 2,
            border: showControls ? "1.5px dashed #E81123" : "1.5px dashed transparent",
            padding: "0 4px",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
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
  const lineH = Math.round(textSize * 1.35);
  const maxW = Math.max(60, pageWidth - editingText.x - 4);
  const initialW = Math.min(maxW, Math.max(120, textSize * 8));
  const [width, setWidth] = useState(initialW);
  const measureRef = useRef<HTMLSpanElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (measureRef.current) {
      measureRef.current.textContent = e.target.value || "";
      const textW = measureRef.current.offsetWidth + 16;
      setWidth(Math.min(maxW, Math.max(initialW, textW)));
    }
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
      <input
        autoFocus
        type="text"
        style={{
          position: "absolute",
          left: editingText.x, top: editingText.y,
          fontSize: textSize, color: textColor,
          fontFamily: "Times New Roman, serif",
          background: "rgba(255,255,255,0.97)",
          border: "1.5px dashed #E81123",
          outline: "none",
          width,
          maxWidth: maxW,
          height: lineH,
          lineHeight: `${lineH}px`,
          padding: "0 4px",
          pointerEvents: "all", zIndex: 50,
          borderRadius: 2,
          boxSizing: "border-box",
        }}
        placeholder="Type here…"
        onChange={handleChange}
        onKeyDown={e => {
          if (e.key === "Escape") { e.stopPropagation(); onCancel(); }
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(editingText.id, e.currentTarget.value, editingText.x, editingText.y);
          }
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
  onVisible,
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

  useEffect(() => {
    if (tool !== "hand") return;
    const layer = textLayerRef.current;
    if (!layer) return;

    const onUp = () => {
      const sel = window.getSelection();
      const txt = sel?.toString().trim();
      if (txt) {
        navigator.clipboard.writeText(txt).then(() => {
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 1800);
        }).catch(() => {});
      }
    };

    layer.addEventListener("mouseup", onUp);
    return () => layer.removeEventListener("mouseup", onUp);
  }, [tool]);

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
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = ann.color;
        for (const r of ann.rects) ctx.fillRect(r.x, r.y, r.width, r.height);
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
      const ann: HighlightAnnotation = {
        id: genId(), type: "highlight", page: pageNum,
        rects: [{ x: Math.min(startX, pos.x), y: Math.min(startY, pos.y), width: Math.abs(w), height: Math.abs(h) }],
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
