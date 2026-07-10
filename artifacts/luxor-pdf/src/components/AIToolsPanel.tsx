import { useRef, useState } from "react";
import SidePanel from "./SidePanel";

interface AIToolsPanelProps {
  pdfDoc: any;
  fileName: string;
  totalPages: number;
  onClose: () => void;
}

type AITool = "summarize" | "explain" | "translate" | "chat";

/** Renders the Markdown subset the summary endpoint produces (headings,
 *  bullets, bold) with plain inline styles — no extra dependencies. */
function SummaryMarkdown({ text }: { text: string }) {
  const renderInline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
      seg.startsWith("**") && seg.endsWith("**") ? (
        <strong key={i} style={{ color: "#eee", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>
      ) : (
        seg
      )
    );
    return <span key={key}>{parts}</span>;
  };

  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let bullets: string[] = [];
  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={key} style={{ margin: "6px 0", paddingLeft: 18 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{renderInline(b, i)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets(`ul-${i}`);
    if (!line.trim()) return;
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push(
        <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: "#eee", margin: "10px 0 4px" }}>
          {renderInline(heading[2], i)}
        </div>
      );
    } else {
      blocks.push(
        <p key={i} style={{ margin: "6px 0" }}>{renderInline(line, i)}</p>
      );
    }
  });
  flushBullets("ul-end");

  return <div style={{ fontSize: 12.5, color: "#bbb", lineHeight: 1.6 }}>{blocks}</div>;
}

/**
 * AI Tools panel (sign-in gated at the Viewer level).
 *
 * "Summarize document" is live: it extracts the document text via
 * pdfjs (page.getTextContent(), same pipeline as search) and sends it
 * to POST /api/ai/summarize. The other tools remain UI previews.
 */
export default function AIToolsPanel({ pdfDoc, fileName, totalPages, onClose }: AIToolsPanelProps) {
  const [active, setActive] = useState<AITool | null>(null);
  const [chatInput, setChatInput] = useState("");

  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTruncated, setSummaryTruncated] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const tools: { key: AITool; label: string; desc: string }[] = [
    { key: "summarize", label: "Summarize document", desc: "Get a concise summary of the whole document." },
    { key: "explain", label: "Explain selection", desc: "Select text on a page, then get a plain-language explanation." },
    { key: "translate", label: "Translate", desc: "Translate the document text into another language." },
    { key: "chat", label: "Ask this PDF", desc: "Chat with the document — ask questions, get grounded answers." },
  ];

  const runSummarize = async () => {
    if (summarizing || !pdfDoc) return;
    const runId = ++runIdRef.current;
    setSummarizing(true);
    setSummaryError(null);
    setSummary(null);
    setSummaryTruncated(false);
    try {
      const parts: string[] = [];
      let chars = 0;
      const CLIENT_CHAR_CAP = 390_000; // stay under the API's 400k body limit
      for (let i = 1; i <= totalPages && chars < CLIENT_CHAR_CAP; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ").trim();
          if (pageText) {
            parts.push(pageText);
            chars += pageText.length;
          }
        } catch { /* skip unreadable page */ }
        if (runId !== runIdRef.current) return;
      }
      const text = parts.join("\n\n").slice(0, CLIENT_CHAR_CAP);
      if (!text.trim()) {
        setSummaryError("This document has no selectable text to summarize — it may be a scanned PDF.");
        return;
      }
      const resp = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName, totalPages }),
      });
      if (runId !== runIdRef.current) return;
      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        setSummaryError(
          resp.status === 401
            ? "Please sign in to use AI tools."
            : body?.error || "The summary could not be generated. Please try again."
        );
        return;
      }
      const data = await resp.json();
      if (runId !== runIdRef.current) return;
      setSummary(data.summary);
      setSummaryTruncated(Boolean(data.truncated));
    } catch {
      if (runId === runIdRef.current) {
        setSummaryError("The summary could not be generated. Please check your connection and try again.");
      }
    } finally {
      if (runId === runIdRef.current) setSummarizing(false);
    }
  };

  const openTool = (key: AITool) => {
    const next = active === key ? null : key;
    setActive(next);
    if (next === "summarize" && !summary && !summarizing) void runSummarize();
  };

  return (
    <SidePanel title="AI Tools" onClose={onClose}>
      <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginBottom: 12 }}>
        Working with <span style={{ color: "#ccc" }}>{fileName}</span> ({totalPages} pages)
      </div>

      {tools.map(t => (
        <button
          key={t.key}
          onClick={() => openTool(t.key)}
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

      {active === "summarize" && (
        <div style={{ marginTop: 10 }}>
          {summarizing && (
            <div style={{
              fontSize: 12.5, color: "#9cc0f7", lineHeight: 1.6,
              background: "rgba(13,98,242,0.08)", border: "1px solid rgba(13,98,242,0.25)",
              borderRadius: 8, padding: "10px 12px",
            }}>
              Reading the document and preparing your summary… This can take a
              moment for longer files.
            </div>
          )}
          {summaryError && !summarizing && (
            <div style={{
              fontSize: 12.5, color: "#f2a0a0", lineHeight: 1.6,
              background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.3)",
              borderRadius: 8, padding: "10px 12px",
            }}>
              {summaryError}
              <button
                onClick={() => void runSummarize()}
                style={{
                  display: "block", marginTop: 8, background: "transparent",
                  border: "1px solid rgba(255,255,255,0.25)", color: "#ddd",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}
          {summary && !summarizing && (
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "10px 12px",
            }}>
              <SummaryMarkdown text={summary} />
              {summaryTruncated && (
                <div style={{ fontSize: 11, color: "#998a55", marginTop: 8 }}>
                  This document is very long — the summary covers the first part of it.
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => { void navigator.clipboard?.writeText(summary); }}
                  style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.25)",
                    color: "#ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  }}
                >
                  Copy
                </button>
                <button
                  onClick={() => void runSummarize()}
                  style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.25)",
                    color: "#ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                  }}
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {active && active !== "summarize" && (
        <div style={{
          marginTop: 10, fontSize: 12.5, color: "#f5b942", lineHeight: 1.6,
          background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.25)",
          borderRadius: 8, padding: "10px 12px",
        }}>
          <strong>Preview mode:</strong> This AI tool is coming soon. The interface is
          ready — responses will appear right here once it goes live.
        </div>
      )}
    </SidePanel>
  );
}
