import { ReactNode } from "react";

interface StatusBarProps {
  viewControls: ReactNode;
  fileName?: string;
}

export default function StatusBar({ viewControls, fileName }: StatusBarProps) {
  return (
    <div className="luxor-statusbar">
      <div style={{ flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
        {fileName && (
          <span className="statusbar-filename" title={fileName}>
            {fileName}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {viewControls}
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}
