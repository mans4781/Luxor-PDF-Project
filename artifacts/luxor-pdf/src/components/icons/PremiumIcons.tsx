/**
 * Three premium 3D-soft toolbar icons for the Luxor PDF Reader:
 * Eraser, Highlighter, Pen. All three share one design system —
 * a rounded white tile (radius 22 / 128), soft drop shadow, glossy
 * gradients, crisp edges — so they read as one matching family.
 *
 * Each icon is authored on a 128x128 canvas and accepts a `size`
 * prop. Pure SVG, no external assets, no copyrighted artwork.
 */

import { forwardRef, type SVGProps } from "react";

export type PremiumIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  /** Show the rounded white tile background. Defaults to true. */
  tile?: boolean;
};

const VB = 128;

/** Shared rounded white tile + soft drop shadow used by all 3 icons. */
function Tile({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${idPrefix}-tile`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EEF1F5" />
        </linearGradient>
        <filter id={`${idPrefix}-tileShadow`} x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0B1220" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect
        x="4"
        y="4"
        width={VB - 8}
        height={VB - 8}
        rx="22"
        ry="22"
        fill={`url(#${idPrefix}-tile)`}
        stroke="#D8DEE6"
        strokeWidth="1"
        filter={`url(#${idPrefix}-tileShadow)`}
      />
    </>
  );
}

/* ─────────────────────────── ERASER ─────────────────────────── */

export const EraserIcon = forwardRef<SVGSVGElement, PremiumIconProps>(function EraserIcon(
  { size = 64, tile = true, ...rest },
  ref,
) {
  const id = "eraser";
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {tile && <Tile idPrefix={id} />}
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8A7A" />
          <stop offset="55%" stopColor="#F0533F" />
          <stop offset="100%" stopColor="#C12A1B" />
        </linearGradient>
        <linearGradient id={`${id}-tip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDE3EA" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* contact shadow on the tile */}
      <ellipse cx="64" cy="104" rx="34" ry="4.5" fill="#000" opacity="0.18" />

      {/* tilted eraser group ~ -22deg */}
      <g transform="rotate(-22 64 64)" filter={`url(#${id}-shadow)`}>
        {/* white tip */}
        <path
          d="M22 70 L46 70 L46 86 L22 86 Z"
          fill={`url(#${id}-tip)`}
          stroke="#B8C0CB"
          strokeWidth="1"
        />
        {/* coral body */}
        <path
          d="M46 66 L106 66 L106 90 L46 90 Z"
          fill={`url(#${id}-body)`}
          stroke="#9A1F12"
          strokeWidth="1"
        />
        {/* divider seam */}
        <line x1="46" y1="66" x2="46" y2="90" stroke="#7E1A0F" strokeWidth="1.2" opacity="0.7" />
        {/* glossy top stripe */}
        <rect x="48" y="68" width="56" height="6" rx="3" fill={`url(#${id}-gloss)`} />
      </g>

      {/* eraser dust particles near tip */}
      <g fill="#9A6A5E" opacity="0.85">
        <circle cx="20" cy="100" r="1.6" />
        <circle cx="26" cy="106" r="1.2" />
        <circle cx="32" cy="100" r="1.4" />
        <circle cx="38" cy="107" r="1" />
        <circle cx="14" cy="106" r="1" />
      </g>
    </svg>
  );
});

/* ─────────────────────────── HIGHLIGHTER ─────────────────────── */

export const HighlighterIcon = forwardRef<SVGSVGElement, PremiumIconProps>(function HighlighterIcon(
  { size = 64, tile = true, ...rest },
  ref,
) {
  const id = "hl";
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {tile && <Tile idPrefix={id} />}
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="50%" stopColor="#FFE53B" />
          <stop offset="100%" stopColor="#E8B100" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
        <linearGradient id={`${id}-nib`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#0B1220" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFE53B" stopOpacity="0" />
          <stop offset="20%" stopColor="#FFE53B" stopOpacity="0.95" />
          <stop offset="80%" stopColor="#FFD500" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFD500" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* yellow highlight stroke under the nib */}
      <rect x="20" y="92" width="88" height="12" rx="6" fill={`url(#${id}-stroke)`} opacity="0.95" />

      {/* tilted highlighter group ~ -38deg */}
      <g transform="rotate(-38 64 60)" filter={`url(#${id}-shadow)`}>
        {/* yellow body */}
        <path
          d="M28 50 L88 50 L88 72 L28 72 Z"
          fill={`url(#${id}-body)`}
          stroke="#A8810A"
          strokeWidth="1"
        />
        {/* gloss stripe */}
        <rect x="30" y="52" width="56" height="5" rx="2.5" fill={`url(#${id}-gloss)`} />

        {/* dark cap on the right */}
        <path
          d="M88 48 L106 52 L106 70 L88 74 Z"
          fill={`url(#${id}-cap)`}
          stroke="#0B1220"
          strokeWidth="1"
        />
        {/* cap ring */}
        <line x1="88" y1="50" x2="88" y2="72" stroke="#0B1220" strokeWidth="1.5" />

        {/* dark angled chisel nib on the left */}
        <path
          d="M28 50 L14 56 L14 66 L28 72 Z"
          fill={`url(#${id}-nib)`}
          stroke="#0B1220"
          strokeWidth="1"
        />
        {/* nib edge highlight */}
        <line x1="14" y1="56" x2="14" y2="66" stroke="#FFE082" strokeWidth="1.4" opacity="0.85" />
      </g>
    </svg>
  );
});

/* ─────────────────────────── PEN / DRAW ─────────────────────── */

export const PenIcon = forwardRef<SVGSVGElement, PremiumIconProps>(function PenIcon(
  { size = 64, tile = true, ...rest },
  ref,
) {
  const id = "pen";
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {tile && <Tile idPrefix={id} />}
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="55%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#0B1220" />
        </linearGradient>
        <linearGradient id={`${id}-tip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6F6F" />
          <stop offset="100%" stopColor="#B71C1C" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF5252" stopOpacity="0" />
          <stop offset="25%" stopColor="#FF3030" stopOpacity="1" />
          <stop offset="75%" stopColor="#D32F2F" stopOpacity="1" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <filter id={`${id}-strokeShadow`} x="-10%" y="-50%" width="120%" height="200%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#B71C1C" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* red curved stroke under the pen */}
      <path
        d="M22 100 C 40 86, 60 116, 80 96 S 110 88, 112 96"
        fill="none"
        stroke={`url(#${id}-stroke)`}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#${id}-strokeShadow)`}
      />

      {/* tilted pen group ~ -42deg */}
      <g transform="rotate(-42 64 60)" filter={`url(#${id}-shadow)`}>
        {/* dark body */}
        <path
          d="M30 52 L96 52 L96 68 L30 68 Z"
          fill={`url(#${id}-body)`}
          stroke="#0B1220"
          strokeWidth="1"
        />
        {/* gloss stripe */}
        <rect x="32" y="54" width="60" height="4" rx="2" fill={`url(#${id}-gloss)`} />
        {/* metallic ferrule */}
        <rect x="22" y="51" width="10" height="18" fill="#9CA3AF" stroke="#0B1220" strokeWidth="1" />
        <line x1="26" y1="52" x2="26" y2="68" stroke="#E5E7EB" strokeWidth="1" />
        {/* red conical tip */}
        <path
          d="M22 51 L8 60 L22 69 Z"
          fill={`url(#${id}-tip)`}
          stroke="#7A0F0F"
          strokeWidth="1"
        />
        {/* tip highlight */}
        <path d="M22 53 L13 60 L22 67" fill="none" stroke="#FFB3B3" strokeWidth="1.2" opacity="0.7" />
        {/* end cap */}
        <rect x="96" y="51" width="6" height="18" rx="1.5" fill="#0B1220" />
      </g>
    </svg>
  );
});

export const PREMIUM_ICONS = [
  { key: "eraser",      label: "Eraser",      Component: EraserIcon },
  { key: "highlighter", label: "Highlighter", Component: HighlighterIcon },
  { key: "pen",         label: "Draw / Pen",  Component: PenIcon },
] as const;
