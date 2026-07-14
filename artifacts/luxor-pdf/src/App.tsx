import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Home from "@/pages/Home";

// The viewer (and its pdfjs dependency) is by far the heaviest part of the
// app — lazy-load it so the home screen paints instantly.
const Viewer = lazy(() => import("@/pages/Viewer"));
const IconGallery = lazy(() => import("@/pages/IconGallery"));
import { AuthGateProvider } from "@/components/AuthGate";
import BrandSplash, { shouldShowBrandSplash } from "@/components/BrandSplash";
import TabBar from "@/components/TabBar";
import { initDesktopFileOpen } from "@/lib/desktopBridge";

function shouldShowIconGallery(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  if (sp.has("icons")) return true;
  return window.location.pathname.replace(/\/+$/, "").endsWith("/icons");
}

interface DocTab {
  id: string;
  file: File;
  /** Incremented to ask this tab's Viewer to run its close flow
   *  (including the unsaved-changes confirmation). */
  closeSignal: number;
}

const fileKey = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;
let nextTabId = 1;

export default function App() {
  const [tabs, setTabs] = useState<DocTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(shouldShowBrandSplash);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Keep a live mirror so stable callbacks can read the current tabs
  // without being recreated on every change.
  const tabsRef = useRef<DocTab[]>(tabs);
  tabsRef.current = tabs;

  /** Open a PDF in a new tab — or focus the existing tab if the exact
   *  same file (name + size + mtime) is already open. */
  const openFile = useCallback((f: File) => {
    const existing = tabsRef.current.find((t) => fileKey(t.file) === fileKey(f));
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = `tab-${nextTabId++}`;
    setTabs((prev) => [...prev, { id, file: f, closeSignal: 0 }]);
    setActiveId(id);
  }, []);

  /** In-viewer "Open" swaps the document inside the same tab (after the
   *  Viewer's own unsaved-changes flow has been resolved). */
  const replaceTabFile = useCallback((tabId: string, f: File) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, file: f } : t)));
  }, []);

  /** Tab-strip close button: focus the tab first (its confirmation
   *  dialog lives inside the Viewer), then ask it to close itself. */
  const requestClose = useCallback((tabId: string) => {
    setActiveId(tabId);
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, closeSignal: t.closeSignal + 1 } : t)),
    );
  }, []);

  /** Called by a Viewer once it has actually closed. */
  const removeTab = useCallback((tabId: string) => {
    const prev = tabsRef.current;
    const idx = prev.findIndex((t) => t.id === tabId);
    const next = prev.filter((t) => t.id !== tabId);
    setTabs(next);
    setActiveId((curr) =>
      curr === tabId ? (next[Math.min(Math.max(idx, 0), next.length - 1)]?.id ?? null) : curr,
    );
  }, []);

  // Desktop shell: open PDFs double-clicked in Windows (file association).
  useEffect(() => {
    initDesktopFileOpen(openFile);
  }, [openFile]);

  // Reserve room for the tab strip: fixed-position chrome (toolbar,
  // panels, viewer) all offset themselves by --tabbar-height.
  const hasTabs = tabs.length > 0;
  useEffect(() => {
    const el = document.documentElement;
    if (hasTabs) el.style.setProperty("--tabbar-height", "36px");
    else el.style.removeProperty("--tabbar-height");
    return () => {
      el.style.removeProperty("--tabbar-height");
    };
  }, [hasTabs]);

  const handleAddTabPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    openFile(f);
  };

  if (shouldShowIconGallery()) {
    return (
      <Suspense fallback={null}>
        <IconGallery />
      </Suspense>
    );
  }

  return (
    <AuthGateProvider>
      {showSplash && <BrandSplash onDone={() => setShowSplash(false)} />}
      {hasTabs && (
        <>
          <TabBar
            tabs={tabs.map((t) => ({ id: t.id, name: t.file.name }))}
            activeId={activeId}
            onSelect={setActiveId}
            onCloseTab={requestClose}
            onNewTab={() => addInputRef.current?.click()}
          />
          <input
            ref={addInputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            data-testid="tab-add-input"
            onChange={handleAddTabPick}
          />
        </>
      )}
      {/* Every open tab stays mounted so each keeps its own document,
          scroll position, zoom, and edits; inactive ones are hidden. */}
      {tabs.map((t) => (
        <div key={t.id} style={t.id === activeId ? undefined : { display: "none" }}>
          <Suspense fallback={null}>
          <Viewer
            file={t.file}
            active={t.id === activeId}
            closeSignal={t.closeSignal}
            onClose={() => removeTab(t.id)}
            onFileLoad={(f) => replaceTabFile(t.id, f)}
          />
          </Suspense>
        </div>
      ))}
      {!hasTabs && <Home onFileLoad={openFile} />}
    </AuthGateProvider>
  );
}
