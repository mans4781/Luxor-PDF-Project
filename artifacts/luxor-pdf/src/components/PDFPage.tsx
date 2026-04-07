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

  // Redraw highlights on annotation change
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

  // ── Highlight tool: mouse events on draw canvas ──────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Scale from CSS pixels to canvas coordinate space
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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
    const width = pos.x - startX;
    const height = pos.y - startY;
    if (Math.abs(width) > 4 && Math.abs(height) > 4) {
      const ann: HighlightAnnotation = {
        id: genId(), type: "highlight", page: pageNum,
        rects: [{
          x: Math.min(startX, pos.x), y: Math.min(startY, pos.y),
          width: Math.abs(width), height: Math.abs(height),
        }],
        color: highlightColor,
      };
      onAnnotationAdd(ann);
    } else {
      redrawAnnotations();
    }
  }, [pageNum, highlightColor, onAnnotationAdd]);

  // ── Text tool: click on transparent overlay div ─────────────────────────
  const handleTextClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "text") return;
    // offsetX/Y give position relative to the clicked element (the overlay div)
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setEditingText({ id: genId(), x, y });
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
      {/* PDF render canvas */}
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

      {/* Highlight drawing overlay — only captures events in highlight mode */}
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

      {/* Text tool click overlay — transparent div, only active in text mode */}
      {tool === "text" && (
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            cursor: "text",
            zIndex: 5,
          }}
          onClick={handleTextClick}
        />
      )}

      {/* Committed text annotations */}
      {textAnnotations.map(ann => (
        <textarea
          key={ann.id}
          style={{
            position: "absolute",
            left: ann.x, top: ann.y,
            fontSize: ann.fontSize,
            color: ann.color,
            fontFamily: "Times New Roman, serif",
            background: "rgba(255,255,255,0.88)",
            border: "1.5px dashed rgba(79,142,247,0.5)",
            borderRadius: 3,
            outline: "none",
            resize: "both",
            cursor: "text",
            minWidth: 80, minHeight: 28,
            padding: "3px 6px",
            lineHeight: 1.5,
            pointerEvents: "all",
            zIndex: 20,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "0 1px 5px rgba(0,0,0,0.10)",
          }}
          defaultValue={ann.content}
          rows={1}
          onFocus={e => { e.currentTarget.style.borderColor = "#4f8ef7"; e.currentTarget.style.borderStyle = "solid"; }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "rgba(79,142,247,0.5)";
            e.currentTarget.style.borderStyle = "dashed";
            if (e.target.value !== ann.content) {
              onAnnotationUpdate(ann.id, { content: e.target.value } as any);
            }
          }}
        />
      ))}

      {/* Active text input being typed */}
      {editingText && (
        <textarea
          autoFocus
          style={{
            position: "absolute",
            left: editingText.x, top: editingText.y,
            fontSize: textSize,
            color: textColor,
            fontFamily: "Times New Roman, serif",
            background: "rgba(255,255,255,0.97)",
            border: "2px solid #4f8ef7",
            outline: "none",
            resize: "none",
            borderRadius: 3,
            minWidth: 120, minHeight: 36,
            padding: "4px 8px",
            lineHeight: 1.5,
            pointerEvents: "all",
            zIndex: 50,
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
