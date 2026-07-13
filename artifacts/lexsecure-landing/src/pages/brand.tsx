import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Download, Palette, Image as ImageIcon, Sparkles } from "lucide-react";

const BASE = import.meta.env.BASE_URL; // e.g. "/" or "/lexsecure-landing/"

type Asset = {
  id: string;
  title: string;
  description: string;
  bg: "light" | "dark";
  preview: string;   // path under /brand/
  files: { label: string; href: string; ext: string }[];
};

const ASSETS: Asset[] = [
  {
    id: "wordmark",
    title: "Wordmark",
    description: "Primary horizontal logo with the Luxor wordmark. Use on light backgrounds.",
    bg: "light",
    preview: `${BASE}brand/luxor-logo.svg`,
    files: [
      { label: "SVG (vector)", href: `${BASE}brand/luxor-logo.svg`, ext: "SVG" },
      { label: "PNG (1216×393)", href: `${BASE}brand/luxor-logo.png`, ext: "PNG" },
    ],
  },
  {
    id: "icon",
    title: "App icon",
    description: "Square mark used as the app icon, social avatar, and product nav badge.",
    bg: "light",
    preview: `${BASE}brand/luxor-icon.svg`,
    files: [
      { label: "SVG (vector)", href: `${BASE}brand/luxor-icon.svg`, ext: "SVG" },
      { label: "PNG (512×512)", href: `${BASE}brand/luxor-icon.png`, ext: "PNG" },
    ],
  },
  {
    id: "favicon",
    title: "Favicon",
    description: "Browser-tab favicon, optimized for small sizes.",
    bg: "light",
    preview: `${BASE}brand/luxor-favicon.png`,
    files: [
      { label: "PNG (256×256)", href: `${BASE}brand/luxor-favicon.png`, ext: "PNG" },
      { label: "SVG (vector)",  href: `${BASE}favicon.svg`,             ext: "SVG" },
    ],
  },
];

const COLORS = [
  { name: "Indigo",   hex: "#312E81", role: "Primary brand · headings, buttons, dark surfaces" },
  { name: "Red",      hex: "#DC2626", role: "Accent · logo mark, key CTAs, critical alerts" },
  { name: "Blue",     hex: "#2563EB", role: "Secondary · links, charts, info badges" },
  { name: "Rose",     hex: "#FB7185", role: "Tertiary · soft glows, marketing accents" },
  { name: "Emerald",  hex: "#059669", role: "Success states, secure indicators" },
  { name: "Amber",    hex: "#D97706", role: "Warnings, premium tier accents" },
];

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="pt-36 pb-16 bg-gradient-to-br from-blue-50/60 via-white to-rose-50/40 relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-24 w-96 h-96 bg-[#312E81]/8 rounded-full blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 bg-[#DC2626]/8 rounded-full blur-3xl" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" /> Brand assets
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Luxor PDF brand kit
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Download our logos, icons, and color palette for use in articles, decks, and partner integrations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Logo assets ────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-4 h-4 text-[#312E81]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Logos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ASSETS.map((asset) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Preview */}
                <div className={`flex items-center justify-center p-10 h-44 ${asset.bg === "light" ? "bg-slate-50" : "bg-[#312E81]"}`}>
                  <img
                    src={asset.preview}
                    alt={`${asset.title} preview`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Meta + downloads */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{asset.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 flex-1">{asset.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {asset.files.map((f) => (
                      <a
                        key={f.href}
                        href={f.href}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#312E81] hover:bg-[#3730A3] text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {f.label}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Colors ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-4 h-4 text-[#DC2626]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Color palette</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {COLORS.map((c) => (
              <CopyableSwatch key={c.name} name={c.name} hex={c.hex} role={c.role} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Usage guidelines ───────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Usage guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Do",     items: ["Use the SVG logos whenever possible", "Maintain at least 16px clear space around the wordmark", "Use approved brand colors for accents"], tone: "good" as const },
              { title: "Don't",  items: ["Recolor, rotate, or distort the logo", "Place the red mark on busy photographic backgrounds", "Combine our logo with another company's logo without permission"], tone: "bad" as const },
            ].map((g) => (
              <div
                key={g.title}
                className={`rounded-2xl border p-6 ${
                  g.tone === "good"
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-red-50/40 border-red-200"
                }`}
              >
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${g.tone === "good" ? "text-emerald-700" : "text-red-700"}`}>
                  {g.title}
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {g.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className={`mt-1 inline-block w-1.5 h-1.5 rounded-full ${g.tone === "good" ? "bg-emerald-500" : "bg-red-500"}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-slate-500 text-center">
            Need a custom asset or have a partnership question?{" "}
            <Link href="/contact" className="text-[#2563EB] font-semibold hover:text-[#1d4ed8]">Contact us</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CopyableSwatch({ name, hex, role }: { name: string; hex: string; role: string }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(hex)}
      className="group text-left rounded-xl overflow-hidden border border-slate-200 bg-white hover:shadow-md transition-shadow"
      title="Click to copy"
    >
      <div className="h-20" style={{ background: hex }} />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-900">{name}</span>
          <code className="text-[11px] font-mono text-slate-500 group-hover:text-[#2563EB]">{hex}</code>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">{role}</p>
      </div>
    </button>
  );
}
