import { useRef, useState, useCallback, useEffect } from "react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { useAuthGate } from "@/components/AuthGate";
import { loadRecents, clearRecents, formatFileSize, type RecentFileEntry } from "@/lib/recentFiles";
import { loadSettings } from "@/lib/settings";
import { desktopWindowControl, isDesktopShell } from "@/lib/desktopBridge";

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

const sw = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const Ic = {
  folder: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  clock: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  search: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  caret: (s = 11) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M6 9l6 6 6-6"/></svg>,
  view: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>,
  rotate: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M21 2v6h-6"/><path d="M21 8C19.6 5 16.8 3 13.5 3 8.8 3 5 6.8 5 11.5S8.8 20 13.5 20c3.3 0 6.2-2 7.6-5"/></svg>,
  print: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg>,
  gear: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>,
  help: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.5.7c0 1.8-2.7 2.3-2.7 3.8"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  home: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>,
  star: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><polygon points="12 2.5 15 8.7 21.8 9.6 16.9 14.3 18.1 21 12 17.8 5.9 21 7.1 14.3 2.2 9.6 9 8.7 12 2.5"/></svg>,
  bookmark: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M6 3h12v18l-6-4.5L6 21V3z"/></svg>,
  note: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5z"/><path d="M8 8h8M8 12h5"/></svg>,
  grid: (s = 15) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  bulb: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5h-6c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3z"/></svg>,
  book: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>,
  pen: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  moon: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>,
  shield: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M12 2l8 3.5V11c0 5-3.4 8.8-8 11-4.6-2.2-8-6-8-11V5.5L12 2z"/></svg>,
  cloud: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M17.5 19a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 12.5 4 4 0 0 0 6 20h11.5z"/><path d="M12 12v6M9.5 15.5L12 18l2.5-2.5"/></svg>,
  panel: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>,
  chevL: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M15 6l-6 6 6 6"/></svg>,
  chevR: (s = 13) => <svg width={s} height={s} viewBox="0 0 24 24" {...sw}><path d="M9 6l6 6-6 6"/></svg>,
};

const TIPS = [
  "Use bookmarks to quickly navigate through long documents.",
  "Press Ctrl + F to search inside any open document instantly.",
  "Dark theme is easier on your eyes when reading after dark.",
];

const FEATURES: { label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { label: "Smooth Reading", color: "#d21f2f", bg: "#fdeeee", icon: Ic.book() },
  { label: "Fast Search", color: "#d21f2f", bg: "#fdeeee", icon: Ic.search(16) },
  { label: "Bookmarks", color: "#7c3aed", bg: "#f3edfd", icon: Ic.bookmark(16) },
  { label: "Annotations", color: "#16a34a", bg: "#eaf7ef", icon: Ic.pen() },
  { label: "Dark Theme", color: "#2563eb", bg: "#ecf1fd", icon: Ic.moon() },
  { label: "Secure Viewing", color: "#0d9488", bg: "#e8f6f4", icon: Ic.shield() },
  { label: "Print Ready", color: "#d21f2f", bg: "#fdeeee", icon: Ic.print(16) },
  { label: "Cloud Sync", color: "#db2777", bg: "#fdecf4", icon: Ic.cloud() },
];

const SIDE_ITEMS = [
  { key: "home", label: "Home", icon: Ic.home() },
  { key: "recent", label: "Recent Files", icon: Ic.clock() },
  { key: "favorites", label: "Favorites", icon: Ic.star() },
  { key: "bookmarks", label: "Bookmarks", icon: Ic.bookmark() },
  { key: "notes", label: "Notes", icon: Ic.note() },
];

