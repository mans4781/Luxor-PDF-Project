import { useState } from "react";
import SidePanel from "./SidePanel";

interface AIToolsPanelProps {
  fileName: string;
  totalPages: number;
  onClose: () => void;
}

type AITool = "summarize" | "explain" | "translate" | "chat";

/**
 * AI Tools panel — UI-ready MOCK (sign-in gated at the Viewer level).
 *
 * INTEGRATION POINT: wire these actions to the suite backend:
 *   POST /api/ai/summarize   { docText, range }
 *   POST /api/ai/explain     { selectedText }
 *   POST /api/ai/translate   { docText, targetLang }
 *   POST /api/ai/chat        { docText, messages[] }
 * Document text extraction already exists in the search pipeline
 * (page.getTextContent()) and can be reused to build `docText`.
 */
export default function AIToolsPanel({ fileName, totalPages, onClose }: AIToolsPanelProps) {
  const [active, setActive] = useState<AITool | null>(null);
  const [chatInput, setChatInput] = useState("");

  const tools: { key: AITool; label: string; desc: string }[] = [
    { key: "summarize", label: "Summarize document", desc: "Get a concise summary of the whole document or a page range." },
    { key: "explain", label: "Explain selection", desc: "Select text on a page, then get a plain-language explanation." },
    { key: "translate", label: "Translate", desc: "Translate the document text into another language." },
    { key: "chat", label: "Ask this PDF", desc: "Chat with the document — ask questions, get grounded answers." },
  ];

  return (
    <SidePanel title="AI Tools" onClose={onClose}>
      <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginBottom: 12 }}>
        Working with <span style={{ color: "#ccc" }}>{fileName}</span> ({totalPages} pages)
      </div>

      {tools.map(t => (
        <button
          key={t.key}
          onClick={() => setActive(active === t.key ? null : t.key)}
          style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "10px 11px", marginBottom: 6,
            background: active === t.key ? "rgba(13,98,242,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${active === t.key ? "rgba(13,98,242,0.4)" : "transparent"}`,
            borderRadius: 8, cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "#ddd", marginBottom: 2 }}>{t.label}</div>
          <div style={{ fontSize: 11.5, color: "#888", lineHeight: 1.4 }}>{t.desc}</div>
        </button>
      ))}

      {active === "chat" && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask something about this document…"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 7, color: "#ddd", fontSize: 12.5, padding: "8px 10px",
              outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
      )}

      {active && (
        <div style={{
          marginTop: 10, fontSize: 12.5, color: "#f5b942", lineHeight: 1.6,
          background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.25)",
          borderRadius: 8, padding: "10px 12px",
        }}>
          <strong>Preview mode:</strong> AI features are coming soon. The interface is ready — responses will appear right here once the AI service is connected.
        </div>
      )}
    </SidePanel>
  );
}
