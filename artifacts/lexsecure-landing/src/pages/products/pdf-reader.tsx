import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import { BookOpen, Zap, Monitor, Smartphone, Search, ZoomIn, Bookmark, SlidersHorizontal, CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Zap,             title: "Lightning Fast",        desc: "Opens multi-hundred-page PDFs in under a second with smart page streaming and lazy rendering." },
  { icon: ZoomIn,          title: "Crisp at Any Zoom",     desc: "Vector-accurate rendering keeps text and diagrams pixel-perfect from 25% to 800% zoom." },
  { icon: Search,          title: "Full-Text Search",      desc: "Instant keyword search across the entire document with highlighted results and jump navigation." },
  { icon: Bookmark,        title: "Bookmarks & Outlines",  desc: "Navigate complex documents with collapsible chapter outlines and personal bookmarks synced across devices." },
  { icon: SlidersHorizontal, title: "Reading Modes",       desc: "Switch between single page, continuous scroll, two-page spread, and presentation mode at a click." },
  { icon: Monitor,         title: "Dark Mode & Theming",   desc: "Eye-comfort modes including Sepia, Night, and High Contrast — perfect for long reading sessions." },
];

const READER_FULL_INSTALLER_URL = "/api/downloads/luxor-pdf-reader-latest";

const systemRequirements = [
  { label: "Operating system", value: "Windows 10 or Windows 11 (64-bit)" },
  { label: "Memory", value: "4 GB RAM minimum · 8 GB recommended for very large documents" },
  { label: "Disk space", value: "300 MB free space for installation" },
  { label: "Display", value: "1280 × 720 resolution or higher" },
  { label: "Internet", value: "Needed for download, automatic updates, and sign-in — reading works fully offline" },
  { label: "Permissions", value: "No administrator rights required — installs for the current user" },
];

const specs = ["Windows 10/11 (64-bit)", "Android 9+", "macOS 12+", "Installs in seconds", "Reads offline", "Free tier available"];

function ReaderMockup() {
  return (
    <svg viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      {/* Window chrome */}
      <rect width="520" height="340" rx="12" fill="#1e293b" />
      <rect x="0" y="0" width="520" height="36" rx="12" fill="#0f172a" />
      <circle cx="18" cy="18" r="5" fill="#ef4444" />
      <circle cx="34" cy="18" r="5" fill="#f59e0b" />
      <circle cx="50" cy="18" r="5" fill="#22c55e" />
      {/* Toolbar */}
      <rect x="0" y="36" width="520" height="32" fill="#5b1a1a" />
      <rect x="10" y="44" width="60" height="16" rx="4" fill="#dc2626" opacity="0.8" />
      <rect x="78" y="44" width="40" height="16" rx="4" fill="#b91c1c" opacity="0.5" />
      <rect x="126" y="44" width="40" height="16" rx="4" fill="#b91c1c" opacity="0.5" />
      <rect x="390" y="47" width="120" height="10" rx="3" fill="#0f172a" opacity="0.5" />
      {/* Sidebar thumbnails */}
      <rect x="0" y="68" width="64" height="272" fill="#0f172a" />
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="6" y={76 + i * 64} width="52" height="56" rx="3" fill="#1e293b" />
          <rect x="10" y={80 + i * 64} width="44" height="6" rx="1" fill="#334155" />
          <rect x="10" y={88 + i * 64} width="44" height="3" rx="1" fill="#b91c1c" opacity="0.4" />
          <rect x="10" y={93 + i * 64} width="34" height="3" rx="1" fill="#b91c1c" opacity="0.4" />
          <rect x="10" y={98 + i * 64} width="40" height="3" rx="1" fill="#b91c1c" opacity="0.4" />
          <rect x="10" y={103 + i * 64} width="28" height="3" rx="1" fill="#b91c1c" opacity="0.4" />
          <text x="32" y={125 + i * 64} textAnchor="middle" fill="#64748b" fontSize="8">{i + 1}</text>
        </g>
      ))}
      {/* Main page */}
      <rect x="72" y="68" width="360" height="272" fill="#ffffff" />
      {/* Page content lines */}
      <rect x="100" y="92" width="200" height="14" rx="2" fill="#5b1a1a" />
      <rect x="100" y="112" width="302" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="120" width="290" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="128" width="310" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="136" width="270" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="152" width="240" height="90" rx="4" fill="#fee2e2" />
      <rect x="110" y="162" width="60" height="8" rx="2" fill="#dc2626" opacity="0.5" />
      <rect x="110" y="174" width="210" height="4" rx="1" fill="#fecaca" />
      <rect x="110" y="181" width="190" height="4" rx="1" fill="#fecaca" />
      <rect x="110" y="188" width="205" height="4" rx="1" fill="#fecaca" />
      <rect x="100" y="250" width="302" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="258" width="280" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="266" width="295" height="5" rx="1" fill="#e2e8f0" />
      <rect x="100" y="274" width="260" height="5" rx="1" fill="#e2e8f0" />
      {/* Search highlight */}
      <rect x="140" y="120" width="48" height="5" rx="1" fill="#fde68a" />
      {/* Right scroll panel */}
      <rect x="432" y="68" width="88" height="272" fill="#0f172a" />
      <rect x="444" y="90" width="64" height="8" rx="2" fill="#b91c1c" opacity="0.5" />
      <rect x="444" y="104" width="52" height="6" rx="1" fill="#1e293b" />
      <rect x="444" y="114" width="60" height="6" rx="1" fill="#1e293b" />
      <rect x="444" y="124" width="44" height="6" rx="1" fill="#1e293b" />
      <rect x="444" y="134" width="56" height="6" rx="1" fill="#1e293b" />
    </svg>
  );
}

