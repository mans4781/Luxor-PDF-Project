import { useRef, useEffect, useState, useCallback } from "react";
import { TextLayer } from "pdfjs-dist";
import { Annotation, HighlightAnnotation, TextAnnotation, ToolType } from "@/lib/annotationTypes";

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
  onAnnotationAdd: (a: Annotation) => void;
  onAnnotationUpdate: (id: string, updates: Partial<Annotation>) => void;
  onAnnotationRemove: (id: string) => void;
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
  onDelete: () => void;
}

function DraggableTextBox({ ann, onMove, onContentChange, onDelete }: TextBoxProps) {
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
          style={{
            position: "absolute",
            top: -22,
            left: 0,
            right: 0,
            height: 22,
            background: "#4f8ef7",
            borderRadius: "4px 4px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 6px",
          }}
        >
          {/* Grip area */}
          <div
            onMouseDown={startDrag}
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 3, cursor: "grab", height: "100%" }}
            title="Drag to move"
          >
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.75)" }} />
            ))}
          </div>
          {/* Delete button */}
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete text box"
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.9)", cursor: "pointer",
              fontSize: 14, lineHeight: 1, padding: "0 2px",
              display: "flex", alignItems: "center",
              borderRadius: 3,
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
function highlightTextInLayer(container: HTMLElement, term: string) {
  // Remove previous search highlights
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

export default function PDFPage({
  pdfDocument, pageNum, zoom, rotation, searchTerm, tool, annotations,
  highlightColor, textColor, textSize,
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

  // ── Custom text selection (Adobe / Edge style) ────────────────────────────
  // We store the drag start as RAW clientX/Y so we can always re-resolve it
  // relative to the CURRENT wrapper rect on every mousemove — this means
  // scrolling and any zoom level work perfectly.
  const selClientStartRef = useRef<{ x: number; y: number } | null>(null);
  const selTextRef = useRef("");
  const [selBoxes, setSelBoxes] = useState<{ left: number; top: number; width: number; height: number }[]>([]);
  const [copiedToast, setCopiedToast] = useState(false);

  function computeSpanSelection(
    startClient: { x: number; y: number },
    endClient:   { x: number; y: number }
  ) {
    if (!textLayerRef.current || !wrapperRef.current) return { boxes: [], text: "" };

    // Re-resolve both endpoints against the CURRENT wrapper rect on every call
    const wRect = wrapperRef.current.getBoundingClientRect();
    const sx = startClient.x - wRect.left;
    const sy = startClient.y - wRect.top;
    const ex = endClient.x   - wRect.left;
    const ey = endClient.y   - wRect.top;

    // Skip bare clicks
    if (Math.abs(sx - ex) < 3 && Math.abs(sy - ey) < 3) return { boxes: [], text: "" };

    // Canonical direction: "first" = top of drag, "last" = bottom
    const draggingDown  = sy <= ey;
    const startAnchorX  = draggingDown ? sx : ex; // x where selection opens
    const endAnchorX    = draggingDown ? ex : sx; // x where selection closes
    const firstY        = draggingDown ? sy : ey; // y of the selection start
    const lastY         = draggingDown ? ey : sy; // y of the selection end

    // ── Step 1: measure every span on this page ───────────────────────────
    type SI = { sl: number; st: number; sr: number; sb: number; cy: number; t: string };
    const rawSpans = Array.from(
      textLayerRef.current.querySelectorAll<HTMLElement>("span:not(.endOfContent)")
    );
    const all: SI[] = [];
    for (const span of rawSpans) {
      const t = span.textContent ?? "";
      if (!t.trim()) continue;
      const r  = span.getBoundingClientRect();
      const sl = r.left   - wRect.left;
      const st = r.top    - wRect.top;
      const sr = r.right  - wRect.left;
      const sb = r.bottom - wRect.top;
      all.push({ sl, st, sr, sb, cy: (st + sb) / 2, t });
    }
    if (all.length === 0) return { boxes: [], text: "" };

    // ── Step 2: find which visual line the drag start/end land on ─────────
    // "Line" = group of spans with similar vertical centre (cy).
    // We locate the span whose cy is closest to firstY / lastY, then use
    // that cy as the canonical y for that line.  All spans within ±lineThresh
    // of that cy are considered to be on the same line.
    const lineThresh = zoom * 8; // ≈ half a line height at any zoom level

    function nearestCy(targetY: number): number {
      let best = all[0];
      let bestD = Math.abs(best.cy - targetY);
      for (const s of all) {
        const d = Math.abs(s.cy - targetY);
        if (d < bestD) { bestD = d; best = s; }
      }
      return best.cy;
    }

    const firstLineCy = nearestCy(firstY);
    const lastLineCy  = nearestCy(lastY);
    const singleLine  = Math.abs(firstLineCy - lastLineCy) < lineThresh;

    // ── Step 3: classify every span ──────────────────────────────────────
    // • On first line  → include if right edge is past the start anchor x
    // • On last line   → include if left  edge is before the end anchor x
    // • Both (single-line drag) → must lie inside [min(anchors), max(anchors)]
    // • Strictly between the two lines (middle) → always include (full width)
    // • Before first line or after last line → exclude
    const selected: SI[] = [];

    for (const s of all) {
      const onFirst  = Math.abs(s.cy - firstLineCy) < lineThresh;
      const onLast   = Math.abs(s.cy - lastLineCy)  < lineThresh;
      const inMiddle = s.cy > firstLineCy + lineThresh &&
                       s.cy < lastLineCy  - lineThresh;

      if (singleLine) {
        // Single-line: both anchors are on the same line
        const selL = Math.min(startAnchorX, endAnchorX);
        const selR = Math.max(startAnchorX, endAnchorX);
        if (onFirst && s.sr > selL && s.sl < selR) selected.push(s);
      } else if (onFirst && onLast) {
        // Shouldn't happen when !singleLine, but be safe
        selected.push(s);
      } else if (onFirst) {
        if (s.sr > startAnchorX) selected.push(s);   // right of start cursor
      } else if (onLast) {
        if (s.sl < endAnchorX) selected.push(s);     // left of end cursor
      } else if (inMiddle) {
        selected.push(s);                             // middle: full width
      }
      // else: outside the selection range → ignore
    }

    if (selected.length === 0) return { boxes: [], text: "" };

    // ── Step 4: group selected spans into visual lines ────────────────────
    selected.sort((a, b) => a.cy - b.cy || a.sl - b.sl);
    type Line = { top: number; bot: number; items: SI[] };
    const lines: Line[] = [];
    for (const s of selected) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(s.cy - (last.top + last.bot) / 2) < lineThresh) {
        last.items.push(s);
        last.top = Math.min(last.top, s.st);
        last.bot = Math.max(last.bot, s.sb);
      } else {
        lines.push({ top: s.st, bot: s.sb, items: [s] });
      }
    }

    // ── Step 5: build one highlight box per line ──────────────────────────
    const boxes: { left: number; top: number; width: number; height: number }[] = [];
    const texts: string[] = [];
    for (const line of lines) {
      line.items.sort((a, b) => a.sl - b.sl);
      const left   = Math.min(...line.items.map(s => s.sl));
      const right  = Math.max(...line.items.map(s => s.sr));
      boxes.push({ left, top: line.top, width: right - left, height: line.bot - line.top });
      texts.push(line.items.map(s => s.t).join(""));
    }

    return { boxes, text: texts.join("\n").trim() };
  }

  /**
   * On mousedown we attach DOCUMENT-level listeners so selection is never
   * interrupted by the mouse leaving the page wrapper or a sibling element.
   */
  const handleSelMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();

    // Store the raw viewport coords
    selClientStartRef.current = { x: e.clientX, y: e.clientY };
    selTextRef.current = "";
    setSelBoxes([]);

    const onMove = (ev: MouseEvent) => {
      if (!selClientStartRef.current) return;
      const { boxes, text } = computeSpanSelection(
        selClientStartRef.current,
        { x: ev.clientX, y: ev.clientY }
      );
      setSelBoxes(boxes);
      selTextRef.current = text;
    };

    const onUp = () => {
      const txt = selTextRef.current.trim();
      if (txt) {
        navigator.clipboard.writeText(txt).then(() => {
          setCopiedToast(true);
          setTimeout(() => setCopiedToast(false), 1800);
        }).catch(() => {});
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // Ctrl+C re-copies the last selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selTextRef.current.trim()) {
        navigator.clipboard.writeText(selTextRef.current.trim()).catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // Render PDF page — renders at 2× minimum for HD sharpness
  useEffect(() => {
    if (!pdfDocument || !pageCanvasRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        const page = await pdfDocument.getPage(pageNum);
        // Use at least 2× DPR to guarantee crisp, HD-quality text & images
        const dpr = Math.max(2, window.devicePixelRatio || 1);
        // Combine page's native rotation with user-applied rotation
        const totalRotation = ((page.rotate ?? 0) + rotation) % 360;

        // Render at physical pixels (zoom × dpr) for crispness
        const viewport = page.getViewport({ scale: zoom * dpr, rotation: totalRotation });
        const cssW = viewport.width / dpr;
        const cssH = viewport.height / dpr;

        const canvas = pageCanvasRef.current!;
        if (cancelled) return;

        // Physical canvas size = full resolution
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // CSS size = logical size so it doesn't appear zoomed
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;

        if (drawCanvasRef.current) {
          drawCanvasRef.current.width = viewport.width;
          drawCanvasRef.current.height = viewport.height;
          drawCanvasRef.current.style.width = `${cssW}px`;
          drawCanvasRef.current.style.height = `${cssH}px`;
        }

        // Layout size in logical (CSS) pixels
        setPageSize({ w: cssW, h: cssH });

        const ctx = canvas.getContext("2d")!;
        // High-quality smoothing for sharp text and images at all zoom levels
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
        if (!cancelled) redrawAnnotations();

        // ── Text layer (for text selection) ──────────────────────────────
        if (textLayerRef.current && !cancelled) {
          if (textLayerTaskRef.current) {
            textLayerTaskRef.current.cancel?.();
            textLayerTaskRef.current = null;
          }
          textLayerRef.current.innerHTML = "";
          // Use logical-pixel viewport so text positions match CSS canvas size
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

  // Re-highlight search term whenever it changes or the page re-renders
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

      {/* pdfjs text layer — spans used for search highlight & position queries */}
      <div
        ref={textLayerRef}
        className="textLayer"
        style={{ zIndex: 2, pointerEvents: "none" }}
      />

      {/* Highlight drawing canvas (z-index 3) */}
      <canvas
        ref={drawCanvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          display: "block",
          zIndex: 3,
          pointerEvents: tool === "highlight" ? "all" : "none",
          cursor: tool === "highlight" ? "crosshair" : "inherit",
        }}
        onMouseDown={onHighlightMouseDown}
        onMouseMove={onHighlightMouseMove}
        onMouseUp={onHighlightMouseUp}
        onMouseLeave={onHighlightMouseUp}
      />

      {/* ── Custom text-selection overlay (hand tool) — Adobe / Edge style ── */}
      {tool === "hand" && (
        <div
          style={{
            position: "absolute", inset: 0,
            zIndex: 5,
            cursor: "text",
            userSelect: "none",
          }}
          onMouseDown={handleSelMouseDown}
        >
          {/* Blue selection highlight — opacity scales with zoom */}
          {selBoxes.map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: b.left, top: b.top,
                width: b.width, height: b.height,
                background: `rgba(0, 120, 215, ${Math.min(0.55, Math.max(0.18, 0.30 * (zoom / 1.5))).toFixed(2)})`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* "Copied!" toast */}
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
        </div>
      )}

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
          onDelete={() => onAnnotationRemove(ann.id)}
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
