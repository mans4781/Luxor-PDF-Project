import { useRef, useEffect, useState, useCallback } from "react";
import { TextLayer } from "pdfjs-dist";
import {
  Annotation, HighlightAnnotation, TextAnnotation, ToolType,
  FreehandAnnotation, LineAnnotation, ArrowAnnotation, OvalAnnotation, RectAnnotation,
  ShapeAnnotation, Point,
} from "@/lib/annotationTypes";

const SHAPE_TOOLS: ToolType[] = ["freehand", "line", "arrow", "oval", "rectangle"];
const isShapeTool = (t: ToolType) => SHAPE_TOOLS.includes(t);
const LINE_WIDTH = 2.5;

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

interface TextBoxProps {
  ann: TextAnnotation;
  onMove: (x: number, y: number) => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
}

function DraggableTextBox({ ann, onMove, onContentChange, onDelete }: TextBoxProps) {
  const [selected, setSelected] = useState(false);
  const [localPos, setLocalPos] = useState({ x: ann.x, y: ann.y });
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const newX = dragRef.current.startX + (me.clientX - dragRef.current.startMouseX);
      const newY = dragRef.current.startY + (me.clientY - dragRef.current.startMouseY);
      setLocalPos({ x: newX, y: newY });
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

  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      const el = textareaRef.current?.closest(".text-box-wrapper") as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  return (
    <div
      className="text-box-wrapper"
      style={{
        position: "absolute",
        left: localPos.x,
        top: localPos.y,
        zIndex: selected ? 30 : 20,
        userSelect: "none",
      }}
      onMouseDown={() => setSelected(true)}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            top: -22, left: 0, right: 0, height: 22,
            background: "#4f8ef7",
            borderRadius: "4px 4px 0 0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 6px",
          }}
        >
          <div
            onMouseDown={startDrag}
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, cursor: "grab", height: "100%" }}
            title="Drag to move"
          >
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
            ))}
          </div>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete text box"
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.9)", cursor: "pointer",
              fontSize: 14, lineHeight: 1, padding: "0 2px",
              display: "flex", alignItems: "center", borderRadius: 3,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        defaultValue={ann.content}
        rows={1}
        style={{
          fontSize: ann.fontSize,
          color: ann.color,
          fontFamily: "Times New Roman, serif",
          background: "transparent",
          border: selected ? "1.5px solid #4f8ef7" : "none",
          borderTop: selected ? "1.5px solid #4f8ef7" : "none",
          outline: "none",
          resize: selected ? "both" : "none",
          cursor: "text",
          minWidth: 80, minHeight: 28,
          padding: selected ? "4px 8px" : "0",
          lineHeight: 1.5,
          pointerEvents: "all",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
          display: "block",
          boxShadow: selected ? "0 2px 8px rgba(79,142,247,0.18)" : "none",
          borderRadius: selected ? "0 4px 4px 4px" : 0,
          transition: "background 0.1s, box-shadow 0.1s",
        }}
        onFocus={() => setSelected(true)}
        onBlur={e => {
          if (e.target.value !== ann.content) {
            onContentChange(e.target.value);
          }
        }}
      />
    </div>
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
  highlightColor, textColor, textSize, drawColor,
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
    ctx.lineWidth = LINE_WIDTH * (canvas.width / pageSize.w);
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
    const lw = LINE_WIDTH * (canvas.width / pageSize.w);
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
        x, y, content, fontSize: textSize, color: textColor,
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
          onMove={(x, y) => onAnnotationUpdate(ann.id, { x, y } as any)}
          onContentChange={content => onAnnotationUpdate(ann.id, { content } as any)}
          onDelete={() => onAnnotationRemove(ann.id)}
        />
      ))}

      {editingText && (
        <textarea
          autoFocus
          style={{
            position: "absolute",
            left: editingText.x, top: editingText.y,
            fontSize: textSize, color: textColor,
            fontFamily: "Times New Roman, serif",
            background: "rgba(255,255,255,0.97)",
            border: "2px solid #4f8ef7",
            borderRadius: "0 4px 4px 4px",
            outline: "none", resize: "none",
            minWidth: 140, minHeight: 40,
            padding: "4px 8px", lineHeight: 1.5,
            pointerEvents: "all", zIndex: 50,
            boxShadow: "0 2px 10px rgba(79,142,247,0.25)",
          }}
          rows={2}
          placeholder="Type here… (Enter to save)"
          onKeyDown={e => {
            if (e.key === "Escape") { e.stopPropagation(); setEditingText(null); }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextCommit(editingText.id, e.currentTarget.value, editingText.x, editingText.y);
            }
          }}
          onBlur={e => handleTextCommit(editingText.id, e.target.value, editingText.x, editingText.y)}
        />
      )}
    </div>
  );
}
