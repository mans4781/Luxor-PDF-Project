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
    const a = document.createElement("a");
    a.href = preview.url;
    a.download = `${baseName(fileName)}-screenshot-p${preview.page}.png`;
    a.click();
  }, [preview, fileName]);

  const copy = useCallback(async () => {
    if (!preview) return;
    try {
      const blob = await (await fetch(preview.url)).blob();
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("unsupported");
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Copy isn't supported in this browser — use Download instead.");
    }
  }, [preview]);

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
                maxHeight: "64vh", overflow: "auto",
                background: "#f4f4f5", borderRadius: 8, padding: 10,
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={preview.url}
                alt={`Screenshot of page ${preview.page}`}
                style={{ maxWidth: "100%", maxHeight: "60vh", display: "block", borderRadius: 4 }}
              />
            </div>

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
                }}
              >Retake</button>
              <button
                onClick={copy}
                style={{
                  background: "#fff", color: "#0D62F2",
                  border: "1px solid rgba(13,98,242,0.4)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >{copied ? "Copied!" : "Copy image"}</button>
              <button
                onClick={download}
                style={{
                  background: "#0D62F2", color: "#fff",
                  border: "none", borderRadius: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Download PNG</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
