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
 * Luxor highlighter palette — the exact six hues the user selected. The
 * renderer paints these as solid hex on a dedicated overlay canvas that
 * uses CSS `mix-blend-mode: multiply` (screen in night mode), so the
 * background takes the exact swatch color while the black text underneath
 * stays fully intact. Order runs across the hue wheel:
 *   Yellow #FFFF00, Lime #80FF00, Green #00FF80, Cyan #00AEFF,
 *   Blue #007FFF, Pink #FF0080.
 * The `opacity` field is retained only as stored annotation data; on-screen
 * display is full-opacity because the blend mode does the see-through work.
 */
export const HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Yellow", value: "#FFFF00", opacity: 0.50 },
  { name: "Lime",   value: "#80FF00", opacity: 0.50 },
  { name: "Green",  value: "#00FF80", opacity: 0.50 },
  { name: "Cyan",   value: "#00AEFF", opacity: 0.50 },
  { name: "Blue",   value: "#007FFF", opacity: 0.50 },
  { name: "Pink",   value: "#FF0080", opacity: 0.50 },
];

/**
 * Quick-highlight palette shown in the floating toolbar that pops up over a
 * live text selection. Uses the same six user-selected hues in the same
 * order as HIGHLIGHT_COLORS for one consistent color system.
 */
export const QUICK_HIGHLIGHT_COLORS: HighlightSwatch[] = [
  { name: "Yellow", value: "#FFFF00", opacity: 0.50 },
  { name: "Lime",   value: "#80FF00", opacity: 0.50 },
  { name: "Green",  value: "#00FF80", opacity: 0.50 },
  { name: "Cyan",   value: "#00AEFF", opacity: 0.50 },
  { name: "Blue",   value: "#007FFF", opacity: 0.50 },
  { name: "Pink",   value: "#FF0080", opacity: 0.50 },
];

/** Fixed cyan tint (#00D4FF) used by the live text-selection overlay —
 *  the selection color stays the same regardless of the picked highlight
 *  color. */
export const SELECTION_BLUE = "rgba(0, 212, 255, 0.30)";

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
  "#FFFF00": "rgba(255, 255, 0, 0.50)",   // Yellow
  "#80FF00": "rgba(128, 255, 0, 0.50)",   // Lime
  "#00FF80": "rgba(0, 255, 128, 0.50)",   // Green
  "#00AEFF": "rgba(0, 174, 255, 0.50)",   // Cyan
  "#007FFF": "rgba(0, 127, 255, 0.50)",   // Blue
  "#FF0080": "rgba(255, 0, 128, 0.50)",   // Pink
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

/** Default highlight = Yellow (index 0 in the palette). */
const DEFAULT_HIGHLIGHT_INDEX = 0;
export const DEFAULTS = {
  highlightColor: HIGHLIGHT_COLORS[DEFAULT_HIGHLIGHT_INDEX].value,   // Yellow #FFFF00
  highlightOpacity: HIGHLIGHT_COLORS[DEFAULT_HIGHLIGHT_INDEX].opacity, // 0.50
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
