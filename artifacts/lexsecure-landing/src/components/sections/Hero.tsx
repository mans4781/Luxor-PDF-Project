import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wrench, ShieldCheck, Clock, Shield, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const HERO_STATS = [
  { icon: Wrench,       value: "8+",       label: "PDF tools" },
  { icon: ShieldCheck,  value: "256-bit",  label: "security-ready" },
  { icon: Clock,        value: "24/7",     label: "document access" },
];

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-br from-blue-50/60 via-white to-rose-50/40">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[60%] bg-[#EAF2FB] rounded-full filter blur-[120px] opacity-80" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[45%] h-[50%] bg-[#FDECEE] rounded-full filter blur-[120px] opacity-70" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="lg:col-span-7"
          >
            <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium tracking-tight mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>The Luxor Suite · Now in subscription</span>
            </motion.div>

            <motion.h1 variants={FADE_UP} className="text-5xl md:text-[5.5rem] text-slate-900 leading-[1.05] tracking-[-0.02em] mb-6">
              Premium PDF tools,<br />
              <span className="text-[#2563EB] font-semibold">on subscription.</span>
            </motion.h1>

            <motion.p variants={FADE_UP} className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
              Luxor PDF Reader is the flagship of the Luxor suite — a fast, privacy-first PDF reader for professionals.
              Start free. Upgrade when you need more, or add eSign and Expiry to your plan.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-start gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-7 text-base font-semibold bg-[#312E81] hover:bg-[#3730A3] text-white rounded-lg shadow-sm group">
                <Link href="/pricing">
                  Start free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-base font-medium rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </motion.div>

            <motion.div variants={FADE_UP} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Free tier · No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Windows · macOS · Web
              </span>
            </motion.div>

            {/* Stats trio */}
            <motion.dl variants={FADE_UP} className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {HERO_STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-4 py-4 hover:border-[#2563EB]/40 hover:shadow-md hover:shadow-[#2563EB]/5 transition-all duration-200"
                >
                  <Icon className="w-4 h-4 text-[#2563EB] mb-2" strokeWidth={2.2} aria-hidden="true" />
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                    {value}
                  </dd>
                  <p aria-hidden="true" className="mt-1.5 text-[11px] font-medium text-slate-500 leading-tight">
                    {label}
                  </p>
                </div>
              ))}
            </motion.dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200 bg-white">
              <img
                src={`${import.meta.env.BASE_URL}hero-artwork.png?v=2`}
                alt="Luxor PDF Reader interface"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl shadow-slate-900/5 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FDECEE] rounded-lg flex items-center justify-center">
                <span className="text-[#2563EB] text-lg font-black">L</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Flagship</p>
                <p className="text-sm font-bold text-slate-900">Luxor PDF Reader</p>
              </div>
            </div>

            {/* Floating Secure PDF mock card */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
              className="absolute -top-4 right-2 sm:-right-4 lg:-right-8 w-[210px] sm:w-[240px] lg:w-[260px] bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-white" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">Active</p>
                    <p className="text-sm font-extrabold leading-tight">Secure PDF</p>
                  </div>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Ban className="w-3 h-3 text-rose-600" strokeWidth={2.5} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700">Print</p>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">Blocked</p>
                </div>
                <div className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Ban className="w-3 h-3 text-rose-600" strokeWidth={2.5} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700">Copy</p>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">Blocked</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