export default function PdfReaderPage() {
  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-rose-900 to-rose-950 text-white py-24">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-rose-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-full px-4 py-1.5 text-red-300 text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                Luxor PDF Reader
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
                Read PDFs <span className="text-red-300">faster</span> than ever before
              </h1>
              <p className="text-rose-200 text-lg leading-relaxed mb-8">
                A lightweight yet powerful PDF viewer built for professionals. Open, navigate, search, and annotate any PDF document — locally, privately, and blazingly fast.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#download" className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors shadow-lg shadow-red-500/30">
                  Download Free
                </a>
                <a href="#features" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors">
                  See All Features
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <ReaderMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-red-600 py-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[["< 1 sec", "Average open time"], ["800%", "Maximum zoom"], ["50+ languages", "UI localisation"], ["100% offline", "No cloud required"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-red-200 text-sm">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Everything a reader needs</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Carefully designed for legal professionals, academics, and anyone who works with PDFs daily.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform support */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-3xl p-10 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Works everywhere you do</h2>
              <p className="text-slate-500 mb-6">One licence, all your devices. Your reading preferences, bookmarks, and recent files stay in sync.</p>
              <div className="grid grid-cols-2 gap-3">
                {specs.map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <Monitor className="w-12 h-12 text-red-600 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs text-slate-500 font-medium">Desktop</p>
              </div>
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-rose-600 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs text-slate-500 font-medium">Mobile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download */}
      <section id="download" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Download Luxor PDF Reader</h2>
          <p className="text-slate-500 mb-8 max-w-xl mx-auto">
            Free for personal use. The installer downloads the latest version, sets itself up in seconds, and opens automatically.
          </p>
          <div className="flex items-center justify-center">
            <a
              href={READER_FULL_INSTALLER_URL}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-xl shadow-red-500/25"
              data-testid="download-reader-button"
            >
              <Download className="w-5 h-5" />
              Download for Windows
              <span className="text-xs font-normal text-white/70">· Free · ~100 MB</span>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Windows 10/11 · 64-bit</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Automatic updates built in</span>
          </div>

          {/* System requirements */}
          <div className="mt-12 text-left bg-slate-50 border border-slate-100 rounded-2xl p-8" data-testid="system-requirements">
            <h3 className="text-lg font-bold text-slate-800 mb-1 text-center">System requirements</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">What your PC needs to install and run Luxor PDF Reader</p>
            <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {systemRequirements.map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-sm font-semibold text-slate-700">{label}</dt>
                    <dd className="text-sm text-slate-500">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-red-900 to-rose-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-white">Start reading smarter today</h2>
          <p className="text-red-200 mb-8 max-w-md mx-auto">Free for personal use. Pro features unlock with a single affordable licence.</p>
          <a href="#download" className="inline-block px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-colors shadow-xl shadow-red-500/30">
            Download Luxor PDF Reader
          </a>
        </div>
      </section>
    </ProductPageLayout>
  );
}