/** Original Luxor illustration: document with red fold on a blush backdrop. */
function HeroIllustration() {
  return (
    <div style={{ position: "relative", width: 300, height: 242, display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
      <svg width="300" height="242" viewBox="0 0 260 210" fill="none" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="lxhBlob" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#fbe2e4"/>
            <stop offset="60%" stopColor="#fceceD"/>
            <stop offset="100%" stopColor="#fdf3f3"/>
          </radialGradient>
          <pattern id="lxhDots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#eecdd0"/>
          </pattern>
          <filter id="lxhSoftShadow" x="-40%" y="-200%" width="180%" height="500%">
            <feGaussianBlur stdDeviation="5"/>
          </filter>
        </defs>
        <circle cx="128" cy="104" r="86" fill="url(#lxhBlob)"/>
        <rect x="204" y="16" width="40" height="30" rx="10" fill="url(#lxhDots)" opacity="0.7"/>
        <rect x="14" y="148" width="34" height="40" rx="10" fill="url(#lxhDots)" opacity="0.6"/>
        <g>
          <path d="M92 150 C64 132 52 104 58 76 C82 96 94 124 92 150 Z" fill="#f4f5f7"/>
          <path d="M95 162 C60 160 34 138 30 104 C62 118 88 138 95 162 Z" fill="#eef0f3"/>
          <path d="M96 170 C72 170 52 158 44 140 C70 144 88 156 96 170 Z" fill="#e6e8ec"/>
        </g>
        <g>
          <path d="M170 152 C196 132 206 104 202 78 C180 100 168 128 170 152 Z" fill="#f8bcc2"/>
          <path d="M168 164 C204 158 226 132 230 100 C198 116 174 138 168 164 Z" fill="#f2939e"/>
          <path d="M166 172 C192 172 212 160 220 144 C194 148 176 160 166 172 Z" fill="#f4a6ae" opacity="0.92"/>
        </g>
        <ellipse cx="130" cy="178" rx="66" ry="6.5" fill="#cbb9ba" opacity="0.35" filter="url(#lxhSoftShadow)"/>
        <path d="M48 38l0 12M42 44l12 0" stroke="#e58691" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M218 30l0 10M213 35l10 0" stroke="#e58691" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M26 122l0 9M21.5 126.5l9 0" stroke="#eda6ac" strokeWidth="2.1" strokeLinecap="round"/>
        <path d="M234 146l0 10M229 151l10 0" stroke="#eda6ac" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="196" cy="24" r="4" stroke="#eda6ac" strokeWidth="1.8" fill="none"/>
        <circle cx="36" cy="170" r="3.5" stroke="#f0c3c7" strokeWidth="1.7" fill="none"/>
        <circle cx="226" cy="118" r="3" stroke="#f0c3c7" strokeWidth="1.6" fill="none"/>
        <circle cx="60" cy="24" r="2.4" fill="#f2c6c9"/>
      </svg>
      <img
        src={`${import.meta.env.BASE_URL}brand/luxor-file.png`}
        alt=""
        draggable={false}
        style={{
          position: "relative", width: 122, height: 151, objectFit: "contain",
          filter: "drop-shadow(0 6px 9px rgba(138,39,48,0.13))",
          userSelect: "none",
        }}
      />
    </div>
  );
}

function EmptyDocsIllustration() {
  return (
    <svg width="66" height="52" viewBox="0 0 66 52" fill="none" aria-hidden="true">
      <rect x="14" y="6" width="34" height="42" rx="4" fill="#f4f5f7" stroke="#e3e5e9" strokeWidth="1.4"/>
      <rect x="20" y="2" width="34" height="42" rx="4" fill="#fff" stroke="#e3e5e9" strokeWidth="1.4"/>
      <path d="M44 2l10 10H48a4 4 0 0 1-4-4V2z" fill="#f0c3c7"/>
      <rect x="26" y="18" width="18" height="3.4" rx="1.7" fill="#e9ebef"/>
      <rect x="26" y="25" width="22" height="3.4" rx="1.7" fill="#eef0f3"/>
      <rect x="26" y="32" width="14" height="3.4" rx="1.7" fill="#eef0f3"/>
    </svg>
  );
}

export default function Home({ onFileLoad }: HomeProps) {
  const { beginSignIn, beginSignUp } = useAuthGate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [recentMenu, setRecentMenu] = useState(false);
  const [tip, setTip] = useState(0);
  const [recents, setRecents] = useState<RecentFileEntry[]>(() =>
    loadSettings().enableRecents ? loadRecents() : [],
  );

  useEffect(() => {
    const t = setInterval(() => setTip(v => (v + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file.type === "application/pdf") {
      onFileLoad(file);
    } else {
      alert("Please open a PDF file.");
    }
  }, [onFileLoad]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const toggleMaximize = () => {
    if (desktopWindowControl("maximize-toggle")) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  const inDesktop = isDesktopShell();

  const recentsMenu = recentMenu && (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setRecentMenu(false)} />
      <div className="lxh-menu">
        {recents.length === 0 ? (
          <div className="lxh-menu-empty">No recent files yet.</div>
        ) : (
          <>
            {recents.slice(0, 6).map((r) => (
              <button
                key={`${r.name}::${r.size}::${r.lastModified}`}
                className="lxh-menu-item"
                title="Browsers can't reopen local files automatically — this reopens the file picker"
                onClick={() => { setRecentMenu(false); openPicker(); }}
              >
                <span style={{ color: "#d21f2f", flexShrink: 0, display: "flex" }}>{Ic.folder(14)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                  <span style={{ display: "block", fontSize: 10.5, color: "#8a8f9a" }}>{timeAgo(r.openedAt)}</span>
                </span>
              </button>
            ))}
            <button
              className="lxh-menu-item"
              style={{ color: "#8a8f9a", borderTop: "1px solid #ececef", borderRadius: 0, marginTop: 4 }}
              onClick={() => { clearRecents(); setRecents([]); setRecentMenu(false); }}
            >
              Clear recent files
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="lxh-root">
      {/* Title bar */}
      <div className="lxh-titlebar">
        <img src={`${import.meta.env.BASE_URL}brand/luxor-shield.png`} alt="Luxor" draggable={false} />
        <span className="lxh-title">Luxor PDF Reader</span>
        <div className="lxh-winbtns">
          <button
            className="lxh-winbtn"
            aria-disabled={inDesktop ? undefined : "true"}
            title="Minimize" aria-label="Minimize"
            onClick={() => desktopWindowControl("minimize")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" {...sw}><path d="M5 12h14"/></svg>
          </button>
          <button className="lxh-winbtn" title="Maximize" aria-label="Maximize" onClick={toggleMaximize}>
            <svg width="15" height="15" viewBox="0 0 24 24" {...sw}><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>
          </button>
          <button
            className="lxh-winbtn close"
            aria-disabled={inDesktop ? undefined : "true"}
            title="Close" aria-label="Close"
            onClick={() => desktopWindowControl("close")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" {...sw}><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="lxh-toolbar">
        <div className="lxh-open">
          <button onClick={openPicker}>{Ic.folder()}Open File</button>
          <button className="caret" onClick={openPicker} aria-label="Open file options">{Ic.caret()}</button>
        </div>
        <div style={{ position: "relative" }}>
          <button className="lxh-tbtn" onClick={() => setRecentMenu(v => !v)}>
            {Ic.clock()}Recent{Ic.caret()}
          </button>
          {recentsMenu}
        </div>
        <div className="lxh-vsep" />
        <button className="lxh-tbtn" aria-disabled="true" title="Open a PDF to search inside it">{Ic.search()}Search{Ic.caret()}</button>
        <div style={{ flex: 1 }} />
        <div className="lxh-zoom" title="Open a PDF to zoom">
          <button aria-disabled="true" aria-label="Zoom out">−</button>
          <span>100%</span>
          <button aria-disabled="true" aria-label="Zoom in">+</button>
        </div>
        <div style={{ flex: 1 }} />
        <button className="lxh-tbtn" aria-disabled="true" title="Open a PDF to change the view">{Ic.view()}View{Ic.caret()}</button>
        <button className="lxh-tbtn" aria-disabled="true" title="Open a PDF to rotate pages">{Ic.rotate()}Rotate{Ic.caret()}</button>
        <button className="lxh-tbtn" aria-disabled="true" title="Open a PDF to print it">{Ic.print()}Print</button>
        <button className="lxh-tbtn" aria-disabled="true" title="Settings">{Ic.gear()}Settings</button>
        <button className="lxh-tbtn" aria-disabled="true" title="Help" style={{ padding: "0 8px" }}>{Ic.help(16)}</button>
        <AuthMenu iconOnly onSignIn={beginSignIn} onSignUp={beginSignUp} />
      </div>

      {/* Body */}
      <div className="lxh-body">
        {/* Left sidebar */}
        <div className="lxh-side">
          {SIDE_ITEMS.map((it) => (
            <button
              key={it.key}
              className={`lxh-side-item ${it.key === "home" ? "active" : ""}`}
              onClick={it.key === "recent" ? openPicker : undefined}
            >
              {it.icon}{it.label}
            </button>
          ))}
          <div className="lxh-side-sep" />
          <button className="lxh-side-item">{Ic.grid()}Tools</button>
          <div className="lxh-side-brand">
            <img src={`${import.meta.env.BASE_URL}brand/luxor-shield.png`} alt="" draggable={false} />
            <div className="lxh-brand-name">LUXOR</div>
            <div className="lxh-brand-sub">PDF READER</div>
            <div className="lxh-brand-tag">Smart. Fast. Secure.</div>
          </div>
        </div>

        {/* Center */}
        <div
          className={`lxh-main ${dragging ? "drag" : ""}`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <HeroIllustration />
          <div className="lxh-h1">No PDF Open</div>
          <div className="lxh-sub">Open a PDF file to start reading, reviewing, and managing your documents.</div>
          <button className="lxh-btn-primary" onClick={openPicker}>
            {Ic.folder(16)}Open File
          </button>
          <button className="lxh-btn-secondary" onClick={openPicker}>
            {Ic.clock(14)}Browse Recent Files
          </button>
        </div>

        {/* Right column */}
        <div className="lxh-right">
          <div className="lxh-card">
            <div className="lxh-card-head">
              <span className="lxh-card-ic" style={{ background: "#fdeeee", color: "#d21f2f" }}>{Ic.clock(14)}</span>
              <span className="lxh-card-title">Recent Documents</span>
              <button className="lxh-viewall" onClick={openPicker}>View All</button>
            </div>
            {recents.length === 0 ? (
              <div className="lxh-empty">
                <EmptyDocsIllustration />
                <div className="lxh-empty-t">No recent documents yet.<br/>Open a PDF file to see it here.</div>
              </div>
            ) : (
              recents.slice(0, 4).map((r) => (
                <button
                  key={`${r.name}::${r.size}::${r.lastModified}`}
                  className="lxh-recent-item"
                  title="Browsers can't reopen local files automatically — this reopens the file picker"
                  onClick={openPicker}
                >
                  <span style={{ color: "#d21f2f", flexShrink: 0, display: "flex" }}>{Ic.folder(15)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="lxh-recent-name" style={{ display: "block" }}>{r.name}</span>
                    <span className="lxh-recent-meta" style={{ display: "block" }}>
                      {r.pages} page{r.pages === 1 ? "" : "s"} · {formatFileSize(r.size)} · {timeAgo(r.openedAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="lxh-card">
            <div className="lxh-card-head" style={{ marginBottom: 8 }}>
              <span className="lxh-card-ic" style={{ background: "#fdf6e3", color: "#d99a06" }}>{Ic.bulb()}</span>
              <span className="lxh-card-title">Tips</span>
            </div>
            <div className="lxh-tip">
              <span className="lxh-tip-quote">&ldquo;</span>
              <span className="lxh-tip-text">{TIPS[tip]}</span>
              <span className="lxh-tip-quote" style={{ alignSelf: "flex-end" }}>&rdquo;</span>
            </div>
            <div className="lxh-dots">
              {TIPS.map((_, i) => (
                <button key={i} className={`lxh-dot ${i === tip ? "on" : ""}`} onClick={() => setTip(i)} aria-label={`Tip ${i + 1}`} />
              ))}
            </div>
          </div>

          <div className="lxh-card">
            <div className="lxh-card-title" style={{ marginBottom: 12 }}>Reader Features</div>
            <div className="lxh-feat-grid">
              {FEATURES.map((f) => (
                <div key={f.label} className="lxh-feat">
                  <span className="lxh-feat-ic" style={{ background: f.bg, color: f.color }}>{f.icon}</span>
                  <span className="lxh-feat-label">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="lxh-status">
        <button className="sbtn" aria-disabled="true" title="Panels">{Ic.panel()}</button>
        <span style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 6 }}>
          <button className="sbtn" aria-disabled="true" aria-label="Previous page">{Ic.chevL()}</button>
          <button className="sbtn" aria-disabled="true" aria-label="Next page">{Ic.chevR()}</button>
        </span>
        <span className="lxh-page-box">– / –</span>
        <div style={{ flex: 1 }} />
        <span>100%</span>
        <input className="lxh-range" type="range" min={0} max={100} value={50} readOnly aria-disabled="true" aria-label="Zoom" />
        <button className="sbtn" aria-disabled="true" aria-label="Zoom out" style={{ fontSize: 14 }}>−</button>
        <button className="sbtn" aria-disabled="true" aria-label="Zoom in" style={{ fontSize: 14 }}>+</button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={onInputChange}
      />
    </div>
  );
}
