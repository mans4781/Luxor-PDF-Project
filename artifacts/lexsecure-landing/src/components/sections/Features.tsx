import { motion } from "framer-motion";
import { Zap, Layers, Shield, FileSearch, Pen, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const READER_FEATURES = [
  {
    title: "Lightning-fast rendering",
    description: "Open 1,000-page contracts in under a second. Built on a custom rendering engine optimized for legal & business documents.",
    icon: Zap,
  },
  {
    title: "Tabs & multi-doc workflows",
    description: "Compare contracts side-by-side, jump between exhibits, manage entire case files in one window — like a browser, but for PDFs.",
    icon: Layers,
  },
  {
    title: "Privacy-first by design",
    description: "Files stay on your device. No cloud uploads, no telemetry, no AI training on your documents. Your data is yours, period.",
    icon: Shield,
  },
  {
    title: "Smart search & annotations",
    description: "Find any clause across hundreds of files. Highlight, comment, redact. Annotations are saved with your document, never on our servers.",
    icon: FileSearch,
  },
];

const ADDON_APPS = [
  {
    name: "LuxorSign",
    tagline: "Legally-binding eSignatures",
    icon: Pen,
    href: "/products/esign",
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    name: "PDF Expiry",
    tagline: "Self-destructing documents",
    icon: Clock,
    href: "/products/pdf-security",
    color: "text-rose-700 bg-rose-50 border-rose-100",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-white border-t border-slate-100">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={FADE_UP}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6"
          >
            Luxor PDF Reader
          </motion.div>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={FADE_UP}
            className="text-4xl md:text-6xl font-serif text-slate-900 mb-6 tracking-[-0.02em] leading-[1.05]"
          >
            The PDF reader<br/>
            <span className="italic text-[#0C4782]">your business actually trusts.</span>
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={FADE_UP}
            className="text-lg text-slate-600"
          >
            Built for lawyers, finance teams, and operators who handle sensitive PDFs every day.
            Fast, private, and beautifully designed.
          </motion.p>
        </div>

        {/* Reader features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-24">
          {READER_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] } }
              }}
              className="group p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0C4782]/5 border border-[#0C4782]/10 flex items-center justify-center mb-5">
                <feature.icon className="w-5 h-5 text-[#0C4782]" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-[15px]">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Add-ons section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={FADE_UP}
          className="max-w-5xl mx-auto"
        >
          <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-10 lg:p-14">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">More from Luxor</p>
                <h3 className="text-3xl md:text-4xl font-serif text-slate-900 tracking-[-0.02em] leading-tight">
                  Add powerful tools<br/>to your subscription.
                </h3>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-[#0C4782] font-semibold hover:gap-3 transition-all"
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
                  className="group flex items-center gap-5 p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${app.color}`}>
                    <app.icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-0.5">{app.name}</h4>
                    <p className="text-sm text-slate-600">{app.tagline}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
