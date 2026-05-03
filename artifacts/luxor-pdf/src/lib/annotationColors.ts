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

/**
 * Shiny, marker-like highlight palette. Saturated hex + ~0.56 alpha
 * gives a fresh fluorescent-marker look — vivid and luminous on white
 * paper while still leaving text readable. Grey is dialed back to 0.52
 * so it doesn't muddy text. Yellow is the default to match the
 * traditional highlighter feel.
 */
export const HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Yellow",  value: "#FFEB3B", opacity: 0.56 },
  { name: "Green",   value: "#7CFF5B", opacity: 0.56 },
  { name: "Blue",    value: "#64D2FF", opacity: 0.56 },
  { name: "Cyan",    value: "#4DFFFF", opacity: 0.56 },
  { name: "Pink",    value: "#FF6FCF", opacity: 0.56 },
  { name: "Magenta", value: "#FF4DDA", opacity: 0.56 },
  { name: "Red",     value: "#FF5252", opacity: 0.56 },
  { name: "Violet",  value: "#B97CFF", opacity: 0.56 },
  { name: "Grey",    value: "#C7D0D9", opacity: 0.52 },
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
  highlightColor: HIGHLIGHT_COLORS[0].value,   // Yellow #FFEB3B
  highlightOpacity: HIGHLIGHT_COLORS[0].opacity, // 0.56
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
