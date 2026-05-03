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
  /** Bright yellow-green used by the live text-selection overlay. */
  color: "#C1F73B",
  opacity: 0.38,
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

/**
 * Premium 30-color palette shared by every drawing-related tool
 * (pen / freehand, line, arrow, oval, rectangle, add-text, and any
 * future ink tool). Arranged in 5 rows of 6 to render as a clean grid:
 *   row 1 - neutrals
 *   row 2 - warm vibrant
 *   row 3 - greens & cool tones
 *   row 4 - purple / brown
 *   row 5 - soft accents
 */
export const DRAW_PALETTE: ColorSwatch[] = [
  // Row 1 - neutrals
  { name: "Black",         value: "#000000" },
  { name: "Dark Gray",     value: "#666666" },
  { name: "Gray",          value: "#999999" },
  { name: "Light Gray",    value: "#BBBBBB" },
  { name: "Silver",        value: "#D0D0D0" },
  { name: "White",         value: "#F5F5F5" },
  // Row 2 - warm vibrant
  { name: "Deep Pink",     value: "#C21872" },
  { name: "Bright Red",    value: "#F21E1E" },
  { name: "Orange",        value: "#FF5A00" },
  { name: "Amber",         value: "#FFB000" },
  { name: "Golden",        value: "#F7C600" },
  { name: "Bright Yellow", value: "#F4E300" },
  // Row 3 - greens & cool tones
  { name: "Lime",          value: "#A8E61D" },
  { name: "Bright Green",  value: "#2EE600" },
  { name: "Dark Green",    value: "#0B8F5A" },
  { name: "Teal Cyan",     value: "#16A6C9" },
  { name: "Bright Blue",   value: "#0D62F2" },
  { name: "Deep Violet",   value: "#4B0FC6" },
  // Row 4 - purple / brown
  { name: "Violet",        value: "#6A17D6" },
  { name: "Purple",        value: "#7A0FA3" },
  { name: "Skin",          value: "#E8C9B5" },
  { name: "Tan",           value: "#C49766" },
  { name: "Brown",         value: "#9A5E2D" },
  { name: "Dark Brown",    value: "#6B4536" },
  // Row 5 - soft accents
  { name: "Light Pink",    value: "#E676E8" },
  { name: "Peach",         value: "#F4C06E" },
  { name: "Soft Yellow",   value: "#EFE86A" },
  { name: "Mint Green",    value: "#6DE48B" },
  { name: "Sky Blue",      value: "#74C8F0" },
  { name: "Lavender",      value: "#AFA6F5" },
];

/** Pen / draw tools share the full 30-color palette. */
export const PEN_COLORS: ColorSwatch[] = DRAW_PALETTE;

/** Add-Text reuses the same palette for one consistent color system. */
export const TEXT_COLORS: ColorSwatch[] = DRAW_PALETTE;

/** Thickness slider range for every drawing tool. */
export const DRAW_THICKNESS = {
  min: 1,
  max: 10,
  default: 3,
} as const;

export const DEFAULTS = {
  highlightColor: HIGHLIGHT_COLORS[0].value,   // Yellow #FFEB3B
  highlightOpacity: HIGHLIGHT_COLORS[0].opacity, // 0.56
  penColor: "#0D62F2",                         // Bright Blue
  penWidth: DRAW_THICKNESS.default,            // 3px
  underlineColor: "#0D62F2",
  strikeColor: "#F21E1E",
  textColor: "#000000",
  textSize: 16,
} as const;

/** Look up the opacity that ships with a highlight swatch (fallback 0.5). */
export function highlightOpacityFor(hex: string): number {
  return HIGHLIGHT_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase())?.opacity ?? 0.5;
}
