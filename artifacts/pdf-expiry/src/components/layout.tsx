import { ReactNode } from "react";
import { Shield } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#f8f9fc",
        border: "4px solid transparent",
        backgroundImage: "linear-gradient(#f8f9fc,#f8f9fc), linear-gradient(135deg,#8b5cf6,#ec4899,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxSizing: "border-box",
      }}
    >
      {/* Header — logo + icons all on one row */}
      <header className="border-b bg-white overflow-hidden" style={{ height: 64 }}>
        <div className="relative h-full w-full">
          {/* SVG icons fill the full header width behind everything */}
          <svg
            viewBox="0 0 1280 64"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <defs>
              <filter id="docShadow2">
                <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.10)" />
              </filter>
            </defs>

            {/* All icons grouped — starts at x=260 (card left edge), scale 0.6, 200px spacing → ends at card right edge ~1025 */}
            <g transform="translate(260,0) scale(0.6)">

              {/* PDF Doc purple — x=0 */}
              <g transform="translate(0,8)" filter="url(#docShadow2)">
                <rect width="44" height="52" rx="5" fill="#fff" stroke="#ddd6fe" strokeWidth="1.5"/>
                <rect width="44" height="13" rx="5" fill="#8b5cf6"/>
                <rect y="7" width="44" height="6" fill="#8b5cf6"/>
                <text x="22" y="10.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
                <rect x="7" y="20" width="30" height="2.5" rx="1.2" fill="#ddd6fe"/>
                <rect x="7" y="26" width="22" height="2.5" rx="1.2" fill="#ddd6fe"/>
                <rect x="7" y="32" width="26" height="2.5" rx="1.2" fill="#ddd6fe"/>
                <rect x="7" y="38" width="18" height="2.5" rx="1.2" fill="#ddd6fe"/>
              </g>
              <circle cx="58" cy="53" r="5" fill="rgba(139,92,246,0.18)"/>
              <circle cx="72" cy="53" r="3.5" fill="rgba(139,92,246,0.12)"/>

              {/* Shield pink — x=200 */}
              <g transform="translate(200,6)">
                <path d="M28 2 L52 13 L52 36 C52 51 38 62 28 66 C18 62 4 51 4 36 L4 13 Z" fill="rgba(236,72,153,0.13)"/>
                <path d="M28 6 L48 16 L48 36 C48 49 36 58 28 62 C20 58 8 49 8 36 L8 16 Z" fill="none" stroke="#ec4899" strokeWidth="2.2"/>
                <rect x="20" y="30" width="16" height="13" rx="2.5" fill="#ec4899" opacity="0.85"/>
                <path d="M23 30 L23 25 C23 20 33 20 33 25 L33 30" fill="none" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="28" cy="37" r="2.5" fill="#fff"/>
              </g>
              <circle cx="258" cy="53" r="5" fill="rgba(236,72,153,0.18)"/>
              <circle cx="272" cy="53" r="3.5" fill="rgba(236,72,153,0.12)"/>

              {/* PDF Doc amber — x=400 */}
              <g transform="translate(400,8)" filter="url(#docShadow2)">
                <rect width="40" height="52" rx="5" fill="#fff" stroke="#fde68a" strokeWidth="1.5"/>
                <rect width="40" height="13" rx="5" fill="#f59e0b"/>
                <rect y="7" width="40" height="6" fill="#f59e0b"/>
                <text x="20" y="10.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
                <rect x="6" y="20" width="28" height="2.5" rx="1.2" fill="#fde68a"/>
                <rect x="6" y="26" width="20" height="2.5" rx="1.2" fill="#fde68a"/>
                <rect x="6" y="32" width="24" height="2.5" rx="1.2" fill="#fde68a"/>
                <rect x="6" y="38" width="14" height="2.5" rx="1.2" fill="#fde68a"/>
              </g>
              <circle cx="456" cy="53" r="5" fill="rgba(245,158,11,0.18)"/>
              <circle cx="470" cy="53" r="3.5" fill="rgba(245,158,11,0.12)"/>

              {/* Calendar expiry — x=600 */}
              <g transform="translate(600,6)" filter="url(#docShadow2)">
                <rect width="56" height="52" rx="7" fill="#fff" stroke="#fecdd3" strokeWidth="1.5"/>
                <rect width="56" height="17" rx="7" fill="#f43f5e"/>
                <rect y="10" width="56" height="7" fill="#f43f5e"/>
                <circle cx="14" cy="6" r="4" fill="#fff" stroke="#f43f5e" strokeWidth="1.5"/>
                <circle cx="42" cy="6" r="4" fill="#fff" stroke="#f43f5e" strokeWidth="1.5"/>
                <rect x="12" y="1" width="2.5" height="10" rx="1.2" fill="#f43f5e"/>
                <rect x="41" y="1" width="2.5" height="10" rx="1.2" fill="#f43f5e"/>
                <text x="28" y="13" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold" fontFamily="Arial,sans-serif">EXPIRY</text>
                <rect x="7"  y="23" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="18" y="23" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="29" y="23" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="40" y="23" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="7"  y="32" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="18" y="32" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="29" y="32" width="8" height="6" rx="2" fill="#fce7f3"/>
                <rect x="40" y="32" width="8" height="6" rx="2" fill="#f43f5e" opacity="0.7"/>
                <rect x="7"  y="41" width="8" height="5" rx="2" fill="#fce7f3"/>
                <rect x="18" y="41" width="8" height="5" rx="2" fill="#fce7f3"/>
                <rect x="29" y="41" width="8" height="5" rx="2" fill="#fce7f3"/>
                <rect x="40" y="41" width="8" height="5" rx="2" fill="#fce7f3"/>
              </g>
              <circle cx="666" cy="53" r="5" fill="rgba(239,68,68,0.18)"/>
              <circle cx="680" cy="53" r="3.5" fill="rgba(239,68,68,0.12)"/>

              {/* Lock indigo — x=800 */}
              <g transform="translate(800,10)">
                <rect x="2" y="24" width="44" height="34" rx="7" fill="#6366f1" opacity="0.9"/>
                <path d="M10 24 L10 15 C10 4 38 4 38 15 L38 24" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeLinecap="round"/>
                <circle cx="24" cy="41" r="5.5" fill="#fff" opacity="0.9"/>
                <rect x="21.5" y="41" width="5" height="9" rx="2.5" fill="#fff" opacity="0.9"/>
              </g>
              <circle cx="858" cy="53" r="5" fill="rgba(99,102,241,0.18)"/>
              <circle cx="872" cy="53" r="3.5" fill="rgba(99,102,241,0.12)"/>

              {/* PDF Doc blue — x=1000 */}
              <g transform="translate(1000,8)" filter="url(#docShadow2)">
                <rect width="44" height="52" rx="5" fill="#fff" stroke="#bfdbfe" strokeWidth="1.5"/>
                <rect width="44" height="13" rx="5" fill="#3b82f6"/>
                <rect y="7" width="44" height="6" fill="#3b82f6"/>
                <text x="22" y="10.5" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
                <rect x="7" y="20" width="30" height="2.5" rx="1.2" fill="#bfdbfe"/>
                <rect x="7" y="26" width="22" height="2.5" rx="1.2" fill="#bfdbfe"/>
                <rect x="7" y="32" width="26" height="2.5" rx="1.2" fill="#bfdbfe"/>
                <rect x="7" y="38" width="18" height="2.5" rx="1.2" fill="#bfdbfe"/>
              </g>
              <circle cx="1058" cy="53" r="5" fill="rgba(59,130,246,0.18)"/>
              <circle cx="1072" cy="53" r="3.5" fill="rgba(59,130,246,0.12)"/>

              {/* Shield checkmark emerald — x=1200 */}
              <g transform="translate(1200,3)">
                <path d="M36 2 L64 14 L64 44 C64 60 48 72 36 78 C24 72 8 60 8 44 L8 14 Z" fill="rgba(16,185,129,0.12)"/>
                <path d="M36 7 L59 18 L59 44 C59 58 46 68 36 73 C26 68 13 58 13 44 L13 18 Z" fill="none" stroke="#10b981" strokeWidth="2.5"/>
                <polyline points="22,42 32,54 52,28" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>

            </g>

            {/* Bottom accent line */}
            <path d="M0 62 Q640 52 1280 62" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1.5"/>
          </svg>

          {/* Logo — sits on top of the SVG */}
          <div className="relative z-10 h-full flex items-center px-6">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <div className="p-1.5 rounded" style={{ backgroundColor: "#FF0000" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-lg" style={{ color: "#0000FF", fontFamily: "Century,'Century Gothic',Georgia,serif" }}>
                Luxor PDF Editor
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
