import { Folder, FolderOpen, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DestinationFolderPickerProps {
  dirHandle: FileSystemDirectoryHandle | null;
  supported: boolean;
  folderError?: string | null;
  onChoose: () => void;
  onClear: () => void;
  testId?: string;
}

export function DestinationFolderPicker({
  dirHandle,
  supported,
  folderError,
  onChoose,
  onClear,
  testId = "button-choose-folder",
}: DestinationFolderPickerProps) {
  if (!supported) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm">
        {dirHandle ? (
          <FolderOpen className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-slate-400 shrink-0" />
        )}

        <span className="text-muted-foreground shrink-0 text-xs">Save to:</span>

        {dirHandle ? (
          <>
            <span className="font-medium truncate flex-1 text-emerald-700">
              {dirHandle.name}/
            </span>
            <button
              onClick={onClear}
              title="Reset to default (Downloads)"
              className="text-slate-400 hover:text-destructive transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="text-muted-foreground italic flex-1 text-xs">
            Downloads (default)
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onChoose}
          data-testid={testId}
          className="shrink-0 text-xs h-7 px-2"
        >
          {dirHandle ? "Change" : "Choose folder"}
        </Button>
      </div>

      {folderError && (
        <div className="flex items-start gap-1.5 text-xs text-destructive px-1">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{folderError}</span>
        </div>
      )}
    </div>
  );
}
