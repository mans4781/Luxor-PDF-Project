import { useEffect } from "react";

export type HelpSection = "guide" | "shortcuts" | "about";

const SECTIONS: { key: HelpSection; label: string }[] = [
  { key: "guide", label: "User Guide" },
  { key: "shortcuts", label: "Keyboard Shortcuts" },
  { key: "about", label: "About" },
];

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl+O", action: "Open a PDF" },
  { keys: "Ctrl+Shift+S", action: "Save the document" },
  { keys: "Ctrl+Alt+S", action: "Export a copy" },
  { keys: "Ctrl+P", action: "Print" },
  { keys: "Ctrl+W", action: "Close the document" },
  { keys: "Ctrl+F", action: "Find in document" },
  { keys: "F11", action: "Full screen" },
  { keys: "+ / \u2212", action: "Zoom in / out" },
  { keys: "Arrow keys / Page Up / Page Down", action: "Move through pages" },
];

const GUIDE: { title: string; body: string }[] = [
  {
    title: "Opening documents",
    body: "Use File > Open PDF or drop a file anywhere onto the reader. Recently viewed files are listed under File > Recent Files, and File > Create New Document starts a fresh blank page.",
  },
  {
    title: "Reading comfortably",
    body: "The View menu controls zoom, page fit, single or two-page layout, rotation, reading themes and full screen. Presentation Mode hides everything except the pages themselves.",
  },
  {
    title: "Marking up",
    body: "The Annotate menu holds highlighters, underline and strikeout for selected text, text boxes, sticky-note comments, freehand drawing and shapes. The eraser removes a single annotation; Erase All clears the whole document.",
  },
  {
    title: "Reworking the document",
    body: "The Tools menu covers page operations (insert, delete, rotate), compression, watermarks, page numbers, redaction, whiteout, form filling and signing. Structural page changes reload the file in place.",
  },
  {
    title: "Saving your work",
    body: "Save and Save As write a copy that includes your burned-in edits such as edited text, whiteout, redactions, watermarks and page numbers. Display-only notes stay with the reader on this device.",
  },
];

export default function HelpModal({
  section,
  onSectionChange,
  onClose,
}: {
  section: HelpSection;
  onSectionChange: (s: HelpSection) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(15,20,30,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)", maxHeight: "80vh",
          background: "#FFFFFF", color: "#1a1a1a",
          borderRadius: 10, boxShadow: "0 18px 50px rgba(0,0,0,0.30)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "12px 16px 0",
          }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => onSectionChange(s.key)}
              style={{
                border: "none", cursor: "pointer",
                background: section === s.key ? "rgba(13,98,242,0.10)" : "transparent",
                color: section === s.key ? "#0D62F2" : "#555",
                fontWeight: section === s.key ? 600 : 400,
                fontSize: 13, padding: "7px 12px", borderRadius: 6,
              }}
            >
              {s.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            title="Close"
            style={{
              border: "none", background: "transparent", cursor: "pointer",
              color: "#555", padding: 6, borderRadius: 6, display: "flex",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "14px 20px 20px", overflowY: "auto" }}>
          {section === "guide" && (
            <div>
              <h2 style={{ margin: "4px 0 12px", fontSize: 17 }}>Getting around Luxor PDF Reader</h2>
              {GUIDE.map((g) => (
                <div key={g.title} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{g.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#444" }}>{g.body}</div>
                </div>
              ))}
            </div>
          )}

          {section === "shortcuts" && (
            <div>
              <h2 style={{ margin: "4px 0 12px", fontSize: 17 }}>Keyboard shortcuts</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {SHORTCUTS.map((s) => (
                  <div
                    key={s.keys}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "7px 8px", borderRadius: 6,
                      background: "rgba(0,0,0,0.025)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "ui-monospace, monospace", fontSize: 12,
                        color: "#0D62F2", minWidth: 150, fontWeight: 600,
                      }}
                    >
                      {s.keys}
                    </span>
                    <span style={{ fontSize: 13, color: "#333" }}>{s.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "about" && (
            <div style={{ textAlign: "center", padding: "18px 6px 8px" }}>
              <img
                src={`${import.meta.env.BASE_URL}brand/luxor-icon.png`}
                alt="Luxor PDF logo"
                width={56}
                height={56}
                draggable={false}
                style={{ marginBottom: 12 }}
              />
              <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Luxor PDF Reader</h2>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 14 }}>Part of the Luxor PDF Suite</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#444", maxWidth: 420, margin: "0 auto 14px" }}>
                A fast, privacy-first PDF reader. Documents are processed on your device;
                nothing is uploaded when you read, annotate or rework a file locally.
              </p>
              <p style={{ fontSize: 12, color: "#777", margin: 0 }}>
                Built with open-source technology including PDF.js and React.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
