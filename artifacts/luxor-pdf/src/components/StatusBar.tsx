import { ReactNode } from "react";

interface StatusBarProps {
  viewControls: ReactNode;
}

export default function StatusBar({ viewControls }: StatusBarProps) {
  return (
    <div className="luxor-statusbar">
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {viewControls}
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}
