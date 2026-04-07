import { useRef, useEffect, useState, useCallback } from "react";
import { Annotation, HighlightAnnotation, TextAnnotation, ToolType, Point } from "@/lib/annotationTypes";

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

  function getPos(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const rect = drawCanvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getPos(e);
    if (tool === "highlight") {
      highlightRef.current = { active: true, startX: pos.x, startY: pos.y };
    } else if (tool === "text") {
      setEditingText({ id: genId(), x: pos.x, y: pos.y });
    }
  }, [tool]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "highlight" && highlightRef.current?.active) {
      const pos = getPos(e);
      const canvas = drawCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      redrawAnnotations();
      const { startX, startY } = highlightRef.current;
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(startX, startY, pos.x - startX, pos.y - startY);
      ctx.restore();
    }
  }, [tool, highlightColor, annotations, pageSize]);

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "highlight" && highlightRef.current?.active) {
      const pos = getPos(e);
      const { startX, startY } = highlightRef.current;
      highlightRef.current = null;
      const width = pos.x - startX;
      const height = pos.y - startY;
      if (Math.abs(width) > 4 && Math.abs(height) > 4) {
        const ann: HighlightAnnotation = {
          id: genId(), type: "highlight", page: pageNum,
          rects: [{ x: Math.min(startX, pos.x), y: Math.min(startY, pos.y), width: Math.abs(width), height: Math.abs(height) }],
          color: highlightColor,
        };
        onAnnotationAdd(ann);
      } else {
        redrawAnnotations();
      }
    }
  }, [tool, pageNum, highlightColor, onAnnotationAdd]);

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

  const getCursor = () => {
    if (tool === "highlight") return "crosshair";
    if (tool === "text") return "text";
    if (tool === "eraser") return "not-allowed";
    return "default";
  };

  const textAnnotations = annotations.filter(a => a.type === "text") as TextAnnotation[];
  const isInteractive = tool === "highlight" || tool === "text";

  return (
    <div
      ref={wrapperRef}
      className="pdf-page-wrapper"
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto" }}
      id={`page-${pageNum}`}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />

      {/* Annotation overlay for highlights */}
      <canvas
        ref={drawCanvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          pointerEvents: isInteractive ? "all" : "none",
          cursor: getCursor(),
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Text annotations */}
      {textAnnotations.map(ann => (
        <textarea
          key={ann.id}
          style={{
            position: "absolute",
            left: ann.x, top: ann.y,
            fontSize: ann.fontSize,
            color: ann.color,
            fontFamily: "Times New Roman, serif",
            background: "transparent",
            border: "1px dashed transparent",
            outline: "none",
            resize: "none",
            cursor: "text",
            minWidth: 60, minHeight: 24,
            padding: "2px 4px",
            lineHeight: 1.4,
            pointerEvents: "all",
            zIndex: 10,
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
          defaultValue={ann.content}
          rows={1}
          onFocus={e => (e.currentTarget.style.borderColor = "#4f8ef7")}
          onBlur={e => {
            (e.currentTarget.style.borderColor = "transparent");
            if (e.target.value !== ann.content) {
              onAnnotationUpdate(ann.id, { content: e.target.value } as any);
            }
          }}
        />
      ))}

      {/* Active text input */}
      {editingText && (
        <textarea
          autoFocus
          style={{
            position: "absolute",
            left: editingText.x, top: editingText.y,
            fontSize: textSize,
            color: textColor,
            fontFamily: "Times New Roman, serif",
            background: "rgba(255,255,255,0.95)",
            border: "2px solid #4f8ef7",
            outline: "none",
            resize: "none",
            borderRadius: 3,
            minWidth: 80, minHeight: 32,
            padding: "2px 6px",
            lineHeight: 1.5,
            pointerEvents: "all",
            zIndex: 50,
          }}
          rows={2}
          placeholder="Type here…"
          onKeyDown={e => {
            if (e.key === "Escape") setEditingText(null);
            if (e.key === "Enter" && !e.shiftKey) {
              handleTextCommit(editingText.id, e.currentTarget.value, editingText.x, editingText.y);
            }
          }}
          onBlur={e => handleTextCommit(editingText.id, e.target.value, editingText.x, editingText.y)}
        />
      )}
    </div>
  );
}
