import {
  useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle
} from "react";
import { Annotation, DrawAnnotation, HighlightAnnotation, TextAnnotation, RectAnnotation, CommentAnnotation, ToolType, Point } from "@/lib/annotationTypes";

export interface PDFPageHandle {
  scrollIntoView: () => void;
}

interface PDFPageProps {
  pdfDocument: any;
  pageNum: number;
  zoom: number;
  tool: ToolType;
  annotations: Annotation[];
  penColor: string;
  penSize: number;
  highlightColor: string;
  eraserSize: number;
  textColor: string;
  textSize: number;
  onAnnotationAdd: (a: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (id: string) => void;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const PDFPage = forwardRef<PDFPageHandle, PDFPageProps>(function PDFPage({
  pdfDocument, pageNum, zoom, tool, annotations,
  penColor, penSize, highlightColor, eraserSize,
  textColor, textSize,
  onAnnotationAdd, onAnnotationUpdate, onAnnotationRemove,
  isCurrentPage, onVisible,
}, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number } | null>(null);
  const drawingRef = useRef<{ active: boolean; points: Point[]; id: string } | null>(null);
  const rectRef = useRef<{ active: boolean; startX: number; startY: number; id: string } | null>(null);
  const highlightRef = useRef<{ active: boolean; startX: number; startY: number; id: string } | null>(null);
  const renderTaskRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    scrollIntoView: () => wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
  }));

  // Intersection observer to track visible page
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
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = pageCanvasRef.current!;
        if (cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setPageSize({ w: viewport.width, h: viewport.height });

        // Also size the draw canvas
        if (drawCanvasRef.current) {
          drawCanvasRef.current.width = viewport.width;
          drawCanvasRef.current.height = viewport.height;
        }

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

  // Re-draw annotations whenever they change
  useEffect(() => {
    redrawAnnotations();
  }, [annotations, pageSize]);

  function redrawAnnotations() {
    const canvas = drawCanvasRef.current;
    if (!canvas || pageSize.w === 0) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const ann of annotations) {
      if (ann.type === "highlight") {
        drawHighlight(ctx, ann);
      } else if (ann.type === "draw") {
        drawPath(ctx, ann);
      } else if (ann.type === "rect") {
        drawRect(ctx, ann);
      }
    }
  }

  function drawHighlight(ctx: CanvasRenderingContext2D, ann: HighlightAnnotation) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = ann.color;
    for (const r of ann.rects) {
      ctx.fillRect(r.x, r.y, r.width, r.height);
    }
    ctx.restore();
  }

  function drawPath(ctx: CanvasRenderingContext2D, ann: DrawAnnotation) {
    if (ann.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = ann.opacity ?? 1;
    ctx.beginPath();
    ctx.moveTo(ann.points[0].x, ann.points[0].y);
    for (let i = 1; i < ann.points.length; i++) {
      ctx.lineTo(ann.points[i].x, ann.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawRect(ctx: CanvasRenderingContext2D, ann: RectAnnotation) {
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.lineWidth;
    ctx.globalAlpha = ann.opacity ?? 1;
    if (ann.fillColor) {
      ctx.fillStyle = ann.fillColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      ctx.globalAlpha = ann.opacity ?? 1;
    }
    ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
    ctx.restore();
  }

  function getPos(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const rect = drawCanvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const getCursor = () => {
    switch (tool) {
      case "hand": return "grab";
      case "select": return "default";
      case "highlight": return "crosshair";
      case "pencil": return "crosshair";
      case "eraser": return "cell";
      case "text": return "text";
      case "rectangle": return "crosshair";
      case "comment": return "copy";
      default: return "default";
    }
  };

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getPos(e);

    if (tool === "pencil") {
      const id = genId();
      drawingRef.current = { active: true, points: [pos], id };
    } else if (tool === "eraser") {
      eraseAtPoint(pos);
    } else if (tool === "highlight") {
      const id = genId();
      highlightRef.current = { active: true, startX: pos.x, startY: pos.y, id };
    } else if (tool === "rectangle") {
      const id = genId();
      rectRef.current = { active: true, startX: pos.x, startY: pos.y, id };
    } else if (tool === "text") {
      setEditingText({ id: genId(), x: pos.x, y: pos.y });
    } else if (tool === "comment") {
      const ann: CommentAnnotation = {
        id: genId(), type: "comment", page: pageNum,
        x: pos.x, y: pos.y, content: "Comment", author: "You",
        timestamp: new Date().toISOString(),
      };
      onAnnotationAdd(ann);
    }
  }, [tool, pageNum, penColor, penSize, highlightColor, eraserSize]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);

    if (tool === "pencil" && drawingRef.current?.active) {
      drawingRef.current.points.push(pos);
      // Draw live
      const canvas = drawCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const pts = drawingRef.current.points;
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      if (pts.length >= 2) {
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (tool === "eraser" && e.buttons === 1) {
      eraseAtPoint(pos);
    } else if (tool === "highlight" && highlightRef.current?.active) {
      // Live preview
      const canvas = drawCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      redrawAnnotations();
      const { startX, startY } = highlightRef.current;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(startX, startY, pos.x - startX, pos.y - startY);
      ctx.restore();
    } else if (tool === "rectangle" && rectRef.current?.active) {
      const canvas = drawCanvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      redrawAnnotations();
      const { startX, startY } = rectRef.current;
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
      ctx.restore();
    }
  }, [tool, penColor, penSize, highlightColor]);

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);

    if (tool === "pencil" && drawingRef.current?.active) {
      const { points, id } = drawingRef.current;
      drawingRef.current = null;
      if (points.length > 1) {
        const ann: DrawAnnotation = {
          id, type: "draw", page: pageNum,
          points, color: penColor, lineWidth: penSize, opacity: 1,
        };
        onAnnotationAdd(ann);
      }
    } else if (tool === "highlight" && highlightRef.current?.active) {
      const { startX, startY, id } = highlightRef.current;
      highlightRef.current = null;
      const width = pos.x - startX;
      const height = pos.y - startY;
      if (Math.abs(width) > 4 && Math.abs(height) > 4) {
        const ann: HighlightAnnotation = {
          id, type: "highlight", page: pageNum,
          rects: [{ x: Math.min(startX, pos.x), y: Math.min(startY, pos.y), width: Math.abs(width), height: Math.abs(height) }],
          color: highlightColor, opacity: 0.4,
        };
        onAnnotationAdd(ann);
      } else {
        redrawAnnotations();
      }
    } else if (tool === "rectangle" && rectRef.current?.active) {
      const { startX, startY, id } = rectRef.current;
      rectRef.current = null;
      const width = pos.x - startX;
      const height = pos.y - startY;
      if (Math.abs(width) > 4 && Math.abs(height) > 4) {
        const ann: RectAnnotation = {
          id, type: "rect", page: pageNum,
          x: Math.min(startX, pos.x), y: Math.min(startY, pos.y),
          width: Math.abs(width), height: Math.abs(height),
          color: penColor, fillColor: penColor, lineWidth: penSize, opacity: 1,
        };
        onAnnotationAdd(ann);
      } else {
        redrawAnnotations();
      }
    }
  }, [tool, pageNum, penColor, penSize, highlightColor]);

  function eraseAtPoint(pos: Point) {
    const canvas = drawCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Remove draw annotations that fall near eraser
    const nearby = annotations.filter(a => {
      if (a.type === "draw") {
        return (a as DrawAnnotation).points.some(
          p => Math.hypot(p.x - pos.x, p.y - pos.y) < eraserSize / 2
        );
      }
      if (a.type === "highlight") {
        const r = (a as HighlightAnnotation).rects[0];
        return pos.x >= r.x && pos.x <= r.x + r.width && pos.y >= r.y && pos.y <= r.y + r.height;
      }
      return false;
    });
    nearby.forEach(a => onAnnotationRemove(a.id));
  }

  const handleTextCommit = (id: string, content: string, x: number, y: number) => {
    if (content.trim()) {
      const ann: TextAnnotation = {
        id, type: "text", page: pageNum, x, y,
        content, fontSize: textSize, color: textColor,
        bold: false, italic: false,
      };
      onAnnotationAdd(ann);
    }
    setEditingText(null);
  };

  const textAnnotations = annotations.filter(a => a.type === "text") as TextAnnotation[];
  const commentAnnotations = annotations.filter(a => a.type === "comment") as CommentAnnotation[];

  return (
    <div
      ref={wrapperRef}
      className="pdf-page-wrapper"
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto" }}
      id={`page-${pageNum}`}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />
      <canvas
        ref={drawCanvasRef}
        className={`annotation-overlay ${tool !== "select" && tool !== "hand" ? "interactive" : ""}`}
        style={{ cursor: getCursor() }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Text annotations rendered as DOM elements */}
      {textAnnotations.map(ann => (
        <textarea
          key={ann.id}
          className="text-box"
          defaultValue={ann.content}
          style={{
            left: ann.x, top: ann.y,
            fontSize: ann.fontSize, color: ann.color,
            fontWeight: ann.bold ? "bold" : "normal",
            fontStyle: ann.italic ? "italic" : "normal",
          }}
          onBlur={e => {
            if (e.target.value !== ann.content) {
              onAnnotationUpdate(ann.id, { content: e.target.value } as any);
            }
          }}
          onDoubleClick={e => e.currentTarget.select()}
          rows={1}
        />
      ))}

      {/* Comment pins */}
      {commentAnnotations.map(ann => (
        <div
          key={ann.id}
          className="comment-pin"
          title={ann.content}
          style={{ left: ann.x, top: ann.y }}
          onClick={() => {
            const content = prompt("Edit comment:", ann.content);
            if (content !== null) onAnnotationUpdate(ann.id, { content } as any);
          }}
          onContextMenu={e => { e.preventDefault(); onAnnotationRemove(ann.id); }}
        />
      ))}

      {/* Active text input */}
      {editingText && (
        <textarea
          className="text-box"
          autoFocus
          style={{
            left: editingText.x, top: editingText.y,
            fontSize: textSize, color: textColor,
            border: "2px solid #4f8ef7",
            background: "rgba(255,255,255,0.95)",
            borderRadius: 3, zIndex: 50,
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
});

export default PDFPage;
