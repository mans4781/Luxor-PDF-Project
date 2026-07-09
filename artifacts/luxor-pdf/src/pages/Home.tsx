import { useRef, useState, useCallback } from "react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { loadRecents, clearRecents, formatFileSize, type RecentFileEntry } from "@/lib/recentFiles";
import { loadSettings } from "@/lib/settings";

interface HomeProps {
  onFileLoad: (file: File) => void;
}

/** "2 hours ago" style label for the recents list. */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(ts).toLocaleDateString();
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
  const [recents, setRecents] = useState<RecentFileEntry[]>(() =>
    loadSettings().enableRecents ? loadRecents() : [],
  );

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
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AuthMenu iconOnly variant="dark" />
      </div>
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

      {recents.length > 0 && (
        <div style={{ width: "100%", maxWidth: 560, margin: "26px auto 0" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8, padding: "0 4px",
          }}>
            <div style={{
              fontSize: 12, fontWeight: 600, letterSpacing: 0.8,
              textTransform: "uppercase", color: "#8a8f98",
            }}>Recent files</div>
            <button
              onClick={() => { clearRecents(); setRecents([]); }}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 11.5, color: "#8a8f98", padding: "2px 4px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#0D62F2"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#8a8f98"; }}
            >Clear</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recents.map((r) => (
              <button
                key={`${r.name}::${r.size}::${r.lastModified}`}
                title="Browsers can't reopen local files automatically — this reopens the file picker"
                onClick={() => inputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "9px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8, cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13,98,242,0.12)"; e.currentTarget.style.borderColor = "rgba(13,98,242,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: "block", fontSize: 13, fontWeight: 500, color: "#e6e8eb",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{r.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#8a8f98", marginTop: 1 }}>
                    {r.pages} page{r.pages === 1 ? "" : "s"} · {formatFileSize(r.size)} · {timeAgo(r.openedAt)}
                  </span>
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8f98" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

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
