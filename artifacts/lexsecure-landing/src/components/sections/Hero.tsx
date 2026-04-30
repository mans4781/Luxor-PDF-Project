import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-white">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200 bg-white">
              <img
                src={`${import.meta.env.BASE_URL}hero-artwork.png`}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
