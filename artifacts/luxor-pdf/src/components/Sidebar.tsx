import { useEffect, useRef, memo } from "react";

interface SidebarProps {
  open: boolean;
  pdfDocument: any | null;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const ThumbnailItem = memo(function ThumbnailItem({
  pdfDocument,
  pageNum,
  isActive,
  onPageChange,
}: {
  pdfDocument: any;
  pageNum: number;
  isActive: boolean;
  onPageChange: (p: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || renderedRef.current) return;
    renderedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const vp = page.getViewport({ scale: 0.18 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
      } catch {
        /* ignore */
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDocument, pageNum]);

  return (
    <div
      className={`thumb-item ${isActive ? "active" : ""}`}
      onClick={() => onPageChange(pageNum)}
    >
      <canvas ref={canvasRef} className="thumb-canvas" />
      <span className="thumb-label">{pageNum}</span>
    </div>
  );
});

export default function Sidebar({ open, pdfDocument, currentPage, onPageChange }: SidebarProps) {
  const totalPages = pdfDocument?.numPages ?? 0;

  return (
    <div className={`luxor-sidebar ${open ? "" : "hidden"}`}>
      <div className="sidebar-tab-row">
        <button className="sidebar-tab active">Pages</button>
      </div>
      {pdfDocument && Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <ThumbnailItem
          key={n}
          pdfDocument={pdfDocument}
          pageNum={n}
          isActive={n === currentPage}
          onPageChange={onPageChange}
        />
      ))}
      {!pdfDocument && (
        <div style={{ padding: 20, color: "#555", fontSize: 12, textAlign: "center" }}>
          Open a PDF to see pages
        </div>
      )}
    </div>
  );
}
