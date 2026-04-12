import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import Toolbar from "@/components/Toolbar";
import PDFPage from "@/components/PDFPage";
import ThumbnailPanel from "@/components/ThumbnailPanel";
import SearchBar from "@/components/SearchBar";
import { useAnnotations } from "@/lib/useAnnotations";
import { ToolType } from "@/lib/annotationTypes";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// Actual zoom values where 1.5 = "100%" (the new baseline)
const ZOOM_BASE = 1.5;
const ZOOM_PRESETS = [0.375, 0.75, 1.125, 1.5, 1.875, 2.25, 3.0];
const zoomLabel = (z: number) => `${Math.round((z / ZOOM_BASE) * 100)}%`;

interface ViewerProps {
  file: File;
  onClose: () => void;
}

export default function Viewer({ file, onClose }: ViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(ZOOM_BASE);
  const [rotation, setRotation] = useState(0);
  const [showContents, setShowContents] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchList, setSearchMatchList] = useState<number[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<ToolType>("hand");
  const [highlightColor, setHighlightColor] = useState("#FFE566");
  const [textColor, setTextColor] = useState("#1a1a1a");
  const [textSize, setTextSize] = useState(16);
  const [drawColor, setDrawColor] = useState("#1a1a1a");
  const [drawThickness, setDrawThickness] = useState(2);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, undo, getPageAnnotations } = useAnnotations();

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
      // Ctrl+Z / Cmd+Z — undo
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+F / Cmd+F — open search (works even inside inputs)
      if ((e.key === "f" || e.key === "F") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(5, z + 0.15));
      if (e.key === "-") setZoom(z => Math.max(0.25, z - 0.15));
      if (e.key === "Escape") {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(""); return; }
        setTool("hand"); speechSynthesis.cancel(); setIsSpeaking(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages, searchOpen, undo]);

  // Ctrl+Scroll → zoom PDF, not the browser
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.min(5, Math.max(0.25, parseFloat((z + delta).toFixed(2)))));
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, []);

  // Stop speech on unmount
  useEffect(() => () => speechSynthesis.cancel(), []);

  // Scan all pages for search matches whenever query changes
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchMatchList([]);
      setMatchIndex(0);
      return;
    }
    const term = searchQuery.toLowerCase().trim();
    let cancelled = false;

    (async () => {
      const pages: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join("").toLowerCase();
          let idx = 0;
          while ((idx = text.indexOf(term, idx)) !== -1) {
            pages.push(i);
            idx += term.length;
          }
        } catch { /* skip */ }
        if (cancelled) return;
      }
      setSearchMatchList(pages);
      setMatchIndex(0);
      if (pages.length > 0) {
        document.getElementById(`page-${pages[0]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentPage(pages[0]);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, pdfDoc, totalPages]);

  const handleSearchNext = useCallback(() => {
    if (searchMatchList.length === 0) return;
    const next = (matchIndex + 1) % searchMatchList.length;
    setMatchIndex(next);
    const page = searchMatchList[next];
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(page);
  }, [matchIndex, searchMatchList]);

  const handleSearchPrev = useCallback(() => {
    if (searchMatchList.length === 0) return;
    const prev = (matchIndex - 1 + searchMatchList.length) % searchMatchList.length;
    setMatchIndex(prev);
    const page = searchMatchList[prev];
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(page);
  }, [matchIndex, searchMatchList]);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchMatchList([]);
    setMatchIndex(0);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageVisible = useCallback((page: number) => setCurrentPage(page), []);

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

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) handlePageChange(val);
      else if (pageInputRef.current) pageInputRef.current.value = String(currentPage);
    }
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
        tool={tool}
        highlightColor={highlightColor}
        textColor={textColor}
        textSize={textSize}
        isSpeaking={isSpeaking}
        showContents={showContents}
        searchOpen={searchOpen}
        splitView={splitView}
        onToggleContents={() => setShowContents(s => !s)}
        onToggleSearch={() => { setSearchOpen(s => !s); if (searchOpen) { setSearchQuery(""); setSearchMatchList([]); } }}
        onToggleSplit={() => setSplitView(s => !s)}
        onToolChange={setTool}
        onHighlightColorChange={setHighlightColor}
        onTextColorChange={setTextColor}
        onTextSizeChange={setTextSize}
        drawColor={drawColor}
        drawThickness={drawThickness}
        onDrawColorChange={setDrawColor}
        onDrawThicknessChange={setDrawThickness}
        onEraseAll={clearHighlights}
        onReadAloud={handleReadAloud}
        onOpenFile={handleOpenFile}
        onDownload={handleDownload}
        onPrint={() => window.print()}
      />

      {/* ── Search bar ── */}
      {searchOpen && (
        <SearchBar
          query={searchQuery}
          matchIndex={matchIndex}
          totalMatches={searchMatchList.length}
          onQueryChange={setSearchQuery}
          onNext={handleSearchNext}
          onPrev={handleSearchPrev}
          onClose={handleSearchClose}
        />
      )}

      {/* ── Page thumbnails panel ── */}
      {showContents && pdfDoc && (
        <ThumbnailPanel
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={currentPage}
          rotation={rotation}
          onPageChange={handlePageChange}
        />
      )}

      {/* ── Right sidebar: zoom + page navigation ── */}
      <div className="right-sidebar">

        {/* Zoom controls */}
        <div className="sidebar-group">
          <button
            className="sidebar-btn"
            title="Zoom in"
            onClick={() => setZoom(z => Math.min(5, parseFloat((z + 0.25).toFixed(2))))}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>

          <select
            className="sidebar-zoom-select"
            value={ZOOM_PRESETS.includes(zoom) ? zoom : "custom"}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setZoom(v); }}
            title="Zoom level"
          >
            {ZOOM_PRESETS.map(z => <option key={z} value={z}>{zoomLabel(z)}</option>)}
            {!ZOOM_PRESETS.includes(zoom) && <option value="custom">{zoomLabel(zoom)}</option>}
          </select>

          <button
            className="sidebar-btn"
            title="Zoom out"
            onClick={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-sep" />

        {/* Page navigation */}
        {totalPages > 0 && (
          <div className="sidebar-group">
            <button
              className="sidebar-btn"
              title="Previous page"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>

            <div className="sidebar-page-indicator">
              <input
                ref={pageInputRef}
                type="number"
                className="sidebar-page-input"
                defaultValue={currentPage}
                key={currentPage}
                min={1}
                max={totalPages}
                onKeyDown={handlePageInput}
                title="Go to page"
              />
              <span className="sidebar-page-total">/ {totalPages}</span>
            </div>

            <button
              className="sidebar-btn"
              title="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        )}

        <div className="sidebar-sep" />

        {/* Rotate */}
        <div className="sidebar-group">
          <button
            className="sidebar-btn"
            title="Rotate clockwise (90°)"
            onClick={() => setRotation(r => (r + 90) % 360)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M21 8C19.6 5 16.8 3 13.5 3 8.8 3 5 6.8 5 11.5S8.8 20 13.5 20c3.3 0 6.2-2 7.6-5"/>
            </svg>
          </button>
          <button
            className="sidebar-btn"
            title="Rotate counter-clockwise (90°)"
            onClick={() => setRotation(r => (r + 270) % 360)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"/>
              <path d="M3 8c1.4-3 4.2-5 7.5-5C15.2 3 19 6.8 19 11.5S15.2 20 10.5 20c-3.3 0-6.2-2-7.6-5"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-sep" />

        {/* Fit to width */}
        <button
          className="sidebar-btn"
          title="Reset zoom (100%)"
          onClick={() => setZoom(ZOOM_BASE)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>

      </div>

      <div className={`luxor-viewer${showContents ? " viewer-with-panel" : ""}`}>
        {pdfDoc && (splitView
          /* ── Two-page spread: render pairs side by side ── */
          ? Array.from({ length: Math.ceil(totalPages / 2) }, (_, i) => {
              const left  = i * 2 + 1;
              const right = i * 2 + 2;
              return (
                <div key={left} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexShrink: 0 }}>
                  <PDFPage
                    pdfDocument={pdfDoc} pageNum={left} zoom={zoom} rotation={rotation}
                    searchTerm={searchQuery.trim()} tool={tool}
                    annotations={getPageAnnotations(left)}
                    highlightColor={highlightColor} textColor={textColor} textSize={textSize}
                    drawColor={drawColor} drawThickness={drawThickness}
                    onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                    onAnnotationRemove={removeAnnotation}
                    isCurrentPage={left === currentPage} onVisible={handlePageVisible}
                  />
                  {right <= totalPages && (
                    <PDFPage
                      pdfDocument={pdfDoc} pageNum={right} zoom={zoom} rotation={rotation}
                      searchTerm={searchQuery.trim()} tool={tool}
                      annotations={getPageAnnotations(right)}
                      highlightColor={highlightColor} textColor={textColor} textSize={textSize}
                      drawColor={drawColor} drawThickness={drawThickness}
                      onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                      onAnnotationRemove={removeAnnotation}
                      isCurrentPage={right === currentPage} onVisible={handlePageVisible}
                    />
                  )}
                </div>
              );
            })
          /* ── Single-page view ── */
          : allPageNums.map(pageNum => (
              <PDFPage
                key={pageNum}
                pdfDocument={pdfDoc} pageNum={pageNum} zoom={zoom} rotation={rotation}
                searchTerm={searchQuery.trim()} tool={tool}
                annotations={getPageAnnotations(pageNum)}
                highlightColor={highlightColor} textColor={textColor} textSize={textSize}
                drawColor={drawColor} drawThickness={drawThickness}
                onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                onAnnotationRemove={removeAnnotation}
                isCurrentPage={pageNum === currentPage} onVisible={handlePageVisible}
              />
            ))
        )}
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
