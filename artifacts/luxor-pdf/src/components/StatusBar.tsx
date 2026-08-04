import { ReactNode } from "react";

interface StatusBarProps {
  viewControls: ReactNode;
  zoomSlider?: ReactNode;
}

export default function StatusBar({ viewControls, zoomSlider }: StatusBarProps) {
  return (
    <div className="luxor-statusbar">
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <img
          src={`${import.meta.env.BASE_URL}brand/luxor-shield.png`}
          alt=""
          draggable={false}
          style={{ width: 14, height: 17, objectFit: "contain", userSelect: "none" }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap" }}>
          Luxor <span style={{ color: "#d21f2f" }}>PDF</span> Reader
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {viewControls}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 0 }}>
        {zoomSlider}
      </div>
    </div>
  );
}
