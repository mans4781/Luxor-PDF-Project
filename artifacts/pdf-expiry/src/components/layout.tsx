import { ReactNode } from "react";
import { Shield } from "lucide-react";

function TopIllustration() {
  return (
    <div className="w-full overflow-hidden" style={{ height: 118, background: "linear-gradient(135deg,#f8f0ff 0%,#fff0f3 45%,#f0f4ff 100%)" }}>
      <svg viewBox="0 0 1280 118" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        <defs>
          <filter id="docShadow">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.10)" />
          </filter>
        </defs>

        {/* Background blobs */}
        <circle cx="70"   cy="59" r="88"  fill="rgba(139,92,246,0.07)" />
        <circle cx="210"  cy="10" r="58"  fill="rgba(236,72,153,0.07)" />
        <circle cx="640"  cy="-20" r="78" fill="rgba(245,158,11,0.06)" />
        <circle cx="1090" cy="10" r="62"  fill="rgba(239,68,68,0.07)" />
        <circle cx="1210" cy="68" r="98"  fill="rgba(59,130,246,0.07)" />

        {/* PDF Doc purple — far left */}
        <g transform="translate(52,18)" filter="url(#docShadow)">
          <rect width="44" height="56" rx="5" fill="#fff" stroke="#ddd6fe" strokeWidth="1.5"/>
          <rect width="44" height="14" rx="5" fill="#8b5cf6"/>
          <rect y="8" width="44" height="6" fill="#8b5cf6"/>
          <text x="22" y="11" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
          <rect x="7" y="22" width="30" height="3" rx="1.5" fill="#ddd6fe"/>
          <rect x="7" y="29" width="22" height="3" rx="1.5" fill="#ddd6fe"/>
          <rect x="7" y="36" width="26" height="3" rx="1.5" fill="#ddd6fe"/>
          <rect x="7" y="43" width="18" height="3" rx="1.5" fill="#ddd6fe"/>
        </g>

        {/* Shield + lock pink */}
        <g transform="translate(155,14)">
          <path d="M28 2 L52 13 L52 36 C52 51 38 62 28 66 C18 62 4 51 4 36 L4 13 Z" fill="rgba(236,72,153,0.13)"/>
          <path d="M28 6 L48 16 L48 36 C48 49 36 58 28 62 C20 58 8 49 8 36 L8 16 Z" fill="none" stroke="#ec4899" strokeWidth="2"/>
          <rect x="20" y="30" width="16" height="13" rx="2.5" fill="#ec4899" opacity="0.85"/>
          <path d="M23 30 L23 25 C23 20 33 20 33 25 L33 30" fill="none" stroke="#ec4899" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="28" cy="37" r="2.5" fill="#fff"/>
        </g>

        {/* PDF Doc amber */}
        <g transform="translate(318,16)" filter="url(#docShadow)">
          <rect width="40" height="52" rx="5" fill="#fff" stroke="#fde68a" strokeWidth="1.5"/>
          <rect width="40" height="14" rx="5" fill="#f59e0b"/>
          <rect y="8" width="40" height="6" fill="#f59e0b"/>
          <text x="20" y="11" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
          <rect x="6" y="22" width="28" height="3" rx="1.5" fill="#fde68a"/>
          <rect x="6" y="29" width="20" height="3" rx="1.5" fill="#fde68a"/>
          <rect x="6" y="36" width="24" height="3" rx="1.5" fill="#fde68a"/>
          <rect x="6" y="43" width="14" height="3" rx="1.5" fill="#fde68a"/>
        </g>

        {/* Calendar expiry rose — center */}
        <g transform="translate(548,16)" filter="url(#docShadow)">
          <rect width="56" height="52" rx="7" fill="#fff" stroke="#fecdd3" strokeWidth="1.5"/>
          <rect width="56" height="18" rx="7" fill="#f43f5e"/>
          <rect y="11" width="56" height="7" fill="#f43f5e"/>
          <circle cx="14" cy="6"  r="4.5" fill="#fff" stroke="#f43f5e" strokeWidth="1.5"/>
          <circle cx="42" cy="6"  r="4.5" fill="#fff" stroke="#f43f5e" strokeWidth="1.5"/>
          <rect x="12" y="1" width="2.5" height="10" rx="1.2" fill="#f43f5e"/>
          <rect x="41" y="1" width="2.5" height="10" rx="1.2" fill="#f43f5e"/>
          <text x="28" y="14" textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold" fontFamily="Arial,sans-serif">EXPIRY</text>
          <rect x="7"  y="25" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="18" y="25" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="29" y="25" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="40" y="25" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="7"  y="35" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="18" y="35" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="29" y="35" width="8" height="7" rx="2" fill="#fce7f3"/>
          <rect x="40" y="35" width="8" height="7" rx="2" fill="#f43f5e" opacity="0.7"/>
          <rect x="7"  y="45" width="8" height="5" rx="2" fill="#fce7f3"/>
          <rect x="18" y="45" width="8" height="5" rx="2" fill="#fce7f3"/>
          <rect x="29" y="45" width="8" height="5" rx="2" fill="#fce7f3"/>
          <rect x="40" y="45" width="8" height="5" rx="2" fill="#fce7f3"/>
        </g>

        {/* Lock indigo */}
        <g transform="translate(790,18)">
          <rect x="2" y="24" width="44" height="34" rx="7" fill="#6366f1" opacity="0.9"/>
          <path d="M10 24 L10 15 C10 4 38 4 38 15 L38 24" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeLinecap="round"/>
          <circle cx="24" cy="41" r="5.5" fill="#fff" opacity="0.9"/>
          <rect x="21.5" y="41" width="5" height="9" rx="2.5" fill="#fff" opacity="0.9"/>
        </g>

        {/* PDF Doc blue — right */}
        <g transform="translate(960,14)" filter="url(#docShadow)">
          <rect width="44" height="56" rx="5" fill="#fff" stroke="#bfdbfe" strokeWidth="1.5"/>
          <rect width="44" height="14" rx="5" fill="#3b82f6"/>
          <rect y="8" width="44" height="6" fill="#3b82f6"/>
          <text x="22" y="11" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Arial,sans-serif">PDF</text>
          <rect x="7" y="22" width="30" height="3" rx="1.5" fill="#bfdbfe"/>
          <rect x="7" y="29" width="22" height="3" rx="1.5" fill="#bfdbfe"/>
          <rect x="7" y="36" width="26" height="3" rx="1.5" fill="#bfdbfe"/>
          <rect x="7" y="43" width="18" height="3" rx="1.5" fill="#bfdbfe"/>
        </g>

        {/* Shield checkmark emerald — far right */}
        <g transform="translate(1148,12)">
          <path d="M36 2 L64 14 L64 44 C64 60 48 72 36 78 C24 72 8 60 8 44 L8 14 Z" fill="rgba(16,185,129,0.12)"/>
          <path d="M36 7 L59 18 L59 44 C59 58 46 68 36 73 C26 68 13 58 13 44 L13 18 Z" fill="none" stroke="#10b981" strokeWidth="2.5"/>
          <polyline points="22,42 32,54 52,28" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* Decorative dots */}
        <circle cx="142" cy="59" r="3.5" fill="rgba(139,92,246,0.18)"/>
        <circle cx="152" cy="59" r="2"   fill="rgba(139,92,246,0.12)"/>
        <circle cx="292" cy="59" r="3.5" fill="rgba(236,72,153,0.18)"/>
        <circle cx="302" cy="59" r="2"   fill="rgba(236,72,153,0.12)"/>
        <circle cx="462" cy="59" r="3.5" fill="rgba(245,158,11,0.18)"/>
        <circle cx="472" cy="59" r="2"   fill="rgba(245,158,11,0.12)"/>
        <circle cx="540" cy="59" r="3.5" fill="rgba(239,68,68,0.18)"/>
        <circle cx="740" cy="59" r="3.5" fill="rgba(99,102,241,0.18)"/>
        <circle cx="750" cy="59" r="2"   fill="rgba(99,102,241,0.12)"/>
        <circle cx="852" cy="59" r="3.5" fill="rgba(59,130,246,0.18)"/>
        <circle cx="862" cy="59" r="2"   fill="rgba(59,130,246,0.12)"/>
        <circle cx="1010" cy="59" r="3.5" fill="rgba(16,185,129,0.18)"/>
        <circle cx="1020" cy="59" r="2"   fill="rgba(16,185,129,0.12)"/>
        <circle cx="1140" cy="59" r="3.5" fill="rgba(16,185,129,0.18)"/>

        {/* Bottom wavy lines */}
        <path d="M0 102 Q320 86 640 102 T1280 102" fill="none" stroke="rgba(139,92,246,0.09)" strokeWidth="2"/>
        <path d="M0 112 Q320 96 640 112 T1280 112" fill="none" stroke="rgba(236,72,153,0.07)" strokeWidth="2"/>
      </svg>
    </div>
  );
}

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
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded" style={{ backgroundColor: "#FF0000" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg" style={{ color: "#0000FF", fontFamily: "Century,'Century Gothic',Georgia,serif" }}>
              LuxorSecure PDF
            </span>
          </div>
        </div>
      </header>

      <TopIllustration />

      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
