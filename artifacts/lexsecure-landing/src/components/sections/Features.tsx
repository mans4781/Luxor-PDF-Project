import { motion, useReducedMotion } from "framer-motion";
import {
  Zap,
  Layers,
  Shield,
  FileSearch,
  Pen,
  Clock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";

type ReaderFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconRing: string;
  iconText: string;
  hoverBorder: string;
  hoverShadow: string;
  hoverTitle: string;
  gradient: string;
  blob: string;
};

const READER_FEATURES: ReaderFeature[] = [
  {
    title: "Lightning-fast rendering",
    description:
      "Open 1,000-page contracts in under a second. Built on a custom rendering engine optimized for legal & business documents.",
    icon: Zap,
    iconBg: "bg-[#D97706]/10",
    iconRing: "ring-[#D97706]/20",
    iconText: "text-[#D97706]",
    hoverBorder: "group-hover:border-[#D97706]/40",
    hoverShadow: "group-hover:shadow-[#D97706]/15",
    hoverTitle: "group-hover:text-[#D97706]",
    gradient: "from-[#B45309] via-[#D97706] to-[#FBBF24]",
    blob: "bg-[#D97706]/15",
  },
  {
    title: "Tabs & multi-doc workflows",
    description:
      "Compare contracts side-by-side, jump between exhibits, manage entire case files in one window — like a browser, but for PDFs.",
    icon: Layers,
    iconBg: "bg-[#2563EB]/10",
    iconRing: "ring-[#2563EB]/20",
    iconText: "text-[#2563EB]",
    hoverBorder: "group-hover:border-[#2563EB]/40",
    hoverShadow: "group-hover:shadow-[#2563EB]/15",
    hoverTitle: "group-hover:text-[#2563EB]",
    gradient: "from-[#1D4ED8] via-[#2563EB] to-[#60A5FA]",
    blob: "bg-[#2563EB]/15",
  },
  {
    title: "Privacy-first by design",
    description:
      "Files stay on your device. No cloud uploads, no telemetry, no AI training on your documents. Your data is yours, period.",
    icon: Shield,
    iconBg: "bg-[#059669]/10",
    iconRing: "ring-[#059669]/20",
    iconText: "text-[#059669]",
    hoverBorder: "group-hover:border-[#059669]/40",
    hoverShadow: "group-hover:shadow-[#059669]/15",
    hoverTitle: "group-hover:text-[#059669]",
    gradient: "from-[#047857] via-[#059669] to-[#34D399]",
    blob: "bg-[#059669]/15",
  },
  {
    title: "Smart search & annotations",
    description:
      "Find any clause across hundreds of files. Highlight, comment, redact. Annotations are saved with your document, never on our servers.",
    icon: FileSearch,
    iconBg: "bg-[#312E81]/10",
    iconRing: "ring-[#312E81]/20",
    iconText: "text-[#312E81]",
    hoverBorder: "group-hover:border-[#312E81]/40",
    hoverShadow: "group-hover:shadow-[#312E81]/15",
    hoverTitle: "group-hover:text-[#312E81]",
    gradient: "from-[#1E1B4B] via-[#312E81] to-[#6366F1]",
    blob: "bg-[#312E81]/15",
  },
];

type Addon = {
  name: string;
  tagline: string;
  icon: LucideIcon;
  href: string;
  iconBg: string;
  iconRing: string;
  iconText: string;
  hoverBorder: string;
  hoverShadow: string;
  hoverTitle: string;
  gradient: string;
};

