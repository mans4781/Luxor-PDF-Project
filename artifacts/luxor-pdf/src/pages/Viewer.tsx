import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import Toolbar from "@/components/Toolbar";
import PDFPage from "@/components/PDFPage";
import { useAnnotations } from "@/lib/useAnnotations";
import { ToolType } from "@/lib/annotationTypes";

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
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<ToolType>("hand");
  const [highlightColor, setHighlightColor] = useState("#FFE566");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [textSize, setTextSize] = useState(16);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, getPageAnnotations } = useAnnotations();

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
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(5, z + 0.15));
      if (e.key === "-") setZoom(z => Math.max(0.25, z - 0.15));
      if (e.key === "Escape") { setTool("hand"); speechSynthesis.cancel(); setIsSpeaking(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages]);

  // Stop speech on unmount
  useEffect(() => () => speechSynthesis.cancel(), []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageVisible = useCallback((page: number) => setCurrentPage(page), []);

  // ── Feature 4: Read Aloud ────────────────────────────────────────────────
  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ").trim();
      if (!text) { alert("No readable text found on this page."); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (err) {
      console.error("Read aloud error:", err);
    }
  }, [isSpeaking, pdfDoc, currentPage]);

  const handleOpenFile = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") { speechSynthesis.cancel(); onClose(); }
    e.target.value = "";
  };
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
  };

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
        highlightColor={highlightColor}
        textColor={textColor}
        textSize={textSize}
        isSpeaking={isSpeaking}
        onPageChange={handlePageChange}
        onZoomChange={setZoom}
        onToolChange={setTool}
        onHighlightColorChange={setHighlightColor}
        onTextColorChange={setTextColor}
        onTextSizeChange={setTextSize}
        onEraseAll={clearHighlights}
        onReadAloud={handleReadAloud}
        onOpenFile={handleOpenFile}
        onDownload={handleDownload}
        onPrint={() => window.print()}
      />

      <div className="luxor-viewer">
        {pdfDoc && allPageNums.map(pageNum => (
          <PDFPage
            key={pageNum}
            pdfDocument={pdfDoc}
            pageNum={pageNum}
            zoom={zoom}
            tool={tool}
            annotations={getPageAnnotations(pageNum)}
            highlightColor={highlightColor}
            textColor={textColor}
            textSize={textSize}
            onAnnotationAdd={addAnnotation}
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
