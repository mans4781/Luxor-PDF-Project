import { useRef, useState, useCallback } from "react";

interface HomeProps {
  onFileLoad: (file: File) => void;
}

const FEATURES = [
  { icon: "📄", label: "Multi-Page" },
  { icon: "🔍", label: "Zoom & Pan" },
  { icon: "⬇️", label: "Download" },
  { icon: "🖨️", label: "Print" },
  { icon: "↔️", label: "Navigate" },
  { icon: "🔒", label: "Secure View" },
];

export default function Home({ onFileLoad }: HomeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.type === "application/pdf") {
      onFileLoad(file);
    } else {
      alert("Please open a PDF file.");
    }
  }, [onFileLoad]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="home-screen">
      <div className="home-logo-area">
        <div className="home-logo">L</div>
        <div className="home-title">Luxor PDF Reader</div>
        <div className="home-sub">Professional annotations. Zero clutter.</div>
      </div>

      <div
        className={`drop-zone ${dragging ? "drag-over" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="dz-icon">📄</div>
        <div className="dz-text">Drop a PDF here to open it</div>
        <div className="dz-sub">or click to browse your files</div>
      </div>

      <button className="btn-open" onClick={() => inputRef.current?.click()}>
        Open PDF
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={onInputChange}
      />

      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.label} className="feature-chip">
            <div className="fc-icon">{f.icon}</div>
            <div className="fc-label">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
