interface ErrorScreenProps {
  title: string;
  message: string;
  fileName?: string;
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * Friendly full-screen error state for documents that fail to load
 * (corrupted files, unsupported formats, cancelled password entry).
 * Replaces the old silent console.error + blank screen.
 */
export default function ErrorScreen({ title, message, fileName, onClose, onRetry }: ErrorScreenProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "#525659",
        zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 18px",
          background: "rgba(192,57,43,0.15)", color: "#e74c3c",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9.5" y1="12.5" x2="14.5" y2="17.5"/>
            <line x1="14.5" y1="12.5" x2="9.5" y2="17.5"/>
          </svg>
        </div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        {fileName && (
          <div style={{ color: "#999", fontSize: 12, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>
            {fileName}
          </div>
        )}
        <div style={{ color: "#bbb", fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>{message}</div>
        <div style={{
          color: "#999", fontSize: 12.5, lineHeight: 1.7, marginBottom: 22,
          background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 16px",
          textAlign: "left",
        }}>
          Things to try:
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>Re-download or re-export the PDF from its source</li>
            <li>Make sure the file is a PDF (not renamed from another format)</li>
            <li>Open the file in another reader to confirm it isn't damaged</li>
          </ul>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                background: "transparent", color: "#ddd",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7,
                padding: "10px 20px", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
              }}
            >Try again</button>
          )}
          <button
            onClick={onClose}
            style={{
              background: "#0D62F2", color: "#fff",
              border: "none", borderRadius: 7,
              padding: "10px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            }}
          >Choose another file</button>
        </div>
      </div>
    </div>
  );
}
