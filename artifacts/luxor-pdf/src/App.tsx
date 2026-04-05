import { useState } from "react";
import Home from "@/pages/Home";
import Viewer from "@/pages/Viewer";

export default function App() {
  const [file, setFile] = useState<File | null>(null);

  if (file) {
    return <Viewer file={file} onClose={() => setFile(null)} />;
  }

  return <Home onFileLoad={setFile} />;
}
