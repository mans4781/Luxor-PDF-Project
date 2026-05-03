/**
 * Central color configuration for the Luxor PDF Reader.
 *
 * One source of truth for every annotation tool's palette and defaults.
 * Mirrors Adobe Acrobat / Microsoft Edge conventions while keeping the
 * Luxor look. Soft pastels for highlights, professional blue for the pen,
 * black for text. New annotation code MUST read its colors from here so
 * the palette stays consistent across the toolbar, the right-click
 * popup, the renderer, and any future UI surface.
 *
 * Highlight colors are stored as solid hex; the renderer applies the
 * `opacity` field (default 0.5) via canvas globalAlpha. Pen / underline /
 * strike / text colors are opaque.
 */

export type ColorSwatch = { name: string; value: string };
export type HighlightSwatch = ColorSwatch & { opacity: number };

export const SELECTION = {
  /** Soft professional blue used by the live text-selection overlay. */
  color: "#B7D7F0",
  opacity: 0.5,
} as const;

export const HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Yellow", value: "#FFF176", opacity: 0.5 },
  { name: "Green",  value: "#A5D6A7", opacity: 0.5 },
  { name: "Blue",   value: "#90CAF9", opacity: 0.5 },
  { name: "Pink",   value: "#F8BBD0", opacity: 0.5 },
  { name: "Orange", value: "#FFCC80", opacity: 0.5 },
  { name: "Purple", value: "#CE93D8", opacity: 0.5 },
];

export const PEN_COLORS: ColorSwatch[] = [
  { name: "Black",  value: "#111827" },
  { name: "Blue",   value: "#1565C0" },
  { name: "Red",    value: "#D32F2F" },
  { name: "Green",  value: "#2E7D32" },
  { name: "Orange", value: "#EF6C00" },
  { name: "Purple", value: "#6A1B9A" },
  { name: "Gray",   value: "#4B5563" },
];

export const TEXT_COLORS: ColorSwatch[] = [
  { name: "Black",     value: "#111827" },
  { name: "Dark Blue", value: "#0D47A1" },
  { name: "Red",       value: "#B71C1C" },
  { name: "Green",     value: "#1B5E20" },
  { name: "Gray",      value: "#374151" },
  { name: "Purple",    value: "#4A148C" },
];

export const DEFAULTS = {
  highlightColor: HIGHLIGHT_COLORS[0].value,   // Yellow #FFF176
  highlightOpacity: HIGHLIGHT_COLORS[0].opacity,
  penColor: "#1565C0",
  penWidth: 3,
  underlineColor: "#1565C0",
  strikeColor: "#D32F2F",
  textColor: "#111827",
  textSize: 16,
} as const;

/** Look up the opacity that ships with a highlight swatch (fallback 0.5). */
export function highlightOpacityFor(hex: string): number {
  return HIGHLIGHT_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase())?.opacity ?? 0.5;
}
