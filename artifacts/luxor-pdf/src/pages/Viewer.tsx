import {
  useState, useCallback, useRef, useEffect, useMemo
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import Toolbar from "@/components/Toolbar";
import Sidebar from "@/components/Sidebar";
import PDFPage from "@/components/PDFPage";
import { useAnnotations } from "@/lib/useAnnotations";
import { ToolType } from "@/lib/annotationTypes";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

interface ViewerProps {
  file: File;
  onClose: () => void;
}

export default function Viewer({ file, onClose }: ViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [tool, setTool] = useState<ToolType>("hand");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [penColor, setPenColor] = useState("#1a1a1a");
  const [penSize, setPenSize] = useState(3);
  const [highlightColor, setHighlightColor] = useState("#FFE066");
  const [eraserSize, setEraserSize] = useState(20);
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [textSize, setTextSize] = useState(14);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, getPageAnnotations } = useAnnotations();

  // Load PDF
  useEffect(() => {
    if (!file) return;
    setLoading(true);
    const url = URL.createObjectURL(file);

    pdfjsLib.getDocument({ url }).promise.then(doc => {
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setLoading(false);
    }).catch(err => {
      console.error("PDF load error:", err);
      setLoading(false);
    });

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "h") setTool("hand");
      if (e.key === "s") setTool("select");
      if (e.key === "p") setTool("pencil");
      if (e.key === "e") setTool("eraser");
      if (e.key === "t") setTool("text");
      if (e.key === "r") setTool("rectangle");
      if (e.key === "c") setTool("comment");
      if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) handleRedo();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(5, z + 0.15));
      if (e.key === "-") setZoom(z => Math.max(0.25, z - 0.15));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages]);

  // History management for undo/redo
  const handleAnnotationAdd = useCallback((annotation: any) => {
    addAnnotation(annotation);
    setHistory(h => [...h.slice(0, historyIndex + 1), annotation.id]);
    setHistoryIndex(i => i + 1);
  }, [addAnnotation, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const id = history[historyIndex];
    removeAnnotation(id);
    setHistoryIndex(i => i - 1);
  }, [history, historyIndex, removeAnnotation]);

  const handleRedo = useCallback(() => {
    // Simplified redo: not full redo stack for now
  }, []);

  const handleOpenFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      onClose();
      setTimeout(() => {
        // Parent will get new file from onClose -> they set new file
      }, 0);
    }
    e.target.value = "";
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePageVisible = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const allPageNums = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  if (loading) {
    return (
      <div className="loading-scr">
        <div className="spinner" />
        <p>Loading {file.name}…</p>
      </div>
    );
  }

  return (
    <>
      <Toolbar
        fileName={file.name}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        tool={tool}
        sidebarOpen={sidebarOpen}
        penColor={penColor}
        penSize={penSize}
        highlightColor={highlightColor}
        eraserSize={eraserSize}
        textColor={textColor}
        textSize={textSize}
        onPageChange={page => {
          setCurrentPage(page);
          document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onZoomChange={setZoom}
        onToolChange={setTool}
        onSidebarToggle={() => setSidebarOpen(o => !o)}
        onOpenFile={handleOpenFile}
        onPenColorChange={setPenColor}
        onPenSizeChange={setPenSize}
        onHighlightColorChange={setHighlightColor}
        onEraserSizeChange={setEraserSize}
        onTextColorChange={setTextColor}
        onTextSizeChange={setTextSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex >= 0}
        canRedo={false}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />

      <Sidebar
        open={sidebarOpen}
        pdfDocument={pdfDoc}
        currentPage={currentPage}
        onPageChange={page => {
          setCurrentPage(page);
          document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div className={`luxor-viewer ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {pdfDoc && allPageNums.map(pageNum => (
          <PDFPage
            key={pageNum}
            pdfDocument={pdfDoc}
            pageNum={pageNum}
            zoom={zoom}
            tool={tool}
            annotations={getPageAnnotations(pageNum)}
            penColor={penColor}
            penSize={penSize}
            highlightColor={highlightColor}
            eraserSize={eraserSize}
            textColor={textColor}
            textSize={textSize}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={updateAnnotation}
            onAnnotationRemove={removeAnnotation}
            isCurrentPage={pageNum === currentPage}
            onVisible={handlePageVisible}
          />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
