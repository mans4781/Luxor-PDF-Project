import { motion } from "framer-motion";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import { 
  Shield, Clock, Trash2, Lock, 
  EyeOff, FileText, PenTool, RefreshCw,
  Server, Key, Fingerprint
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.15 }
};

export default function AboutPage() {
  return (
    <ProductPageLayout>
      <div 
        className="min-h-screen bg-slate-950 text-slate-50 selection:bg-rose-500/30 selection:text-rose-200 font-sans overflow-hidden"
      >
        
        {/* ── 1. HERO ── */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto max-w-5xl relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 rounded-full mb-8 text-sm font-medium text-indigo-200 tracking-wide">
                <Lock className="w-4 h-4 text-rose-400" />
                The New Standard in Document Control
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                Sensitive documents <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">
                  shouldn't live forever.
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-indigo-200/80 max-w-3xl mx-auto leading-relaxed mb-16">
                We are building the definitive privacy-first PDF platform for professionals who demand absolute authority over their files. 
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/50 aspect-video max-w-4xl mx-auto bg-slate-900"
            >
              <img 
                src={`${import.meta.env.BASE_URL}brand/about-hero-vault.png`} 
                alt="Abstract secure vault"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* ── 2. THE PROBLEM (MARKET DEMAND) ── */}
        <section className="py-24 relative z-10 border-t border-white/5 bg-slate-950/50">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
              >
                <motion.h2 variants={fadeUp} className="text-3xl lg:text-4xl font-bold mb-6 text-white leading-tight">
                  The illusion of control in the digital age.
                </motion.h2>
                <motion.div variants={fadeUp} className="space-y-6 text-lg text-indigo-200/70 leading-relaxed">
                  <p>
                    Every day, lawyers, founders, doctors, and finance teams send highly sensitive contracts, medical records, and financials into the void. Once a PDF leaves your outbox, you lose control. It gets forwarded, downloaded, left on shared drives, and forgotten.
                  </p>
                  <p>
                    Existing PDF tools were built for an era before privacy mattered. They bolt security on as an afterthought. They track your usage, process your files on their servers, and offer no way to pull a document back once it's out in the wild.
                  </p>
                  <p className="text-rose-300 font-medium">
                    The demand for absolute privacy has never been higher, yet the tools haven't changed in twenty years. Until now.
                  </p>
                </motion.div>
              </motion.div>
              
              <motion.div 
                variants={fadeUp}
                className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square lg:aspect-auto lg:h-[500px] bg-slate-900"
              >
                <img 
                  src={`${import.meta.env.BASE_URL}brand/about-problem-void.png`} 
                  alt="Digital void"
                  className="w-full h-full object-cover mix-blend-screen opacity-80"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 3. CORE PHILOSOPHY / UNIQUENESS ── */}
        <section className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-slate-950 pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-5xl relative z-10">
            <motion.div 
              variants={fadeUp} 
              initial="initial" 
              whileInView="whileInView"
              className="text-center mb-20"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Built differently from day one.</h2>
              <p className="text-xl text-indigo-200/80 max-w-2xl mx-auto">
                We aren't a generic document company. We are a security company that builds document tools. 
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Server,
                  title: "Local Processing",
                  desc: "Your files never touch our servers unless you explicitly ask. Local processing ensures zero exposure."
                },
                {
                  icon: EyeOff,
                  title: "Zero Telemetry",
                  desc: "We don't track what you read, what you edit, or who you send it to. Your business is your business."
                },
                {
                  icon: Key,
                  title: "By Design, Not Add-on",
                  desc: "Encryption and expiry aren't premium features hidden in menus. They are the core foundation of our architecture."
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  variants={fadeUp}
                  className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
                    <item.icon className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-indigo-200/70 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 4. KEY FEATURE: CONTROL (EXPIRY & REVOKE) ── */}
        <section className="py-24 bg-indigo-950/20 border-y border-indigo-500/10 relative overflow-hidden">
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                className="order-2 lg:order-1 relative rounded-2xl overflow-hidden border border-indigo-500/20 aspect-square lg:aspect-auto lg:h-[600px] bg-slate-900"
              >
                <img 
                  src={`${import.meta.env.BASE_URL}brand/about-solution-shield.png`} 
                  alt="Crystal shield protection"
                  className="w-full h-full object-cover opacity-90"
                />
              </motion.div>
              
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                whileInView="whileInView"
                className="order-1 lg:order-2"
              >
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-rose-400 font-semibold tracking-wide uppercase text-sm mb-6">
                  <Fingerprint className="w-4 h-4" />
                  Absolute Control
                </motion.div>
                <motion.h2 variants={fadeUp} className="text-3xl lg:text-5xl font-bold mb-8 text-white leading-tight">
                  Give your documents a lifespan.
                </motion.h2>
                
                <div className="space-y-8">
                  {[
                    {
                      icon: Clock,
                      title: "Self-Destructing Files",
                      desc: "Set an exact date and time. When the clock strikes, the PDF corrupts itself automatically. No third-party viewer required."
                    },
                    {
                      icon: Trash2,
                      title: "Remote Revoke",
                      desc: "Sent the wrong file? Revoke access instantly with a single click, rendering the document useless to whoever holds it."
                    },
                    {
                      icon: Shield,
                      title: "Military-Grade AES-256",
                      desc: "Every file is locked down with AES-256 encryption. Only those with the exact password and active permissions can open it."
                    }
                  ].map((feat, i) => (
                    <motion.div key={i} variants={fadeUp} className="flex gap-5">
                      <div className="shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <feat.icon className="w-5 h-5 text-rose-400" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-2">{feat.title}</h4>
                        <p className="text-indigo-200/70 leading-relaxed">{feat.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 5. THE FULL SUITE ── */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div 
              variants={fadeUp} 
              initial="initial" 
              whileInView="whileInView"
              className="text-center mb-20"
            >
              <h2 className="text-4xl font-bold text-white mb-6">A complete, uncompromising suite.</h2>
              <p className="text-xl text-indigo-200/80 max-w-2xl mx-auto">
                Security shouldn't mean sacrificing capability. We provide every tool you need to work with PDFs, executed with rigorous privacy standards.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid md:grid-cols-3 gap-6"
            >
              <motion.div variants={fadeUp} className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/5 p-8 rounded-2xl">
                <FileText className="w-8 h-8 text-indigo-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Flawless Reading</h3>
                <p className="text-indigo-200/70">
                  A high-performance virtualized reader that handles massive documents smoothly. Add annotations, highlights, and comments—all saved locally.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-gradient-to-br from-violet-900/40 to-slate-900/40 border border-white/5 p-8 rounded-2xl">
                <PenTool className="w-8 h-8 text-violet-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Secure e-Signatures</h3>
                <p className="text-indigo-200/70">
                  Sign contracts and request signatures with legally binding cryptographic proof, ensuring the document hasn't been tampered with.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-gradient-to-br from-rose-900/20 to-slate-900/40 border border-white/5 p-8 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-rose-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Offline Conversion</h3>
                <p className="text-indigo-200/70">
                  Convert PDFs to Images, Word, or Excel entirely within your browser. The file never leaves your machine, preserving absolute confidentiality.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── 6. CTA ── */}
        <section className="py-32 relative overflow-hidden border-t border-white/5">
          <div className="absolute inset-0 bg-indigo-950/30" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-rose-600/10 blur-[150px] pointer-events-none" />
          
          <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
            <motion.div
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
            >
              <div className="w-20 h-20 mx-auto bg-slate-900 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-900/50">
                <Shield className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">
                Take back control of your documents.
              </h2>
              <p className="text-xl text-indigo-200/80 mb-12 max-w-2xl mx-auto">
                Join the professionals who refuse to compromise on data privacy. Experience the first PDF platform built like a vault.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/download" 
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold bg-white text-slate-950 rounded-full hover:bg-indigo-50 transition-colors"
                >
                  Download the App
                </a>
                <a 
                  href="/pricing" 
                  className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold border border-white/20 text-white rounded-full hover:bg-white/5 transition-colors"
                >
                  View Pricing
                </a>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </ProductPageLayout>
  );
}
