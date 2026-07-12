import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wrench,
  FileDown,
  FileUp,
  ShieldCheck,
  Minimize2,
  HelpCircle,
  Merge,
  Scissors,
  FileOutput,
  Trash2,
  FilePlus,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Upload,
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  Bookmark,
  BookOpen,
  Moon,
  PanelLeft,
  Highlighter,
  MessageSquareText,
  ChevronDown,
} from "lucide-react";

/**
 * Toolkit sidebar card. Matches the live PDF Secure app: rounded square
 * icon tile + title + subtitle, with a right chevron and a hairline
 * border. The "active" state shows the indigo focus ring used in the
 * real app to indicate the currently-open tool.
 */
function ToolkitCard({
  icon, iconBg, title, subtitle, active = false, badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white",
        active
          ? "border-indigo-500 ring-2 ring-indigo-100 shadow-sm"
          : "border-slate-200/80 hover:border-slate-300",
      ].join(" ")}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900 truncate">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-rose-50 text-rose-600 border border-rose-200">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
    </div>
  );
}

/** Toolbar tab inside the right panel. */
function PanelTab({
  icon, label, active = false,
}: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium",
        active
          ? "bg-indigo-500 text-white shadow-sm"
          : "text-slate-600",
      ].join(" ")}
    >
      <span className="w-3.5 h-3.5">{icon}</span>
      {label}
    </div>
  );
}

