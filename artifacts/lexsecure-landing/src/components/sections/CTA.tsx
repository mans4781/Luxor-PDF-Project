import { motion } from "framer-motion";
import { Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

/** Original Luxor illustration: PDF card on tilted blue panels with shield, signature note, and sync badge. */
function CtaIllustration() {
  return (
    <div className="relative mx-auto flex h-[230px] w-[280px] items-center justify-center" aria-hidden="true">
      <svg width="280" height="230" viewBox="0 0 280 230" fill="none" className="absolute inset-0">
        <defs>
          <linearGradient id="lxcPanel" x1="48" y1="44" x2="208" y2="204" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d7e4fc" />
            <stop offset="1" stopColor="#bdd2f8" />
          </linearGradient>
          <linearGradient id="lxcBadge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="lxcShield" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
          <pattern id="lxcDots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="1.6" fill="#b8cdf6" />
          </pattern>
          <filter id="lxcShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* soft shadow under panel stack */}
        <ellipse cx="142" cy="212" rx="74" ry="9" fill="#9db4dd" opacity="0.3" filter="url(#lxcShadow)" />

        {/* tilted backdrop panels */}
        <rect x="48" y="48" width="158" height="158" rx="30" fill="url(#lxcPanel)" transform="rotate(-7 127 127)" />
        <rect x="74" y="58" width="140" height="140" rx="26" fill="#e4edfe" transform="rotate(-3 144 128)" />

        {/* dot grid, lower left */}
        <rect x="28" y="176" width="42" height="38" rx="4" fill="url(#lxcDots)" opacity="0.9" />

        {/* four-point star sparkles, top right */}
        <path d="M238 46 C239.6 55 242 57.4 251 59 C242 60.6 239.6 63 238 72 C236.4 63 234 60.6 225 59 C234 57.4 236.4 55 238 46 Z" fill="#a5c3f8" />
        <path d="M256 84 C257 89.4 258.6 91 264 92 C258.6 93 257 94.6 256 100 C255 94.6 253.4 93 248 92 C253.4 91 255 89.4 256 84 Z" fill="#c3d7fa" />

        {/* PDF document card with folded corner */}
        <g>
          <path
            d="M100 76 C100 69.4 105.4 64 112 64 H160 L190 94 V184 C190 190.6 184.6 196 178 196 H112 C105.4 196 100 190.6 100 184 Z"
            fill="#ffffff"
            stroke="#e4eaf5"
          />
          <path d="M160 64 L190 94 H172 C165.4 94 160 88.6 160 82 Z" fill="#bcd3f9" />
          <rect x="114" y="106" width="52" height="30" rx="9" fill="url(#lxcBadge)" />
          <text x="140" y="127" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="14" fill="#ffffff">
            PDF
          </text>
          <rect x="114" y="150" width="60" height="6" rx="3" fill="#d4e0f6" />
          <rect x="114" y="164" width="50" height="6" rx="3" fill="#e1e9fa" />
          <rect x="114" y="178" width="40" height="6" rx="3" fill="#e9effc" />
        </g>

        {/* glossy shield with check, left */}
        <g>
          <path d="M64 118 L92 129 V162 C92 184 80 199 64 206 C48 199 36 184 36 162 V129 Z" fill="url(#lxcShield)" />
          <path d="M64 124 L86 133 V161 C86 179 76 191 64 198 C52 191 42 179 42 161 V133 Z" fill="#ffffff" opacity="0.12" />
          <path d="M53 162 l8 9 15 -19" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* signature note, right */}
        <g transform="rotate(5 226 160)">
          <rect x="198" y="138" width="58" height="44" rx="10" fill="#ffffff" stroke="#e4eaf5" />
          <path d="M208 165 c6 -13 10 -13 12 -2 c2 9 6 4 10 -5 c2 -5 6 -5 9 2" stroke="#16213e" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <rect x="208" y="172" width="36" height="3" rx="1.5" fill="#cbd5e1" />
        </g>

        {/* sync badge in rounded square, bottom */}
        <g>
          <rect x="150" y="184" width="40" height="40" rx="11" fill="#ffffff" stroke="#e4eaf5" />
          <path d="M161 202 a10 10 0 0 1 17 -5 M179 206 a10 10 0 0 1 -17 5" stroke="#2563EB" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M178 192 l1.2 5.4 -5.4 -0.4 Z" fill="#2563EB" />
          <path d="M162 216 l-1.2 -5.4 5.4 0.4 Z" fill="#2563EB" />
        </g>
      </svg>
    </div>
  );
}

export function CTA() {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-gradient-to-b from-white to-[#eef1f9]">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f6f8fe] to-[#e9effc] p-10 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.25)] md:p-14"
        >
          {/* corner dot accents */}
          <div
            className="pointer-events-none absolute right-6 bottom-6 h-20 w-28 opacity-60"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, #b8cdf6 1.6px, transparent 0)",
              backgroundSize: "11px 11px",
            }}
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <CtaIllustration />
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-slate-900 md:text-[44px] md:leading-[1.15]">
                Ready to work smarter with PDFs?
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
                Join thousands of professionals who trust Luxor PDF to get work
                done—faster and more securely.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-[52px] rounded-xl bg-[#2563EB] px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-[#1D4ED8]"
                >
                  <Link href="/download">
                    <Download className="mr-1 h-[18px] w-[18px]" />
                    Download Luxor PDF
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-[52px] rounded-xl border-[#bfd3f8] bg-white px-7 text-base font-semibold text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8]"
                >
                  <Link href="/pricing">
                    <Crown className="mr-1 h-[18px] w-[18px]" />
                    View Plans
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
