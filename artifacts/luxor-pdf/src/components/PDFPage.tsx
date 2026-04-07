import { useRef, useEffect, useState } from "react";

interface PDFPageProps {
  pdfDocument: any;
  pageNum: number;
  zoom: number;
  isCurrentPage: boolean;
  onVisible: (page: number) => void;
}

const PDFPage = function PDFPage({ pdfDocument, pageNum, zoom, onVisible }: PDFPageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const renderTaskRef = useRef<any>(null);

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

        const ctx = canvas.getContext("2d")!;
        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDocument, pageNum, zoom]);

  return (
    <div
      ref={wrapperRef}
      className="pdf-page-wrapper"
      style={{ width: pageSize.w || "auto", height: pageSize.h || "auto" }}
      id={`page-${pageNum}`}
    >
      <canvas ref={pageCanvasRef} className="pdf-page-canvas" />
    </div>
  );
};

export default PDFPage;