/** Coded mockup of the live PDF Secure dashboard. */
function SecureAppMockup() {
  return (
    <div className="bg-white">
      {/* App header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}brand/luxor-icon.png?v=20260712b`}
            alt=""
            className="w-9 h-9 rounded-lg object-contain"
            draggable={false}
          />
          <div className="leading-tight">
            <div className="text-base font-semibold">
              <span className="text-indigo-900">Luxor </span>
              <span className="text-rose-600">PDF </span>
              <span className="text-amber-500">Secure</span>
            </div>
            <div className="text-[9px] tracking-[0.18em] text-slate-400 font-semibold">
              PRIVATE PDF SUITE
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </div>
          <div className="px-3 py-1.5 rounded-md bg-indigo-700 text-white text-[12px] font-semibold">
            Create account
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-12 gap-5 px-6 py-6 bg-slate-50/50">
        {/* Sidebar */}
        <aside className="col-span-4">
          <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
            Your <span className="text-indigo-700">PDF</span>{" "}
            <span className="text-rose-600">Secure</span> Toolkit
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            Edit, convert and secure documents — everything runs locally
            in your browser for complete privacy.
          </p>
          <div className="space-y-2">
            <ToolkitCard
              icon={<Wrench className="w-5 h-5" />}
              iconBg="bg-indigo-500"
              title="Edit Your PDF"
              subtitle="Merge, split & extract pages"
              active
            />
            <ToolkitCard
              icon={<FileDown className="w-5 h-5" />}
              iconBg="bg-blue-500"
              title="Convert from PDF"
              subtitle="PDF to images or text"
            />
            <ToolkitCard
              icon={<FileUp className="w-5 h-5" />}
              iconBg="bg-emerald-500"
              title="Convert to PDF"
              subtitle="Images & files to PDF"
            />
            <ToolkitCard
              icon={<ShieldCheck className="w-5 h-5" />}
              iconBg="bg-rose-500"
              title="Secure your PDF"
              subtitle="Expiry, password & print controls"
              badge="SIGNATURE"
            />
            <ToolkitCard
              icon={<Minimize2 className="w-5 h-5" />}
              iconBg="bg-orange-500"
              title="Compress your PDF"
              subtitle="Shrink to 15, 10, 5 or 1 MB"
            />
            <ToolkitCard
              icon={<HelpCircle className="w-5 h-5" />}
              iconBg="bg-amber-400"
              title="User Guide"
              subtitle="Quickstart & tips"
            />
          </div>
        </aside>

        {/* Main panel */}
        <main className="col-span-8 space-y-4">
          {/* Hero card */}
          <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 shadow-md">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-semibold leading-tight">Edit Your PDF</div>
                <div className="text-[12px] text-white/80 mt-0.5">
                  Merge, split, extract, delete &amp; insert pages — all processed in your browser
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Merge className="w-3 h-3" />, label: "Merge PDFs" },
                { icon: <Scissors className="w-3 h-3" />, label: "Split by Range" },
                { icon: <FileOutput className="w-3 h-3" />, label: "Extract Pages" },
                { icon: <Trash2 className="w-3 h-3" />, label: "Delete Pages" },
                { icon: <FilePlus className="w-3 h-3" />, label: "Insert Pages" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-medium"
                >
                  {c.icon} {c.label}
                </span>
              ))}
            </div>
          </div>

          {/* Tab bar + tool */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 mb-4">
              <PanelTab icon={<Merge className="w-3.5 h-3.5" />} label="Merge" active />
              <PanelTab icon={<Scissors className="w-3.5 h-3.5" />} label="Split" />
              <PanelTab icon={<FileOutput className="w-3.5 h-3.5" />} label="Extract" />
              <PanelTab icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" />
              <PanelTab icon={<FilePlus className="w-3.5 h-3.5" />} label="Insert" />
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 mb-4">
              <div className="w-9 h-9 rounded-md bg-indigo-500 flex items-center justify-center text-white shrink-0">
                <Merge className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-indigo-700">Merge PDFs</div>
                <div className="text-[11px] text-slate-600">
                  Combine multiple PDFs into one document in the listed order.
                </div>
              </div>
            </div>

            {/* Upload dropzone */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-sm mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-[13px] font-medium text-indigo-700">
                Click or drag PDFs here
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Files never leave your device
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Small round toolbar button used in the Reader mockup. */
function ReaderToolButton({
  icon, active = false,
}: { icon: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={[
        "w-7 h-7 rounded-md flex items-center justify-center",
        active
          ? "bg-red-600 text-white shadow-sm"
          : "bg-slate-100 border border-slate-200 text-slate-500",
      ].join(" ")}
    >
      {icon}
    </div>
  );
}

/** Coded mockup of the Luxor PDF Reader desktop app. */
function ReaderAppMockup() {
  return (
    <div className="bg-white text-slate-700">
      {/* App header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}brand/luxor-icon.png?v=20260712b`}
            alt=""
            className="w-9 h-9 rounded-lg object-contain"
            draggable={false}
          />
          <div className="leading-tight">
            <div className="text-base font-semibold">
              <span className="text-slate-900">Luxor </span>
              <span className="text-red-600">PDF </span>
              <span className="text-slate-500">Reader</span>
            </div>
            <div className="text-[9px] tracking-[0.18em] text-slate-400 font-semibold">
              FAST · PRIVATE · OFFLINE
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-[12px] text-slate-400">
            <Search className="w-3.5 h-3.5" />
            Search document…
          </div>
          <div className="px-3 py-1.5 rounded-md bg-red-600 text-white text-[12px] font-semibold">
            Open PDF
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-1.5">
          <ReaderToolButton icon={<PanelLeft className="w-3.5 h-3.5" />} active />
          <ReaderToolButton icon={<Highlighter className="w-3.5 h-3.5" />} />
          <ReaderToolButton icon={<MessageSquareText className="w-3.5 h-3.5" />} />
          <ReaderToolButton icon={<Bookmark className="w-3.5 h-3.5" />} />
          <ReaderToolButton icon={<Moon className="w-3.5 h-3.5" />} />
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <ReaderToolButton icon={<ZoomOut className="w-3.5 h-3.5" />} />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">120%</span>
          <ReaderToolButton icon={<ZoomIn className="w-3.5 h-3.5" />} />
          <span className="ml-2 hidden sm:inline-flex items-center gap-1">
            Page <span className="text-slate-900 font-semibold">4</span> / 128
            <ChevronDown className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-12 gap-0">
        {/* Thumbnail rail */}
        <aside className="col-span-2 border-r border-slate-100 bg-slate-50/60 px-3 py-4 space-y-3">
          {[3, 4, 5].map((n) => (
            <div key={n} className="text-center">
              <div
                className={[
                  "rounded-md bg-white aspect-[3/4] p-1.5 space-y-1 border",
                  n === 4 ? "ring-2 ring-red-500 border-red-200" : "border-slate-200 opacity-70",
                ].join(" ")}
              >
                <div className="h-1.5 w-2/3 rounded-sm bg-slate-600/70" />
                <div className="h-1 w-full rounded-sm bg-slate-200" />
                <div className="h-1 w-11/12 rounded-sm bg-slate-200" />
                <div className="h-1 w-full rounded-sm bg-slate-200" />
                <div className="h-1 w-3/4 rounded-sm bg-slate-200" />
              </div>
              <div className={`mt-1 text-[10px] ${n === 4 ? "text-red-600 font-semibold" : "text-slate-400"}`}>{n}</div>
            </div>
          ))}
        </aside>

        {/* Page canvas */}
        <main className="col-span-7 bg-slate-100/80 px-6 py-6 flex items-start justify-center">
          <div className="w-full max-w-md bg-white rounded-md shadow-lg border border-slate-200/70 p-6 space-y-2.5">
            <div className="h-3.5 w-2/3 rounded bg-slate-800" />
            <div className="h-2 w-full rounded bg-slate-200" />
            <div className="h-2 w-11/12 rounded bg-slate-200" />
            <div className="flex items-center">
              <div className="h-2 w-1/3 rounded bg-slate-200" />
              <div className="ml-1 h-2 w-1/4 rounded bg-amber-200" />
              <div className="ml-1 h-2 w-1/4 rounded bg-slate-200" />
            </div>
            <div className="h-2 w-full rounded bg-slate-200" />
            <div className="rounded-md bg-red-50 border border-red-100 p-3 space-y-1.5 my-2">
              <div className="h-2 w-1/3 rounded bg-red-300" />
              <div className="h-1.5 w-full rounded bg-red-100" />
              <div className="h-1.5 w-5/6 rounded bg-red-100" />
            </div>
            <div className="h-2 w-full rounded bg-slate-200" />
            <div className="h-2 w-10/12 rounded bg-slate-200" />
            <div className="h-2 w-full rounded bg-slate-200" />
            <div className="h-2 w-2/3 rounded bg-slate-200" />
          </div>
        </main>

        {/* Right panel */}
        <aside className="col-span-3 border-l border-slate-100 bg-slate-50/60 px-4 py-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-red-600" />
            Outline
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="text-slate-500">1 · Introduction</div>
            <div className="text-slate-500">2 · Getting started</div>
            <div className="flex items-center gap-1.5 text-slate-900 font-medium">
              <span className="w-1 h-3.5 rounded-full bg-red-500" />
              3 · Reading modes
            </div>
            <div className="pl-3 text-slate-400">3.1 · Continuous scroll</div>
            <div className="pl-3 text-slate-400">3.2 · Two-page spread</div>
            <div className="text-slate-500">4 · Annotations</div>
            <div className="text-slate-500">5 · Themes &amp; dark mode</div>
          </div>
          <div className="mt-4 rounded-lg bg-white border border-slate-200 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 mb-1.5">
              <Bookmark className="w-3 h-3 text-red-600" />
              Bookmarks
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              Page 4 · Reading modes<br />
              Page 57 · Keyboard shortcuts
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 80 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -80 }),
};

const SLIDES = [
  {
    key: "reader",
    label: "Luxor PDF Reader",
    url: "reader.luxorpdf.com",
    render: () => <ReaderAppMockup />,
  },
  {
    key: "secure",
    label: "Luxor PDF Secure",
    url: "app.luxorpdf.com",
    render: () => <SecureAppMockup />,
  },
];

export function AppPreview() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir);
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(t);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white overflow-hidden border-t border-slate-100">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-4">
            See it in action
          </span>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4 tracking-[-0.02em]">
            Clean. Fast. <span className="text-neutral-400 font-semibold">Yours.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Everything you need from a single dashboard — no clutter, no complexity. Just your tools, ready to go.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Subtle glow */}
          <div className="absolute -inset-4 bg-[#EAF2FB] rounded-3xl blur-2xl pointer-events-none opacity-60" />

          {/* Browser chrome frame */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200 bg-white">
            {/* Browser toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-500 border border-slate-200 flex items-center gap-2 max-w-xs mx-auto">
                  <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {slide.url}
                </div>
              </div>
            </div>

            {/* Sliding app canvas */}
            <div
              className="relative overflow-hidden"
              role="region"
              aria-roledescription="carousel"
              aria-label="App previews"
            >
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={slide.key}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  role="group"
                  aria-label={slide.label}
                >
                  {slide.render()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Slider arrows */}
          <button
            type="button"
            aria-label="Previous preview"
            onClick={() => go(index - 1, -1)}
            data-testid="preview-slider-prev"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next preview"
            onClick={() => go(index + 1, 1)}
            data-testid="preview-slider-next"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:shadow-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Dots + label */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Show ${s.label}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i, i > index ? 1 : -1)}
                data-testid={`preview-slider-dot-${s.key}`}
                className={[
                  "h-2.5 rounded-full transition-all",
                  i === index ? "w-8 bg-slate-800" : "w-2.5 bg-slate-300 hover:bg-slate-400",
                ].join(" ")}
              />
            ))}
          </div>
          <p
            className="text-sm font-medium text-slate-600"
            data-testid="preview-slider-label"
            aria-live="polite"
          >
            {slide.label}
          </p>
        </div>
      </div>
    </section>
  );
}
