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
 * Crisp, premium fluorescent-marker palette — 7 saturated hex values
 * with per-color alphas tuned so the color stays *vibrant* on white
 * PDF paper while the black text underneath remains sharp.
 *
 * Yellow uses a higher alpha (0.72) because pure yellow on white tends
 * to wash out otherwise. Stronger primaries (Red, Cyan) sit slightly
 * lower so the underlying text doesn't get tinted too darkly.
 *
 * The renderer paints these as `rgba(R, G, B, alpha)` directly on the
 * page — no `multiply` blend, no dulling overlay — so what you see is
 * exactly the configured color at the configured alpha.
 */
/**
 * New ChatGPT-style soft highlight palette. Replaces the older 7-color
 * neon set (Yellow #FFF200, Green #39FF14, Blue #00BFFF, Pink #FF4FB8,
 * Red #FF3030, Cyan #00FFFF, Violet #A855FF). The new shades are
 * intentionally lower-saturation so the underlying text stays sharp and
 * readable, and so the live drag-select preview matches the committed
 * highlight color exactly. Order is the user-specified order.
 */
export const HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Green",  value: "#4CAF50", opacity: 0.24 },
  { name: "Yellow", value: "#FFD600", opacity: 0.28 },
  { name: "Red",    value: "#F44336", opacity: 0.22 },
  { name: "Violet", value: "#7E57C2", opacity: 0.22 },
  { name: "Grey",   value: "#9E9E9E", opacity: 0.22 },
];

/**
 * Quick-highlight palette shown in the floating toolbar that pops up over
 * a live text selection (Yellow / Green / Blue / Pink / Violet / Red, in
 * that order — the set the user requested). Each swatch carries its own
 * opacity so the committed highlight reads vibrant while leaving the text
 * sharp.
 */
export const QUICK_HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Yellow", value: "#FFD600", opacity: 0.28 },
  { name: "Green",  value: "#4CAF50", opacity: 0.24 },
  { name: "Blue",   value: "#2196F3", opacity: 0.26 },
  { name: "Pink",   value: "#EC407A", opacity: 0.24 },
  { name: "Violet", value: "#9C27B0", opacity: 0.26 },
  { name: "Red",    value: "#F44336", opacity: 0.26 },
];

/** Fixed blue tint used by the live text-selection overlay (matches the
 *  reference design — selection is always blue regardless of the picked
 *  highlight color). */
export const SELECTION_BLUE = "rgba(37, 99, 235, 0.28)";

/**
 * Soft, ChatGPT-style translucent shades used as the live text-selection
 * preview before the user commits the highlight. These are intentionally
 * lower-saturation than the final HIGHLIGHT_COLORS so the selected text
 * stays sharp and readable while dragging. The map is keyed by the
 * highlight swatch hex so the selection preview can mirror whichever
 * highlight color the user has currently picked. Anything not in the map
 * (e.g. Grey from a future palette) falls back to SELECTION_PREVIEW_DEFAULT.
 */
export const SELECTION_PREVIEW_DEFAULT = "rgba(0, 120, 255, 0.25)";

export const SELECTION_PREVIEW_BY_HIGHLIGHT: Record<string, string> = {
  "#4CAF50": "rgba(76, 175, 80, 0.24)",   // Green
  "#FFD600": "rgba(255, 214, 0, 0.28)",   // Yellow
  "#F44336": "rgba(244, 67, 54, 0.22)",   // Red
  "#7E57C2": "rgba(126, 87, 194, 0.22)",  // Violet
  "#9E9E9E": "rgba(158, 158, 158, 0.22)", // Grey
  "#2196F3": "rgba(33, 150, 243, 0.26)",  // Blue
  "#EC407A": "rgba(236, 64, 122, 0.24)",  // Pink
};

/** Resolve a highlight hex to its soft selection-preview shade. */
export function getSelectionPreview(highlightHex: string): string {
  return (
    SELECTION_PREVIEW_BY_HIGHLIGHT[highlightHex.toUpperCase()] ??
    SELECTION_PREVIEW_BY_HIGHLIGHT[highlightHex] ??
    SELECTION_PREVIEW_DEFAULT
  );
}

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

/**
 * Font family options for the Add-Text tool. The annotation stores the
 * stable `key`; the renderer resolves it to a CSS font-family stack via
 * `fontFamilyCss()`. Keys map cleanly onto the PDF base-14 families so the
 * choice can later be honored when text is flattened into an exported PDF.
 */
export type FontSwatch = { key: string; label: string; css: string };

export const TEXT_FONTS: FontSwatch[] = [
  { key: "times",     label: "Times",     css: "'Times New Roman', Times, serif" },
  { key: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { key: "courier",   label: "Courier",   css: "'Courier New', Courier, monospace" },
  { key: "georgia",   label: "Georgia",   css: "Georgia, 'Times New Roman', serif" },
  { key: "verdana",   label: "Verdana",   css: "Verdana, Geneva, sans-serif" },
];

/** Default font key — Times, matching the legacy hardcoded look. */
export const DEFAULT_FONT_KEY = "times";

/** Resolve a font key to its CSS font-family stack (falls back to Times). */
export function fontFamilyCss(key?: string): string {
  return TEXT_FONTS.find((f) => f.key === key)?.css ?? TEXT_FONTS[0].css;
}

/** Thickness slider range for every drawing tool. */
export const DRAW_THICKNESS = {
  min: 1,
  max: 10,
  default: 3,
} as const;

/** Default highlight = Yellow (index 1 in the new palette). */
const DEFAULT_HIGHLIGHT_INDEX = 1;
export const DEFAULTS = {
  highlightColor: HIGHLIGHT_COLORS[DEFAULT_HIGHLIGHT_INDEX].value,   // Yellow #FFD600
  highlightOpacity: HIGHLIGHT_COLORS[DEFAULT_HIGHLIGHT_INDEX].opacity, // 0.28
  penColor: "#0D62F2",                         // Bright Blue
  penWidth: DRAW_THICKNESS.default,            // 3px
  underlineColor: "#0D62F2",
  strikeColor: "#F21E1E",
  textColor: "#000000",
  textSize: 16,
  textFont: "times",
} as const;

/** Look up the opacity that ships with a highlight swatch (fallback 0.5). */
export function highlightOpacityFor(hex: string): number {
  return HIGHLIGHT_COLORS.find((c) => c.value.toLowerCase() === hex.toLowerCase())?.opacity ?? 0.5;
}
