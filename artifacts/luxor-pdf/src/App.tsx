import { useState } from "react";
import Home from "@/pages/Home";
import Viewer from "@/pages/Viewer";
import IconGallery from "@/pages/IconGallery";

function shouldShowIconGallery(): boolean {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  if (sp.has("icons")) return true;
  return window.location.pathname.replace(/\/+$/, "").endsWith("/icons");
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);

  if (shouldShowIconGallery()) {
    return <IconGallery />;
  }

  if (file) {
    return <Viewer file={file} onClose={() => setFile(null)} />;
  }

  return <Home onFileLoad={setFile} />;
}
