import { useRef, useEffect, useState, useCallback } from "react";
import { Annotation, HighlightAnnotation, TextAnnotation, ToolType } from "@/lib/annotationTypes";

interface PDFPageProps {
  pdfDocument: any;
  pageNum: number;
  zoom: number;
  tool: ToolType;
  annotations: Annotation[];
  highlightColor: string;
  textColor: string;
  textSize: number;
  onAnnotationAdd: (a: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Draggable text box sub-component ─────────────────────────────────────────
interface TextBoxProps {
  ann: TextAnnotation;
  onMove: (x: number, y: number) => void;
  onContentChange: (content: string) => void;
}

function DraggableTextBox({ ann, onMove, onContentChange }: TextBoxProps) {
  const [selected, setSelected] = useState(false);
  const [localPos, setLocalPos] = useState({ x: ann.x, y: ann.y });
  const dragRef = useRef<{ startMouseX: number; startMouseY: number; startX: number; startY: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync position when annotation x/y change externally
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

  // Clicking outside deselects
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
      {/* Drag handle — visible only when selected */}
      {selected && (
        <div
          onMouseDown={startDrag}
          style={{
            position: "absolute",
            top: -20,
            left: 0,
            right: 0,
            height: 20,
            background: "#4f8ef7",
            borderRadius: "4px 4px 0 0",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: "0 6px",
          }}
          title="Drag to move"
        >
          {/* Grip dots */}
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />
          ))}
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
          minWidth: 80,
          minHeight: 28,
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

// ── Main PDFPage component ────────────────────────────────────────────────────
export default function PDFPage({
  pdfDocument, pageNum, zoom, tool, annotations,
  highlightColor, textColor, textSize,
  onAnnotationAdd, onAnnotationUpdate,
  onVisible,
}: PDFPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  const highlightRef = useRef<{ active: boolean; startX: number; startY: number } | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Track visible page
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

  // Render PDF page
  useEffect(() => {
    if (!pdfDocument || !pageCanvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = pageCanvasRef.current!;
        if (cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        if (drawCanvasRef.current) {
          drawCanvasRef.current.width = viewport.width;
          drawCanvasRef.current.height = viewport.height;
        }
        setPageSize({ w: viewport.width, h: viewport.height });
        const ctx = canvas.getContext("2d")!;
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
        if (!cancelled) redrawAnnotations();
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDocument, pageNum, zoom]);

  useEffect(() => { redrawAnnotations(); }, [annotations, pageSize]);

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
      }
    }
  }

  // Highlight canvas coordinate scaling
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

  // Text tool click on transparent overlay
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

  return (
    <div
      ref={wrapperRef}
      className="pdf-page-wrapper"
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto" }}
      id={`page-${pageNum}`}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

      {/* Highlight drawing canvas */}
      <canvas
        ref={drawCanvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          display: "block",
          pointerEvents: tool === "highlight" ? "all" : "none",
          cursor: tool === "highlight" ? "crosshair" : "default",
        }}
        onMouseDown={onHighlightMouseDown}
        onMouseMove={onHighlightMouseMove}
        onMouseUp={onHighlightMouseUp}
        onMouseLeave={onHighlightMouseUp}
      />

      {/* Text tool transparent click overlay */}
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

      {/* Committed draggable text annotations */}
      {textAnnotations.map(ann => (
        <DraggableTextBox
          key={ann.id}
          ann={ann}
          onMove={(x, y) => onAnnotationUpdate(ann.id, { x, y } as any)}
          onContentChange={content => onAnnotationUpdate(ann.id, { content } as any)}
        />
      ))}

      {/* Active text input (being typed right now) */}
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
