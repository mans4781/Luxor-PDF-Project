/**
 * Premium icon gallery — preview the Eraser / Highlighter / Pen
 * icons at multiple sizes and download them as SVG or PNG.
 *
 * Reachable from the app at  ?icons=1  (or  /luxor-pdf/?icons=1 ).
 */

import { useRef, useState } from "react";
import {
  PREMIUM_ICONS,
  type PremiumIconProps,
} from "@/components/icons/PremiumIcons";
import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from "react";

const PREVIEW_SIZES = [24, 32, 48, 64];
const PNG_SIZES = [24, 32, 48, 64, 128, 256, 512, 1024];

type IconComponent =
  | ComponentType<PremiumIconProps>
  | ForwardRefExoticComponent<PremiumIconProps & RefAttributes<SVGSVGElement>>;

function svgMarkup(IconComp: IconComponent, size = 1024, tile = true): string {
  // Render the component to a string by mounting it via a temporary
  // off-screen container. Avoids the cost of pulling in renderToString
  // from react-dom/server.
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // We can't easily render a React component to a string here without
  // ReactDOMServer, so instead we grab the live <svg> element rendered
  // in the gallery via its data attribute.
  void svg; void IconComp; void size; void tile;
  return "";
}

function liveSvgString(svgEl: SVGSVGElement, size: number): string {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function svgToPng(svgString: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no 2d context"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg load failed"));
    };
    img.src = url;
  });
}

export default function IconGallery() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // Refs to the master SVG for each icon (rendered at 256px, used as
  // the source for PNG export and for the SVG download).
  const refs = useRef<Record<string, SVGSVGElement | null>>({});

  const downloadSvg = (key: string, label: string) => {
    const el = refs.current[key];
    if (!el) return;
    const str = liveSvgString(el, 1024);
    downloadBlob(new Blob([str], { type: "image/svg+xml;charset=utf-8" }), `${label.toLowerCase().replace(/\s+/g, "-")}.svg`);
  };

  const downloadPng = async (key: string, label: string, size: number) => {
    const el = refs.current[key];
    if (!el) return;
    const str = liveSvgString(el, size);
    try {
      const blob = await svgToPng(str, size);
      downloadBlob(blob, `${label.toLowerCase().replace(/\s+/g, "-")}-${size}.png`);
    } catch (err) {
      console.error("PNG export failed", err);
    }
  };

  void svgMarkup; // silence unused

  const isDark = theme === "dark";
  const bg = isDark ? "#0B1220" : "#F8FAFC";
  const fg = isDark ? "#E5E7EB" : "#0B1220";
  const subFg = isDark ? "#9CA3AF" : "#475569";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const cardBorder = isDark ? "#1F2937" : "#E5E7EB";
  const btnBg = isDark ? "#1F2937" : "#F1F5F9";
  const btnFg = isDark ? "#E5E7EB" : "#0B1220";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, padding: "32px 24px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.3 }}>Luxor PDF — Premium Icons</h1>
            <p style={{ margin: "6px 0 0", color: subFg, fontSize: 14 }}>
              One matching family of toolbar icons. Original SVG, no copyrighted assets. Works at 24px through 1024px.
            </p>
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={{ background: btnBg, color: btnFg, border: `1px solid ${cardBorder}`, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 28 }}>
          {PREMIUM_ICONS.map(({ key, label, Component }) => (
            <div
              key={key}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 14,
                padding: 20,
                boxShadow: isDark ? "0 1px 0 rgba(255,255,255,0.04)" : "0 1px 2px rgba(15,23,42,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 17 }}>{label}</h2>
                <span style={{ fontSize: 11, color: subFg, textTransform: "uppercase", letterSpacing: 0.6 }}>SVG</span>
              </div>

              {/* hero preview */}
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 22px" }}>
                <Component
                  ref={(el: SVGSVGElement | null) => { refs.current[key] = el; }}
                  size={128}
                />
              </div>

              {/* size previews */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-end", justifyContent: "center", marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${cardBorder}` }}>
                {PREVIEW_SIZES.map((s) => (
                  <div key={s} style={{ textAlign: "center" }}>
                    <Component size={s} />
                    <div style={{ fontSize: 10, color: subFg, marginTop: 4 }}>{s}px</div>
                  </div>
                ))}
              </div>

              {/* downloads */}
              <div style={{ marginBottom: 10, fontSize: 11, color: subFg, textTransform: "uppercase", letterSpacing: 0.6 }}>Download PNG</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {PNG_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => downloadPng(key, label, s)}
                    style={{
                      background: btnBg, color: btnFg,
                      border: `1px solid ${cardBorder}`,
                      padding: "6px 10px", borderRadius: 6,
                      cursor: "pointer", fontSize: 12, fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => downloadSvg(key, label)}
                style={{
                  width: "100%",
                  background: "#0D62F2", color: "#fff",
                  border: "none",
                  padding: "10px 14px", borderRadius: 8,
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                Download SVG
              </button>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 32, color: subFg, fontSize: 12, textAlign: "center" }}>
          Tip: open this page at <code>?icons=1</code> from anywhere in the PDF Reader.
        </p>
      </div>
    </div>
  );
}
