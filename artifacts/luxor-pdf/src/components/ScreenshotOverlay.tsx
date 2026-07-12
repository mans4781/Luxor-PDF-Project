import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Edit → Screenshot. A snipping-tool style overlay: the user drags a
 * rectangle over the PDF, and the selected region is cropped straight
 * from the rendered page bitmap (`.pdf-page-canvas`) into a PNG. Because
 * we read the crop from the canvas element's own bitmap — not from the
 * screen — this overlay sitting on top does not appear in the capture.
 *
 * Coordinate mapping: the drag rect is in client (CSS) pixels. Each page
 * canvas is rendered at a physical scale of at least `zoom * dpr` (with a
 * supersampling floor and pixel cap) and rotation baked
 * into the viewport, so its `.width`/`.height` are device pixels while
 * `getBoundingClientRect()` gives the on-screen CSS box. Scaling by
 * `canvas.width / rect.width` maps the selection back into bitmap space
 * correctly regardless of zoom, DPR, or rotation.
 */

interface Rect { x: number; y: number; w: number; h: number; }

interface Stroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

/** Pen swatches for marking up a captured screenshot. */
const PEN_COLORS = ["#E23636", "#0D62F2", "#12A150", "#F5A623", "#9B51E0", "#111111", "#FFFFFF"];

interface ScreenshotOverlayProps {
  /** Original PDF file name, used to build the download filename. */
  fileName: string;
  /** The page currently in view — used as the capture fallback + filename. */
  currentPage: number;
  onClose: () => void;
}

const MIN_SIZE = 6; // px — ignore accidental clicks / tiny drags

function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return base.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "document";
}

