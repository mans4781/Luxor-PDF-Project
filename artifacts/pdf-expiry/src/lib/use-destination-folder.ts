import { useState } from "react";
import { pickDirectory, saveFile, saveFileToDir } from "./save-file";

export function useDestinationFolder() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  async function chooseFolder() {
    setFolderError(null);
    try {
      const handle = await pickDirectory();
      if (handle) setDirHandle(handle);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not open folder picker. Try opening the app in its own browser tab.";
      setFolderError(msg);
    }
  }

  function clearFolder() {
    setDirHandle(null);
    setFolderError(null);
  }

  async function saveToDestination(blob: Blob, filename: string): Promise<void> {
    if (dirHandle) {
      await saveFileToDir(dirHandle, blob, filename);
    } else {
      await saveFile(blob, filename);
    }
  }

  return { dirHandle, supported, folderError, chooseFolder, clearFolder, saveToDestination };
}
