import { useState } from "react";
import { pickDirectory, saveFile, saveFileToDir } from "./save-file";

export function useDestinationFolder() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const supported =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  async function chooseFolder() {
    const handle = await pickDirectory();
    if (handle) setDirHandle(handle);
  }

  function clearFolder() {
    setDirHandle(null);
  }

  async function saveToDestination(blob: Blob, filename: string): Promise<void> {
    if (dirHandle) {
      await saveFileToDir(dirHandle, blob, filename);
    } else {
      await saveFile(blob, filename);
    }
  }

  return { dirHandle, supported, chooseFolder, clearFolder, saveToDestination };
}
