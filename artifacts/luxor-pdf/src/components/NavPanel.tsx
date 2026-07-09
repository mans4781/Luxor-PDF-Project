import { useEffect, useState } from "react";
import SidePanel from "./SidePanel";
import { Annotation } from "../lib/annotationTypes";

/* ── Bookmarks (per-document, localStorage) ─────────────────────────── */

export interface BookmarkEntry {
  id: string;
  page: number;
  label: string;
  createdAt: string;
}

export function bookmarksKey(docKey: string) {
  return `luxor-pdf:bookmarks:${docKey}`;
}

export function loadBookmarks(docKey: string): BookmarkEntry[] {
  try {
    const raw = localStorage.getItem(bookmarksKey(docKey));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(docKey: string, list: BookmarkEntry[]) {
  try {
    localStorage.setItem(bookmarksKey(docKey), JSON.stringify(list));
  } catch { /* quota */ }
}

/* ── Outline (real PDF table of contents via getOutline) ────────────── */

interface OutlineNode {
  title: string;
  dest: any;
  items: OutlineNode[];
}

type NavTab = "outline" | "bookmarks" | "annotations";

interface NavPanelProps {
  pdfDoc: any;
  docKey: string;
  currentPage: number;
  totalPages: number;
  annotations: Annotation[];
  initialTab?: NavTab;
  onGoToPage: (page: number) => void;
  onRemoveAnnotation: (id: string) => void;
  onClose: () => void;
}

const ANNOTATION_TYPE_LABELS: Record<string, string> = {
  highlight: "Highlight",
  underline: "Underline",
  strike: "Strikethrough",
  text: "Text box",
  comment: "Sticky note",
  freehand: "Pen drawing",
  line: "Line",
  arrow: "Arrow",
  oval: "Oval",
  rect: "Rectangle",
  redact: "Redaction",
  image: "Image",
  edittext: "Text edit",
};

function annotationSnippet(a: Annotation): string | null {
  if ("selectedText" in a && a.selectedText) return a.selectedText;
  if (a.type === "comment") return a.text;
  if (a.type === "text") return a.content;
  if (a.type === "edittext") return a.text;
  return null;
}

export default function NavPanel({
  pdfDoc, docKey, currentPage, totalPages, annotations, initialTab = "outline",
  onGoToPage, onRemoveAnnotation, onClose,
}: NavPanelProps) {
  const [tab, setTab] = useState<NavTab>(initialTab);
  const [outline, setOutline] = useState<OutlineNode[] | null | undefined>(undefined);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(() => loadBookmarks(docKey));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const o = await pdfDoc.getOutline();
        if (!cancelled) setOutline(o && o.length ? o : null);
      } catch {
        if (!cancelled) setOutline(null);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc]);

  const jumpToDest = async (dest: any) => {
    try {
      const explicit = typeof dest === "string" ? await pdfDoc.getDestination(dest) : dest;
      if (!explicit || !explicit[0]) return;
      const pageIndex = await pdfDoc.getPageIndex(explicit[0]);
      onGoToPage(pageIndex + 1);
    } catch (err) {
      console.error("Failed to resolve outline destination", err);
    }
  };

  const addBookmark = () => {
    if (bookmarks.some(b => b.page === currentPage)) return;
    const next = [
      ...bookmarks,
      {
        id: `bm-${Date.now()}`,
        page: currentPage,
        label: `Page ${currentPage}`,
        createdAt: new Date().toISOString(),
      },
    ].sort((a, b) => a.page - b.page);
    setBookmarks(next);
    saveBookmarks(docKey, next);
  };

  const removeBookmark = (id: string) => {
    const next = bookmarks.filter(b => b.id !== id);
    setBookmarks(next);
    saveBookmarks(docKey, next);
  };

  const renameBookmark = (id: string, label: string) => {
    const next = bookmarks.map(b => (b.id === id ? { ...b, label } : b));
    setBookmarks(next);
    saveBookmarks(docKey, next);
  };

  const sortedAnnotations = [...annotations].sort((a, b) => a.page - b.page);

  const tabBtn = (t: NavTab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1, padding: "7px 4px",
        background: tab === t ? "rgba(13,98,242,0.18)" : "transparent",
        border: "none", borderRadius: 6,
        color: tab === t ? "#7fa8e8" : "#999",
        fontSize: 11.5, fontWeight: 500, cursor: "pointer",
      }}
    >
      {label}{count !== undefined && count > 0 ? ` (${count})` : ""}
    </button>
  );

  return (
    <SidePanel title="Navigation" onClose={onClose}>
      <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
        {tabBtn("outline", "Outline")}
        {tabBtn("bookmarks", "Bookmarks", bookmarks.length)}
        {tabBtn("annotations", "Notes", sortedAnnotations.length)}
      </div>

      {tab === "outline" && (
        outline === undefined ? (
          <div style={{ color: "#888", fontSize: 12.5 }}>Loading outline…</div>
        ) : outline === null ? (
          <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.6 }}>
            This document has no built-in table of contents.
            <br />
            <span style={{ color: "#666" }}>Tip: use Bookmarks to mark pages yourself.</span>
          </div>
        ) : (
          <OutlineTree nodes={outline} depth={0} onJump={jumpToDest} />
        )
      )}

      {tab === "bookmarks" && (
        <>
          <button
            onClick={addBookmark}
            disabled={bookmarks.some(b => b.page === currentPage)}
            style={{
              width: "100%", padding: "8px 10px", marginBottom: 12,
              background: bookmarks.some(b => b.page === currentPage) ? "rgba(255,255,255,0.06)" : "#0D62F2",
              border: "none", borderRadius: 7,
              color: bookmarks.some(b => b.page === currentPage) ? "#777" : "#fff",
              fontSize: 12.5, fontWeight: 500,
              cursor: bookmarks.some(b => b.page === currentPage) ? "default" : "pointer",
            }}
          >
            {bookmarks.some(b => b.page === currentPage)
              ? `Page ${currentPage} is bookmarked`
              : `Bookmark current page (${currentPage})`}
          </button>
          {bookmarks.length === 0 ? (
            <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.6 }}>
              No bookmarks yet. Bookmarks are saved for this document on this device.
            </div>
          ) : (
            bookmarks.map(b => (
              <div
                key={b.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 8px", marginBottom: 4,
                  background: b.page === currentPage ? "rgba(13,98,242,0.12)" : "rgba(255,255,255,0.04)",
                  borderRadius: 7,
                }}
              >
                <button
                  onClick={() => onGoToPage(b.page)}
                  title={`Go to page ${b.page}`}
                  style={{
                    background: "transparent", border: "none", color: "#7fa8e8",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                    padding: "2px 6px", borderRadius: 5,
                    flexShrink: 0, minWidth: 34,
                  }}
                >
                  p.{b.page}
                </button>
                <input
                  value={b.label}
                  onChange={(e) => renameBookmark(b.id, e.target.value)}
                  style={{
                    flex: 1, minWidth: 0, background: "transparent",
                    border: "none", outline: "none",
                    color: "#ddd", fontSize: 12.5,
                  }}
                />
                <button
                  onClick={() => removeBookmark(b.id)}
                  title="Remove bookmark"
                  style={{ background: "transparent", border: "none", color: "#777", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))
          )}
        </>
      )}

      {tab === "annotations" && (
        sortedAnnotations.length === 0 ? (
          <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.6 }}>
            No annotations in this session. Highlights, notes, drawings and text boxes will appear here.
          </div>
        ) : (
          sortedAnnotations.map(a => {
            const snippet = annotationSnippet(a);
            return (
              <div
                key={a.id}
                style={{
                  padding: "8px 9px", marginBottom: 5,
                  background: "rgba(255,255,255,0.04)", borderRadius: 7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {"color" in a && a.color ? (
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, flexShrink: 0, border: "1px solid rgba(255,255,255,0.25)" }} />
                  ) : (
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#666", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#ddd", flex: 1 }}>
                    {ANNOTATION_TYPE_LABELS[a.type] ?? a.type}
                  </span>
                  <button
                    onClick={() => onGoToPage(a.page)}
                    style={{
                      background: "rgba(13,98,242,0.15)", border: "none",
                      color: "#7fa8e8", fontSize: 10.5, fontWeight: 600,
                      padding: "2px 7px", borderRadius: 999, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    p.{a.page > totalPages ? totalPages : a.page}
                  </button>
                  <button
                    onClick={() => onRemoveAnnotation(a.id)}
                    title="Delete annotation"
                    style={{ background: "transparent", border: "none", color: "#777", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
                {snippet && (
                  <div style={{
                    marginTop: 5, fontSize: 11.5, color: "#999", lineHeight: 1.45,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    “{snippet}”
                  </div>
                )}
              </div>
            );
          })
        )
      )}
    </SidePanel>
  );
}

function OutlineTree({ nodes, depth, onJump }: { nodes: OutlineNode[]; depth: number; onJump: (dest: any) => void }) {
  return (
    <>
      {nodes.map((n, i) => (
        <div key={`${depth}-${i}`}>
          <button
            onClick={() => n.dest && onJump(n.dest)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              background: "transparent", border: "none",
              color: depth === 0 ? "#ddd" : "#aaa",
              fontSize: depth === 0 ? 12.5 : 12,
              fontWeight: depth === 0 ? 500 : 400,
              padding: `5px 4px 5px ${8 + depth * 14}px`,
              borderRadius: 5, cursor: n.dest ? "pointer" : "default",
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => { if (n.dest) e.currentTarget.style.background = "rgba(13,98,242,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {n.title || "Untitled"}
          </button>
          {n.items && n.items.length > 0 && (
            <OutlineTree nodes={n.items} depth={depth + 1} onJump={onJump} />
          )}
        </div>
      ))}
    </>
  );
}
