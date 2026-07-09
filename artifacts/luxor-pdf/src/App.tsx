import { useEffect, useState } from "react";
import Home from "@/pages/Home";
import Viewer from "@/pages/Viewer";
import IconGallery from "@/pages/IconGallery";
import { AuthGateProvider } from "@/components/AuthGate";
import { initDesktopFileOpen } from "@/lib/desktopBridge";

function shouldShowIconGallery(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  if (sp.has("icons")) return true;
  return window.location.pathname.replace(/\/+$/, "").endsWith("/icons");
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);

  // Desktop shell: open PDFs double-clicked in Windows (file association).
  useEffect(() => {
    initDesktopFileOpen(setFile);
  }, []);

  if (shouldShowIconGallery()) {
    return <IconGallery />;
  }

  return (
    <AuthGateProvider>
      {file ? (
        <Viewer file={file} onClose={() => setFile(null)} onFileLoad={setFile} />
      ) : (
        <Home onFileLoad={setFile} />
      )}
    </AuthGateProvider>
  );
}
