import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  ArrowRight, Shield, PenTool, FileText, 
  Users, Download, Globe, FileKey
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

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

export default function Home2Page() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Navbar />

      <main className="pt-24 lg:pt-32">
        {/* HERO SECTION */}
        <section className="relative px-6 pb-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-red-100/40 rounded-full blur-[120px]" />
            <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-200/50 border border-slate-300/50 text-sm font-semibold text-slate-700 mb-8 tracking-wide">
                  About Us
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                  Powerful PDF Solutions,<br />Built for Everyone.
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                  Discover the suite of tools designed to simplify your document management. Read, secure, and sign PDFs with ease.
                </p>
                
                <Button 
                  asChild
                  size="lg" 
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-full px-8 h-14 text-base font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-105"
                >
                  <a href="#products">
                    Explore Our Products <ArrowRight className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </motion.div>
            </div>

            {/* Laptop Mockup Visual */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto max-w-5xl"
            >
              <div className="relative aspect-[16/10] bg-slate-800 rounded-t-3xl border-[12px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
                {/* Screen Content - Abstract UI */}
                <div className="absolute inset-0 bg-slate-50 flex flex-col">
                  {/* Fake Toolbar */}
                  <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 max-w-xl mx-auto h-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center px-3 gap-2">
                      <Shield className="w-4 h-4 text-slate-400" />
                      <div className="w-48 h-2 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  {/* Fake Content */}
                  <div className="flex-1 flex p-6 gap-6">
                    <div className="w-64 shrink-0 flex flex-col gap-4">
                      <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                        <div className="w-full h-3 bg-slate-100 rounded-full" />
                        <div className="w-3/4 h-3 bg-slate-100 rounded-full" />
                        <div className="w-5/6 h-3 bg-slate-100 rounded-full" />
                      </div>
                      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                        <div className="w-full h-8 bg-indigo-50 rounded-lg" />
                        <div className="w-full h-8 bg-slate-50 rounded-lg" />
                        <div className="w-full h-8 bg-slate-50 rounded-lg" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-4">
                        <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="w-48 h-4 bg-slate-100 rounded" />
                      </div>
                      <div className="flex-1 p-8 flex flex-col gap-6">
                        <div className="w-3/4 h-8 bg-slate-100 rounded-lg" />
                        <div className="space-y-3">
                          <div className="w-full h-3 bg-slate-50 rounded" />
                          <div className="w-full h-3 bg-slate-50 rounded" />
                          <div className="w-5/6 h-3 bg-slate-50 rounded" />
                        </div>
                        <div className="mt-8 space-y-3">
                          <div className="w-full h-3 bg-slate-50 rounded" />
                          <div className="w-full h-3 bg-slate-50 rounded" />
                          <div className="w-4/6 h-3 bg-slate-50 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Laptop Base */}
              <div className="relative h-6 bg-slate-300 rounded-b-[2rem] shadow-xl border-t border-white/40 flex justify-center">
                <div className="w-32 h-2 bg-slate-400/50 rounded-b-lg" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section id="products" className="py-24 bg-white border-y border-slate-100 scroll-mt-20">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div 
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
              className="text-center max-w-3xl mx-auto mb-20"
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">
                Three Powerful Tools.<br />One Complete PDF Experience.
              </h2>
            </motion.div>

            <div className="space-y-24">
              {/* Product 1: Reader */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="order-2 lg:order-1"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 font-bold text-sm tracking-wide mb-6 border border-red-100">
                    <FileText className="w-4 h-4" /> Luxor PDF Reader
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Your go-to reader for all PDF needs.
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Experience fast, smooth, and reliable PDF viewing with advanced annotation tools to help you review documents efficiently.
                  </p>
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 h-12">
                    <Link href="/products/pdf-reader">Download Reader</Link>
                  </Button>
                </motion.div>
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="order-1 lg:order-2 bg-gradient-to-tr from-red-100 to-rose-50 rounded-3xl p-8 lg:p-12"
                >
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden aspect-[4/3] ring-1 ring-slate-900/5 relative">
                    <img 
                      src={`${import.meta.env.BASE_URL}brand/product-reader.png`} 
                      alt="Luxor PDF Reader Interface" 
                      className="w-full h-full object-cover object-left-top"
                      onError={(e) => {
                        // Fallback UI if image missing
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-slate-50 p-6 flex flex-col">
                      <div className="h-10 border-b border-slate-200 flex items-center gap-4 px-2">
                         <div className="w-24 h-4 bg-slate-200 rounded" />
                      </div>
                      <div className="flex-1 flex mt-4 gap-4">
                         <div className="w-16 bg-slate-100 rounded-lg" />
                         <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg p-6">
                           <div className="w-1/2 h-6 bg-red-100 rounded mb-4" />
                           <div className="space-y-2">
                             <div className="w-full h-3 bg-slate-100 rounded" />
                             <div className="w-full h-3 bg-slate-100 rounded" />
                             <div className="w-3/4 h-3 bg-slate-100 rounded" />
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Product 2: Secure */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl p-8 lg:p-12"
                >
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden aspect-[4/3] ring-1 ring-slate-900/5 relative">
                    <img 
                      src={`${import.meta.env.BASE_URL}brand/product-secure.png`} 
                      alt="Luxor PDF Secure Interface" 
                      className="w-full h-full object-cover object-left-top"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                     <div className="hidden absolute inset-0 bg-slate-50 p-6 flex flex-col items-center justify-center">
                        <Shield className="w-16 h-16 text-blue-500 mb-4 opacity-50" />
                        <div className="w-48 h-8 bg-blue-100 rounded-full" />
                     </div>
                  </div>
                </motion.div>
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-bold text-sm tracking-wide mb-6 border border-blue-100">
                    <Shield className="w-4 h-4" /> Luxor PDF Secure
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Protect your sensitive information.
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Add passwords, set expiration dates, and apply watermarks to ensure your documents stay safe and confidential.
                  </p>
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 h-12">
                    <Link href="/products/pdf-security">Learn More</Link>
                  </Button>
                </motion.div>
              </div>

              {/* Product 3: eSign */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="order-2 lg:order-1"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-sm tracking-wide mb-6 border border-emerald-100">
                    <PenTool className="w-4 h-4" /> Luxor PDF eSign
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                    Sign documents digitally in seconds.
                  </h3>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Create, request, and manage legally-binding e-signatures to streamline your approval workflows.
                  </p>
                  <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 h-12">
                    <Link href="/products/esign">Start Free Trial</Link>
                  </Button>
                </motion.div>
                <motion.div 
                  variants={fadeUp}
                  initial="initial"
                  whileInView="whileInView"
                  className="order-1 lg:order-2 bg-gradient-to-tr from-emerald-100 to-green-50 rounded-3xl p-8 lg:p-12"
                >
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden aspect-[4/3] ring-1 ring-slate-900/5 relative">
                    <img 
                      src={`${import.meta.env.BASE_URL}brand/product-esign.png`} 
                      alt="Luxor PDF eSign Interface" 
                      className="w-full h-full object-cover object-left-top"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-slate-50 p-6 flex flex-col items-center justify-center">
                        <PenTool className="w-16 h-16 text-emerald-500 mb-4 opacity-50" />
                        <div className="w-48 h-8 bg-emerald-100 rounded-full" />
                     </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div 
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-slate-800">Trusted by professionals worldwide.</h2>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12"
            >
              {[
                { label: "Happy Users", value: "100K+", icon: Users },
                { label: "Documents Secured", value: "1M+", icon: FileKey },
                { label: "Downloads", value: "500K+", icon: Download },
                { label: "Countries", value: "120+", icon: Globe }
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeUp}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DC2626]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#2563EB]/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
          </div>

          <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
            <motion.div
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                One Mission: Make PDF Simple, Secure & Smart.
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Ready to elevate your document workflow? Join thousands of professionals today.
              </p>
              <Button 
                asChild
                size="lg" 
                className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 h-14 text-base font-bold shadow-xl transition-all hover:scale-105"
              >
                <Link href="/pricing">Get Started Now</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
