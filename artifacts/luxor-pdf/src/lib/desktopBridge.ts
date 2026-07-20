// Integration with the Luxor PDF Reader desktop shell (Electron).
//
// When the app runs inside the desktop wrapper, `window.luxor` is exposed by
// the preload script. If the user double-clicked a PDF in Windows (the
// installer registers a .pdf file association), the shell reads the bytes in
// the main process and hands them over here so the viewer can open them.

interface DesktopOpenedFile {
  name: string;
  data: Uint8Array;
}

type DesktopWindowAction = "minimize" | "maximize-toggle" | "close";

interface LuxorDesktopBridge {
  isDesktop?: boolean;
  getDeviceId?: () => Promise<string>;
  getPendingFile?: () => Promise<DesktopOpenedFile | null>;
  onOpenFile?: (callback: (file: DesktopOpenedFile) => void) => void;
  windowControl?: (action: DesktopWindowAction) => Promise<boolean>;
}

declare global {
  interface Window {
    luxor?: LuxorDesktopBridge;
  }
}

export function isDesktopShell(): boolean {
  return window.luxor?.isDesktop === true;
}

/**
 * Drive the frameless desktop window from the in-app red title bar.
 * Returns false (and does nothing) outside the desktop shell or on
 * older shells without the handler.
 */
export function desktopWindowControl(action: DesktopWindowAction): boolean {
  const bridge = window.luxor;
  if (bridge?.isDesktop !== true || !bridge.windowControl) return false;
  void bridge.windowControl(action).catch(() => {});
  return true;
}

function toFile(opened: DesktopOpenedFile): File {
  return new File([opened.data as BlobPart], opened.name, {
    type: "application/pdf",
  });
}

/**
 * Wire up desktop "open with" support. Fetches the file the app was
 * launched with (if any) and subscribes to files opened while the app is
 * already running. No-op outside the desktop shell.
 */
export function initDesktopFileOpen(onFile: (file: File) => void): void {
  const bridge = window.luxor;
  if (!bridge?.isDesktop) return;

  if (bridge.getPendingFile) {
    void bridge
      .getPendingFile()
      .then((opened) => {
        if (opened) onFile(toFile(opened));
      })
      .catch(() => {
        // Older shell versions without the handler — ignore.
      });
  }

  bridge.onOpenFile?.((opened) => {
    onFile(toFile(opened));
  });
}
