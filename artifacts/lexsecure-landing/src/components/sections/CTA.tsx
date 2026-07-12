import { motion } from "framer-motion";
import { Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

/** Original Luxor illustration: PDF card with shield, signature note, and sync badge. */
function CtaIllustration() {
  return (
    <div className="relative mx-auto flex h-[230px] w-[280px] items-center justify-center" aria-hidden="true">
      <svg width="280" height="230" viewBox="0 0 280 230" fill="none" className="absolute inset-0">
        <defs>
          <linearGradient id="lxcPanel" x1="60" y1="20" x2="230" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dbe7fd" />
            <stop offset="1" stopColor="#c6d8fb" />
          </linearGradient>
          <linearGradient id="lxcBadge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <pattern id="lxcDots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="1.6" fill="#b8cdf6" />
          </pattern>
          <filter id="lxcShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* backdrop panels */}
        <rect x="52" y="26" width="150" height="150" rx="26" fill="url(#lxcPanel)" opacity="0.55" transform="rotate(-4 127 101)" />
        <rect x="66" y="40" width="140" height="145" rx="24" fill="#e7effe" opacity="0.9" />
        <rect x="24" y="150" width="34" height="34" rx="6" fill="url(#lxcDots)" opacity="0.8" />
        <rect x="218" y="26" width="30" height="30" rx="6" fill="url(#lxcDots)" opacity="0.7" />

        {/* sparkles */}
        <path d="M232 66l0 14M225 73l14 0" stroke="#93b6f5" strokeWidth="3" strokeLinecap="round" />
        <path d="M246 96l0 9M241.5 100.5l9 0" stroke="#b8cdf6" strokeWidth="2.4" strokeLinecap="round" />

        {/* soft shadow under doc */}
        <ellipse cx="132" cy="196" rx="62" ry="8" fill="#9db4dd" opacity="0.35" filter="url(#lxcShadow)" />

        {/* PDF document card */}
        <g>
          <rect x="86" y="54" width="94" height="128" rx="12" fill="#ffffff" stroke="#e2e8f0" />
          <path d="M180 84 L156 84 Q152 84 152 80 L152 54 Z" fill="#dbeafe" transform="translate(0 0)" />
          <rect x="104" y="70" width="46" height="26" rx="7" fill="url(#lxcBadge)" />
          <text x="127" y="88" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="13" fill="#ffffff">
            PDF
          </text>
          <rect x="100" y="110" width="66" height="6" rx="3" fill="#c7d7f8" />
          <rect x="100" y="124" width="58" height="6" rx="3" fill="#dbe6fa" />
          <rect x="100" y="138" width="64" height="6" rx="3" fill="#dbe6fa" />
          <rect x="100" y="152" width="44" height="6" rx="3" fill="#e8eefc" />
        </g>

        {/* shield badge, left */}
        <g>
          <path d="M56 96 L82 106 V136 C82 156 71 170 56 177 C41 170 30 156 30 136 V106 Z" fill="url(#lxcBadge)" />
          <path d="M46 138 l7 8 14 -17" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* signature note, right */}
        <g transform="rotate(6 213 148)">
          <rect x="186" y="126" width="56" height="42" rx="9" fill="#ffffff" stroke="#e2e8f0" />
          <path d="M196 152 c6 -12 10 -12 12 -2 c2 8 6 4 10 -4 c2 -4 6 -4 8 2" stroke="#1e293b" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <rect x="196" y="160" width="34" height="3" rx="1.5" fill="#cbd5e1" />
        </g>

        {/* sync badge, bottom */}
        <g>
          <circle cx="176" cy="188" r="17" fill="#ffffff" stroke="#e2e8f0" />
          <path d="M168 186 a9 9 0 0 1 15 -4 M184 190 a9 9 0 0 1 -15 4" stroke="#2563EB" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M183 180 l1 4 -4 0 Z" fill="#2563EB" />
          <path d="M169 196 l-1 -4 4 0 Z" fill="#2563EB" />
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
