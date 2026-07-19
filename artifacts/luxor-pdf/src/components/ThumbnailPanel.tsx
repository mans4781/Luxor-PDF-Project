import { useEffect, useRef, useState } from "react";

interface ThumbnailPanelProps {
  pdfDoc: any;
  totalPages: number;
  currentPage: number;
  rotation: number;
  onPageChange: (page: number) => void;
  onCollapse?: () => void;
}

function PageThumb({
  pdfDoc,
  pageNum,
  rotation,
  isActive,
  onClick,
}: {
  pdfDoc: any;
  pageNum: number;
  rotation: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const taskRef = useRef<any>(null);

  // Lazy render: only paint the thumbnail once it scrolls near the
  // visible part of the panel. With hundreds of pages, rendering every
  // thumbnail eagerly would compete with the main page renders and hang
  // the UI on open.
  const [inView, setInView] = useState(pageNum <= 12);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setInView(true); },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !inView) return;
    let cancelled = false;

    (async () => {
      try {
        if (taskRef.current) { taskRef.current.cancel(); taskRef.current = null; }
        const page = await pdfDoc.getPage(pageNum);
        const totalRot = ((page.rotate ?? 0) + rotation) % 360;
        const viewport = page.getViewport({ scale: 0.22, rotation: totalRot });
        const canvas = canvasRef.current!;
        if (cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        const task = page.render({ canvasContext: ctx, viewport });
        taskRef.current = task;
        await task.promise;
        taskRef.current = null;
        if (!cancelled) setRendered(true);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();

    return () => {
      cancelled = true;
      taskRef.current?.cancel?.();
    };
  }, [pdfDoc, pageNum, rotation, inView]);

  return (
    <div
      ref={wrapRef}
      className={`thumb-item${isActive ? " thumb-active" : ""}`}
      onClick={onClick}
      title={`Page ${pageNum}`}
    >
      <div className="thumb-canvas-wrap">
        {!rendered && <div className="thumb-placeholder" />}
        <canvas ref={canvasRef} className="thumb-canvas" />
      </div>
      <span className="thumb-label">{pageNum}</span>
    </div>
  );
}

export default function ThumbnailPanel({
  pdfDoc,
  totalPages,
  currentPage,
  rotation,
  onPageChange,
  onCollapse,
}: ThumbnailPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll active thumbnail into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`.thumb-active`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="thumb-panel">
      <div className="thumb-panel-header">
        <span>Pages</span>
        {onCollapse && (
          <button
            className="thumb-collapse-btn"
            title="Collapse panel"
            aria-label="Collapse thumbnails panel"
            onClick={onCollapse}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 6l-6 6 6 6" />
            </svg>
          </button>
        )}
      </div>
      <div className="thumb-list" ref={listRef}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <PageThumb
            key={`${n}-${rotation}`}
            pdfDoc={pdfDoc}
            pageNum={n}
            rotation={rotation}
            isActive={n === currentPage}
            onClick={() => onPageChange(n)}
          />
        ))}
      </div>
    </div>
  );
}