export default function ScreenshotOverlay({ fileName, currentPage, onClose }: ScreenshotOverlayProps) {
  // Live drag state (null when not dragging). `selRef` mirrors it so the
  // pointer-up handler reads the final geometry synchronously — React state
  // updates are batched, so a fast drag-release could otherwise read a stale
  // or null `sel` and miss the capture.
  const [sel, setSel] = useState<Rect | null>(null);
  const selRef = useRef<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  // Finished capture: PNG data URL + the page it came from.
  const [preview, setPreview] = useState<{ url: string; page: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Markup (paint) state ───────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [penColor, setPenColor] = useState("#E23636");
  const [penWidth, setPenWidth] = useState(4);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // The captured PNG must be decoded before the canvas holds real pixels;
  // export + drawing are gated on this so we never emit a blank canvas.
  const [imageReady, setImageReady] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const liveStrokeRef = useRef<Stroke | null>(null);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length === 0) return;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.01, s.points[0].y + 0.01);
    ctx.stroke();
  }, []);

  /** Repaint the preview canvas: base screenshot + all committed strokes. */
  const redrawPreview = useCallback(() => {
    const cv = previewCanvasRef.current;
    const img = previewImgRef.current;
    if (!cv || !img) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    for (const s of strokes) drawStroke(ctx, s);
  }, [strokes, drawStroke]);

  // Load the captured PNG into an Image once per capture. The cancelled
  // flag stops a late onload from an older capture clobbering a newer one.
  useEffect(() => {
    previewImgRef.current = null;
    setImageReady(false);
    setStrokes([]);
    setEditMode(false);
    if (!preview) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      previewImgRef.current = img;
      setImageReady(true);
    };
    img.src = preview.url;
    return () => { cancelled = true; };
  }, [preview]);

  // Repaint whenever the base image becomes ready or strokes change.
  useEffect(() => { if (imageReady) redrawPreview(); }, [imageReady, redrawPreview]);

  /** Map a pointer event to canvas-bitmap coordinates. */
  const toCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = previewCanvasRef.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (cv.width / r.width),
      y: (e.clientY - r.top) * (cv.height / r.height),
    };
  };

  const onDrawDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editMode || !imageReady || e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = toCanvasPoint(e);
    liveStrokeRef.current = { color: penColor, width: penWidth, points: [p] };
    const ctx = previewCanvasRef.current?.getContext("2d");
    if (ctx && liveStrokeRef.current) drawStroke(ctx, liveStrokeRef.current);
  };
  const onDrawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = liveStrokeRef.current;
    if (!editMode || !s) return;
    const p = toCanvasPoint(e);
    const prev = s.points[s.points.length - 1];
    s.points.push(p);
    const ctx = previewCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };
  const onDrawUp = () => {
    const s = liveStrokeRef.current;
    liveStrokeRef.current = null;
    if (s && s.points.length > 0) setStrokes(list => [...list, s]);
  };

  /** Current preview (with markup) as a PNG data URL. */
  const exportUrl = useCallback((): string | null => {
    const cv = previewCanvasRef.current;
    // Only trust the canvas once the base image has actually been painted;
    // otherwise fall back to the raw capture so Save/Copy are never blank.
    if (imageReady && cv && cv.width > 0) return cv.toDataURL("image/png");
    return preview?.url ?? null;
  }, [preview, imageReady]);

  const finishSelection = useCallback((rect: Rect) => {
    if (rect.w < MIN_SIZE || rect.h < MIN_SIZE) { setSel(null); return; }

    // Pick the page canvas that overlaps the selection the most. Using the
    // largest intersection area (rather than the selection centre) keeps the
    // right page when the centre lands in the gutter between pages or the
    // selection straddles a page boundary in continuous scroll.
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>(".pdf-page-canvas"),
    );
    let target: HTMLCanvasElement | null = null;
    let targetRect: DOMRect | null = null;
    let bestArea = 0;
    for (const cv of canvases) {
      const r = cv.getBoundingClientRect();
      const ow = Math.max(0, Math.min(rect.x + rect.w, r.right) - Math.max(rect.x, r.left));
      const oh = Math.max(0, Math.min(rect.y + rect.h, r.bottom) - Math.max(rect.y, r.top));
      const area = ow * oh;
      if (area > bestArea) { bestArea = area; target = cv; targetRect = r; }
    }
    if ((!target || !targetRect) ) {
      // No overlap with any page — fall back to the current page.
      const fallback = document.querySelector<HTMLCanvasElement>(
        `#page-${currentPage} .pdf-page-canvas`,
      );
      if (fallback) { target = fallback; targetRect = fallback.getBoundingClientRect(); }
    }
    if (!target || !targetRect) {
      setError("Couldn't find a PDF page under that area. Try again over the page.");
      setSel(null);
      return;
    }

    // Which page did we capture? (from the wrapper id `page-N`)
    const wrapperId = target.closest("[id^='page-']")?.id ?? "";
    const capturedPage = Number(wrapperId.replace("page-", "")) || currentPage;

    // Intersect the selection with the canvas box (clamp to on-screen area).
    const ix = Math.max(rect.x, targetRect.left);
    const iy = Math.max(rect.y, targetRect.top);
    const ix2 = Math.min(rect.x + rect.w, targetRect.right);
    const iy2 = Math.min(rect.y + rect.h, targetRect.bottom);
    const iw = ix2 - ix;
    const ih = iy2 - iy;
    if (iw < MIN_SIZE || ih < MIN_SIZE) {
      setError("That selection was outside the page. Try again over the page.");
      setSel(null);
      return;
    }

    const scaleX = target.width / targetRect.width;
    const scaleY = target.height / targetRect.height;
    const sx = Math.max(0, Math.round((ix - targetRect.left) * scaleX));
    const sy = Math.max(0, Math.round((iy - targetRect.top) * scaleY));
    const sw = Math.min(target.width - sx, Math.round(iw * scaleX));
    const sh = Math.min(target.height - sy, Math.round(ih * scaleY));
    if (sw <= 0 || sh <= 0) { setSel(null); return; }

    try {
      const out = document.createElement("canvas");
      out.width = sw; out.height = sh;
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("no-2d-context");
      // White backdrop so any transparent PDF regions read as white, not black.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sw, sh);
      ctx.drawImage(target, sx, sy, sw, sh, 0, 0, sw, sh);
      const url = out.toDataURL("image/png");
      setPreview({ url, page: capturedPage });
      setCopied(false);
      setError(null);
    } catch {
      setError("Couldn't capture this page (it may be protected).");
    }
    setSel(null);
  }, [currentPage]);

  // ── Drag handlers (only active before a preview is captured) ──────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (preview) return;
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    const r = { x: e.clientX, y: e.clientY, w: 0, h: 0 };
    selRef.current = r;
    setSel(r);
    setError(null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const s = startRef.current;
    const r = {
      x: Math.min(s.x, e.clientX),
      y: Math.min(s.y, e.clientY),
      w: Math.abs(e.clientX - s.x),
      h: Math.abs(e.clientY - s.y),
    };
    selRef.current = r;
    setSel(r);
  };
  const onPointerUp = () => {
    const s = startRef.current;
    const r = selRef.current;
    startRef.current = null;
    if (s && r) finishSelection(r);
  };
  const onPointerCancel = () => {
    startRef.current = null;
    selRef.current = null;
    setSel(null);
  };

  // Esc cancels the whole tool (or dismisses the preview back to selecting).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (preview) setPreview(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [preview, onClose]);

  const download = useCallback(() => {
    if (!preview) return;
    const url = exportUrl();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(fileName)}-screenshot-p${preview.page}.png`;
    a.click();
  }, [preview, fileName, exportUrl]);

  const copy = useCallback(async () => {
    if (!preview) return;
    try {
      const url = exportUrl();
      if (!url) throw new Error("no-image");
      const blob = await (await fetch(url)).blob();
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("unsupported");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy isn't supported in this browser — use Save instead.");
    }
  }, [preview, exportUrl]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9300,
        cursor: preview ? "default" : "crosshair",
        userSelect: "none",
      }}
    >
      {/* Dimmed capture surface (hidden once a preview exists). */}
      {!preview && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }}
        >
          {/* Instruction banner */}
          <div
            style={{
              position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
              background: "#1a1a1a", color: "#fff", fontSize: 13, fontWeight: 500,
              padding: "9px 16px", borderRadius: 999, display: "flex", gap: 14,
              alignItems: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              whiteSpace: "nowrap", pointerEvents: "none",
            }}
          >
            <span>Drag to capture an area of the PDF</span>
            <span style={{ opacity: 0.55 }}>·</span>
            <span style={{ opacity: 0.8 }}>Esc to cancel</span>
          </div>

          {error && (
            <div
              style={{
                position: "absolute", top: 62, left: "50%", transform: "translateX(-50%)",
                background: "#c0392b", color: "#fff", fontSize: 12.5, fontWeight: 500,
                padding: "7px 14px", borderRadius: 8, pointerEvents: "none",
              }}
            >{error}</div>
          )}

          {/* Live selection rectangle — a clear "hole" with a bright border. */}
          {sel && sel.w > 0 && sel.h > 0 && (
            <div
              style={{
                position: "absolute",
                left: sel.x, top: sel.y, width: sel.w, height: sel.h,
                border: "2px solid #0D62F2",
                boxShadow: "0 0 0 100000px rgba(0,0,0,0.35)",
                background: "rgba(13,98,242,0.08)",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  position: "absolute", top: -22, left: 0,
                  background: "#0D62F2", color: "#fff", fontSize: 11, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap",
                }}
              >{Math.round(sel.w)} × {Math.round(sel.h)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Preview modal ─────────────────────────────────────────────── */}
      {preview && (
        <div
          onClick={onClose}
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", color: "#1a1a1a", borderRadius: 12,
              padding: 18, maxWidth: "92vw", maxHeight: "92vh",
              display: "flex", flexDirection: "column", gap: 14,
              boxShadow: "0 16px 50px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Screenshot · page {preview.page}</div>
              <button
                onClick={onClose}
                title="Close"
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "#666", display: "inline-flex", padding: 4, borderRadius: 6,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                maxHeight: "60vh", overflow: "auto",
              }}
            >
              <canvas
                ref={previewCanvasRef}
                onPointerDown={onDrawDown}
                onPointerMove={onDrawMove}
                onPointerUp={onDrawUp}
                onPointerCancel={onDrawUp}
                aria-label={`Screenshot of page ${preview.page}`}
                style={{
                  maxWidth: "100%", maxHeight: "56vh", display: "block",
                  cursor: editMode ? "crosshair" : "default",
                  touchAction: editMode ? "none" : "auto",
                  outline: editMode ? "2px dashed rgba(226,54,54,0.55)" : "none",
                  outlineOffset: 2,
                }}
              />
            </div>

            {editMode && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {PEN_COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => setPenColor(c)}
                      title={c}
                      style={{
                        width: 18, height: 18, borderRadius: "50%", background: c,
                        cursor: "pointer", boxSizing: "border-box",
                        border: penColor === c ? "2.5px solid #E23636" : "1.5px solid rgba(0,0,0,0.25)",
                        boxShadow: penColor === c ? "0 0 0 2px #fff inset" : "none",
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={penColor}
                    onChange={e => setPenColor(e.target.value)}
                    title="Custom pen color"
                    style={{
                      width: 24, height: 24, padding: 0, border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: 5, background: "none", cursor: "pointer",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#555" }}>Thickness</span>
                  <input
                    type="range" min={1} max={24} value={penWidth}
                    onChange={e => setPenWidth(Number(e.target.value))}
                    style={{ width: 90, cursor: "pointer" }}
                  />
                  <span
                    style={{
                      width: 26, height: 26, display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{
                      width: Math.min(24, penWidth + 2), height: Math.min(24, penWidth + 2),
                      borderRadius: "50%", background: penColor,
                      border: "1px solid rgba(0,0,0,0.15)",
                    }} />
                  </span>
                </div>

                <div style={{ flex: 1 }} />

                <button
                  onClick={() => setStrokes(list => list.slice(0, -1))}
                  disabled={strokes.length === 0}
                  title="Undo last stroke"
                  style={{
                    background: "#fff", color: strokes.length ? "#1a1a1a" : "#aaa",
                    border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
                    padding: "6px 12px", fontSize: 12.5, fontWeight: 500,
                    cursor: strokes.length ? "pointer" : "default",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>
                  Undo
                </button>
                <button
                  onClick={() => setStrokes([])}
                  disabled={strokes.length === 0}
                  title="Clear all pen marks"
                  style={{
                    background: "#fff", color: strokes.length ? "#c0392b" : "#aaa",
                    border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
                    padding: "6px 12px", fontSize: 12.5, fontWeight: 500,
                    cursor: strokes.length ? "pointer" : "default",
                  }}
                >Clear</button>
                <button
                  onClick={() => setEditMode(false)}
                  title="Finish editing"
                  style={{
                    background: "#12A150", color: "#fff", border: "none", borderRadius: 6,
                    padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  }}
                >Done</button>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12.5, color: "#c0392b", fontWeight: 500 }}>{error}</div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => { setPreview(null); setError(null); }}
                style={{
                  background: "#fff", color: "#1a1a1a",
                  border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 9 8 9"/></svg>
                Retake
              </button>
              <button
                onClick={() => setEditMode(m => !m)}
                title="Draw on the screenshot with a pen"
                style={{
                  background: editMode ? "rgba(226,54,54,0.1)" : "#fff",
                  color: editMode ? "#E23636" : "#1a1a1a",
                  border: editMode ? "1px solid rgba(226,54,54,0.55)" : "1px solid rgba(0,0,0,0.2)",
                  borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                {editMode ? "Editing…" : "Edit"}
              </button>
              <button
                onClick={copy}
                style={{
                  background: "#fff", color: "#0D62F2",
                  border: "1px solid rgba(13,98,242,0.4)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={download}
                style={{
                  background: "#0D62F2", color: "#fff",
                  border: "none", borderRadius: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 7,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Save PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