const ADDON_APPS: Addon[] = [
  {
    name: "LuxorSign",
    tagline: "Legally-binding eSignatures",
    icon: Pen,
    href: "/products/esign",
    iconBg: "bg-[#2563EB]/10",
    iconRing: "ring-[#2563EB]/20",
    iconText: "text-[#2563EB]",
    hoverBorder: "group-hover:border-[#2563EB]/40",
    hoverShadow: "group-hover:shadow-[#2563EB]/20",
    hoverTitle: "group-hover:text-[#2563EB]",
    gradient: "from-[#1D4ED8] via-[#2563EB] to-[#60A5FA]",
  },
  {
    name: "PDF Expiry",
    tagline: "Self-destructing documents",
    icon: Clock,
    href: "/products/pdf-security",
    iconBg: "bg-[#FB7185]/10",
    iconRing: "ring-[#FB7185]/25",
    iconText: "text-[#E11D48]",
    hoverBorder: "group-hover:border-[#E11D48]/40",
    hoverShadow: "group-hover:shadow-[#FB7185]/20",
    hoverTitle: "group-hover:text-[#E11D48]",
    gradient: "from-[#E11D48] via-[#FB7185] to-[#FDA4AF]",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function Features() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="relative py-24 md:py-32 bg-gradient-to-b from-white via-slate-50/40 to-white border-t border-slate-100 overflow-hidden"
    >
      {/* Section-level decorative glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#2563EB]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#059669]/5 blur-3xl"
      />

      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2563EB]/10 via-[#312E81]/10 to-[#059669]/10 border border-slate-200 text-[#312E81] text-xs font-semibold mb-6 ring-1 ring-white/60"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            Luxor PDF Reader
          </motion.div>
          <motion.h2
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
            className="text-4xl md:text-6xl text-slate-900 mb-6 tracking-[-0.02em] leading-[1.05]"
          >
            The PDF reader
            <br />
            <span className="bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent font-semibold">
              your business actually trusts.
            </span>
          </motion.h2>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
            className="text-lg text-slate-600"
          >
            Built for lawyers, finance teams, and operators who handle sensitive
            PDFs every day. Fast, private, and beautifully designed.
          </motion.p>
        </div>

        {/* Reader features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-24">
          {READER_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
                ease: EASE,
              }}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 pt-9 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${feature.hoverBorder} ${feature.hoverShadow}`}
            >
              {/* Top gradient accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-80 transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden="true"
              />

              {/* Soft animated blob in corner */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full ${feature.blob} blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
              />

              <div className="relative">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${feature.iconBg} ${feature.iconRing} ${feature.iconText} transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] group-hover:shadow-lg`}
                >
                  <feature.icon className="h-6 w-6" strokeWidth={2.4} />
                </div>
                <h3
                  className={`text-xl font-bold text-slate-900 mb-2 tracking-tight transition-colors duration-300 ${feature.hoverTitle}`}
                >
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-[15px]">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add-ons section */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 border border-slate-200 p-10 lg:p-14 shadow-sm">
            {/* decorative blobs */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#312E81]/8 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#FB7185]/8 blur-3xl"
            />

            <div className="relative">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-[#312E81] uppercase tracking-wider mb-3 px-3 py-1 rounded-full bg-[#312E81]/8 border border-[#312E81]/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#312E81]" />
                    More from Luxor
                  </p>
                  <h3 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.02em] leading-tight">
                    Add powerful tools
                    <br />
                    to your subscription.
                  </h3>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 text-[#312E81] font-semibold hover:gap-3 transition-all"
                >
                  See all add-ons
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ADDON_APPS.map((app) => (
                  <Link
                    key={app.name}
                    href={app.href}
                    className={`group relative overflow-hidden flex items-center gap-5 p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${app.hoverBorder} ${app.hoverShadow}`}
                  >
                    {/* Top gradient accent bar */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${app.gradient} opacity-80 transition-opacity duration-500 group-hover:opacity-100`}
                      aria-hidden="true"
                    />

                    <div
                      className={`relative w-14 h-14 rounded-xl ring-1 flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] ${app.iconBg} ${app.iconRing} ${app.iconText}`}
                    >
                      <app.icon className="w-6 h-6" strokeWidth={2.4} />
                    </div>
                    <div className="flex-1 relative">
                      <h4
                        className={`text-lg font-semibold text-slate-900 mb-0.5 transition-colors duration-300 ${app.hoverTitle}`}
                      >
                        {app.name}
                      </h4>
                      <p className="text-sm text-slate-600">{app.tagline}</p>
                    </div>
                    <ArrowRight
                      className={`relative w-5 h-5 text-slate-400 ${app.hoverTitle} group-hover:translate-x-1 transition-all`}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
