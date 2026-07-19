import { ReactNode } from "react";

interface StatusBarProps {
  viewControls: ReactNode;
  zoomSlider?: ReactNode;
}

export default function StatusBar({ viewControls, zoomSlider }: StatusBarProps) {
  return (
    <div className="luxor-statusbar">
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {viewControls}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}>
        {zoomSlider}
      </div>
    </div>
  );
}
