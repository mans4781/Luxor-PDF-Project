import { motion } from "framer-motion";
import {
  Wrench,
  FileOutput,
  FileInput,
  Minimize2,
  ArrowRight,
  Lock,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Online Tools landing page.
 *
 * Surfaces the browser-based PDF tools from the Luxor PDF web suite
 * (`/pdf-expiry/*`). Excludes "Secure your PDF" because that workflow
 * is reserved for the Luxor PDF Secure desktop app.
 *
 * Each "Open tool" CTA links to the corresponding route inside the
 * `pdf-expiry` artifact. That artifact enforces:
 *   - Sign-in is mandatory (anonymous users are redirected to /sign-in
 *     with a redirect_url back to the requested tool).
 *   - Free accounts get a 5-actions-per-day shared quota across all
 *     tools, enforced server-side in `getLicenseStatus` / `recordUsage`.
 */

const SUITE_BASE = "/pdf-expiry";

interface ToolCard {
  title: string;
  blurb: string;
  href: string;
  icon: typeof Wrench;
  iconBg: string;
  iconRing: string;
  cta: string;
}

const TOOLS: ToolCard[] = [
  {
    title: "Edit your PDF",
    blurb: "Merge, split, extract or delete pages with a few clicks.",
    href: `${SUITE_BASE}/pdf-tool`,
    icon: Wrench,
    iconBg: "bg-[#7254F6]",
    iconRing: "ring-[#7254F6]/20",
    cta: "Open editor",
  },
  {
    title: "Convert from PDF",
    blurb: "Turn PDFs into images, text, or other formats in seconds.",
    href: `${SUITE_BASE}/convert?tab=pdf-to-images`,
    icon: FileOutput,
    iconBg: "bg-[#1754F4]",
    iconRing: "ring-[#1754F4]/20",
    cta: "Open converter",
  },
  {
    title: "Convert to PDF",
    blurb: "Combine images, Office files and more into a polished PDF.",
    href: `${SUITE_BASE}/convert?tab=images-to-pdf`,
    icon: FileInput,
    iconBg: "bg-[#32AD71]",
    iconRing: "ring-[#32AD71]/20",
    cta: "Open converter",
  },
  {
    title: "Compress your PDF",
    blurb: "Shrink large PDFs to 15, 10, 5 or 1 MB without losing clarity.",
    href: `${SUITE_BASE}/`,
    icon: Minimize2,
    iconBg: "bg-[#F37311]",
    iconRing: "ring-[#F37311]/20",
    cta: "Open compressor",
  },
];

const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function OnlineToolsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-6 max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
            custom={0}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#312E81]/8 text-[#312E81] border border-[#312E81]/15">
              <Zap className="w-3 h-3" />
              In your browser · No download
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-[#1E1B4B]">
              Online PDF Tools
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Edit, convert and compress your PDFs straight from the web.
              Sign in to use any tool — your free account includes{" "}
              <span className="font-semibold text-[#1E1B4B]">
                5 free actions every 24 hours
              </span>{" "}
              across the whole suite.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <Lock className="w-3.5 h-3.5" />
              Sign-in required · Free account is enough
            </div>
          </motion.div>
        </section>

        {/* ── Tool cards ───────────────────────────────────────── */}
        <section className="container mx-auto px-6 max-w-6xl mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.a
                  key={tool.title}
                  href={tool.href}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={FADE_UP}
                  custom={i}
                  className="group relative flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#312E81]/40 hover:shadow-lg hover:shadow-[#312E81]/5 transition-all duration-200"
                  data-testid={`tool-card-${tool.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div
                    className={`shrink-0 w-14 h-14 rounded-2xl ${tool.iconBg} ring-8 ${tool.iconRing} flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:rotate-[-4deg]`}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#312E81] transition-colors">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {tool.blurb}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#312E81] group-hover:gap-2.5 transition-all">
                      {tool.cta}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </section>

        {/* ── Why sign-in / quota strip ────────────────────────── */}
        <section className="container mx-auto px-6 max-w-5xl mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={FADE_UP}
            className="rounded-2xl bg-gradient-to-br from-[#312E81] via-[#3730A3] to-[#2563EB] p-8 md:p-10 text-white shadow-xl shadow-[#312E81]/20"
          >
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold">
                  Why we ask you to sign in
                </h2>
                <p className="mt-2 text-white/80 leading-relaxed">
                  Your account is what tracks the 5-action daily quota and
                  keeps your work history available across devices. New
                  here? Creating an account takes 30 seconds — no credit
                  card required.
                </p>
              </div>
              <div className="flex md:flex-col gap-3 md:items-end">
                <a
                  href={`${SUITE_BASE}/sign-up`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-[#312E81] font-semibold px-5 py-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  data-testid="online-tools-create-account"
                >
                  Create free account
                </a>
                <a
                  href={`${SUITE_BASE}/sign-in`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 text-white font-semibold px-5 py-2.5 border border-white/30 hover:bg-white/20 transition-all"
                  data-testid="online-tools-sign-in"
                >
                  I already have an account
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Want more? hint to desktop secure ────────────────── */}
        <section className="container mx-auto px-6 max-w-5xl mt-12">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Need self-destructing or password-locked PDFs?
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                Securing PDFs (expiry, password &amp; print controls) is
                handled by our desktop app, Luxor PDF Secure — built for
                offline-first workflows.
              </p>
              <a
                href="/products/pdf-security"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#312E81] hover:text-[#1E1B4B] mt-2"
              >
                Learn about Luxor PDF Secure
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
