import { motion } from "framer-motion";
import { ArrowRight, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-rose-50 rounded-full mix-blend-multiply filter blur-[100px] opacity-70" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="max-w-2xl"
          >
            <motion.div variants={FADE_UP} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Local Processing</span>
            </motion.div>
            
            <motion.h1 variants={FADE_UP} className="text-5xl md:text-7xl font-serif text-foreground leading-[1.1] mb-6">
              Uncompromising <br/><span className="text-primary italic">Document Control.</span>
            </motion.h1>
            
            <motion.p variants={FADE_UP} className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
              The professional PDF suite for legal teams and businesses. Process sensitive files locally. Enforce expiry dates globally. Zero data leaves your machine unless you want it to.
            </motion.p>
            
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md">
                <a href="#download">
                  <Download className="w-5 h-5 mr-2" />
                  Download for Windows
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-medium rounded-md group">
                <Link href="/web-app">
                  Open Web App
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.p variants={FADE_UP} className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-green-600 font-medium">✓</span> No internet required for desktop app
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white">
              <img 
                src="/hero-artwork.png" 
                alt="LexSecure PDF Abstract Security Visualization" 
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Access Enforced</p>
                <p className="text-sm font-bold text-foreground">Client-Side + Server-Side</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
