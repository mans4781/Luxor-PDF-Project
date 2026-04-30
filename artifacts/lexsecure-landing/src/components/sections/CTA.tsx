import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-white border-t border-slate-100">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto rounded-3xl bg-[#312E81] relative overflow-hidden p-12 md:p-20"
        >
          {/* Decorative gradient — Scheme 1 trio */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-[#2563EB] rounded-full blur-[120px] opacity-35" />
            <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-[#FB7185] rounded-full blur-[120px] opacity-25" />
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-2">
              <h2 className="text-4xl md:text-5xl text-white mb-5 tracking-[-0.02em] leading-[1.1]">
                Start free.<br />
                <span className="text-neutral-300">Upgrade when you're ready.</span>
              </h2>
              <p className="text-lg text-neutral-300 max-w-xl">
                Join thousands of professionals who switched to Luxor PDF.
                No credit card required to start. Cancel any time.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="h-14 px-8 text-base font-semibold bg-white text-[#312E81] hover:bg-neutral-100 rounded-lg shadow-xl group">
                <Link href="/pricing">
                  Start free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-medium bg-transparent border-white/30 text-white hover:bg-white/10 rounded-lg">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
