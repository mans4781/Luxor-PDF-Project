import { useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DownloadButton } from "@/components/reader/DownloadButton";
import { ReaderMockup } from "@/components/reader/ReaderMockup";
import { ProductivityMockup } from "@/components/reader/ProductivityMockup";
import { benefits, features, systemRequirements, faqs } from "@/components/reader/data";
import { CheckCircle2, ChevronDown, Monitor, Smartphone, Apple, Shield, XCircle } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useState } from "react";

function Accordion({ faqs }: { faqs: { q: string, a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] focus-visible:ring-inset rounded-xl"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            aria-controls={`faq-panel-${i}`}
            id={`faq-trigger-${i}`}
          >
            <span className="font-medium text-slate-900">{faq.q}</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 pt-0 text-slate-600 text-[15px] leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function PdfReaderPage() {
  // SEO
  useEffect(() => {
    const title = "Luxor PDF Reader – Fast, Lightweight and Secure PDF Reader";
    const description = "Download Luxor PDF Reader for Windows. Open, view, search, annotate, bookmark, print, and securely read PDF documents with a fast and lightweight desktop experience.";
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }

    const setOg = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setOg("og:title", title);
    setOg("og:description", description);
    setOg("og:type", "website");

    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.id = "reader-jsonld";
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Luxor PDF Reader",
      operatingSystem: "Windows 10, Windows 11",
      applicationCategory: "BusinessApplication",
      description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
    document.head.appendChild(ldScript);

    return () => {
      document.getElementById("reader-jsonld")?.remove();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#E50914] selection:text-white pt-20">
      <Navbar />

      <main>
        {/* HERO SECTION */}
        <section className="bg-[#F8FAFC] py-14 lg:py-24 overflow-hidden relative">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Left Side */}
              <motion.div className="min-w-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold tracking-widest text-slate-500 uppercase mb-6 bg-white shadow-sm">
                  FAST • LIGHTWEIGHT • SECURE
                </div>
                
                <h1 className="text-4xl lg:text-6xl font-extrabold text-[#111827] leading-[1.1] mb-6 tracking-tight">
                  Read PDFs Faster<br />
                  with <span className="text-[#E50914]">Luxor PDF Reader</span>
                </h1>
                
                <p className="text-lg text-[#4B5563] leading-relaxed mb-8 max-w-xl">
                  A fast, lightweight, and secure PDF reader for Windows. Open, view, search, annotate, and print PDFs with a smooth and elegant experience.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                  <DownloadButton className="w-full sm:w-auto" />
                  <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                    Learn More
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </a>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <div className="w-6 h-6 rounded-full bg-[#FFF3F3] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E50914]" />
                  </div>
                  Built for fast, private, and reliable PDF reading
                </div>
              </motion.div>

              {/* Right Side */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative flex justify-center lg:justify-end min-w-0">
                <ReaderMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* BENEFITS STRIP */}
        <section className="bg-[#F8FAFC] pb-16">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="bg-white rounded-[22px] border border-slate-200 shadow-sm p-8 lg:p-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 lg:divide-x divide-slate-100">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex flex-col gap-3 lg:pl-12 first:lg:pl-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3F3] text-[#E50914] flex items-center justify-center">
                      <benefit.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Everything You Need in a PDF Reader</h2>
              <p className="text-lg text-slate-500">Powerful features. Beautifully simple.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {features.map((feat, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF3F3] text-[#E50914] flex items-center justify-center mb-5">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTIVITY SHOWCASE */}
        <section id="tools" className="py-20 lg:py-28 bg-[#F8FAFC]">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 flex justify-center lg:justify-start relative">
                <ProductivityMockup />
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#FFD6D6] bg-[#FFF3F3] text-[#E50914] text-xs font-bold tracking-widest uppercase mb-6">
                  BUILT FOR PRODUCTIVITY
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Tools that help you work smarter</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Luxor PDF Reader gives you all the essential tools to read, review, and manage your PDFs efficiently.
                </p>
                <ul className="space-y-4">
                  {[
                    "Annotate and highlight important content",
                    "Add bookmarks and organize your documents",
                    "Search and navigate with ease",
                    "Work comfortably with dark mode",
                    "Print and share with advanced options"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#E50914]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMPATIBILITY SECTION */}
        <section className="py-20 lg:py-28 bg-white border-y border-slate-100">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Works Where You Work</h2>
              <p className="text-lg text-slate-500">Available now on Windows. More platforms are coming soon.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Windows */}
              <div className="rounded-[22px] border-2 border-[#FFD6D6] bg-[#FFF3F3] p-8 relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-4 right-4 bg-[#E50914] text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">AVAILABLE NOW</div>
                <Monitor className="w-12 h-12 text-[#E50914] mb-4" />
                <h3 className="text-xl font-bold text-[#B8000B] mb-2">Windows</h3>
                <p className="text-sm text-[#E50914]/80 font-medium">Windows 10/11 (64-bit)</p>
              </div>

              {/* Mac */}
              <div className="rounded-[22px] border border-slate-200 bg-white p-8 relative flex flex-col items-center text-center opacity-70">
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">COMING SOON</div>
                <Apple className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Mac</h3>
                <p className="text-sm text-slate-500 font-medium">macOS</p>
              </div>

              {/* Android */}
              <div className="rounded-[22px] border border-slate-200 bg-white p-8 relative flex flex-col items-center text-center opacity-70">
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">COMING SOON</div>
                <Smartphone className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Android</h3>
                <p className="text-sm text-slate-500 font-medium">Android phones and tablets</p>
              </div>

              {/* iOS */}
              <div className="rounded-[22px] border border-slate-200 bg-white p-8 relative flex flex-col items-center text-center opacity-70">
                <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">COMING SOON</div>
                <Smartphone className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">iOS</h3>
                <p className="text-sm text-slate-500 font-medium">iPhone and iPad</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section id="security" className="py-20 lg:py-28 bg-[#F8FAFC] overflow-hidden">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative flex justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFF3F3] to-[#E50914]/5 rounded-full blur-3xl scale-150" />
                <div className="relative w-80 h-80 bg-white rounded-full border border-slate-100 shadow-xl flex items-center justify-center z-10">
                  <Shield className="w-32 h-32 text-[#E50914]" strokeWidth={1} />
                  <div className="absolute bg-white p-3 rounded-xl shadow-lg border border-slate-100 -bottom-4 -right-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-500 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                  PRIVACY BY DESIGN
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">Your PDFs stay on your device</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Luxor PDF Reader is designed for private, secure document viewing. Your files are not uploaded to external servers simply to open and read them.
                </p>
                <ul className="space-y-4">
                  {[
                    "Local document processing",
                    "Password-protected PDF support",
                    "No forced cloud upload",
                    "Private reading environment",
                    "Secure Windows desktop experience"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <Shield className="w-5 h-5 text-[#E50914]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-16 text-center tracking-tight">Why Choose Luxor PDF Reader?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1: Luxor */}
              <div className="rounded-[22px] border-2 border-[#FFD6D6] bg-[#FFF3F3] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#FFD6D6]">
                  <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-8 h-8" />
                  <h3 className="text-xl font-bold text-[#B8000B]">Luxor PDF Reader</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Fast and lightweight",
                    "Clean and easy to use",
                    "Secure and private",
                    "Regular updates",
                    "Free to get started"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-[#B8000B] font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#E50914] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 2: Others */}
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-8">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800">Other PDF Readers</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Slow with large files",
                    "Bloated and complex",
                    "Data collection risks",
                    "Infrequent updates",
                    "Hidden costs"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                      <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Online */}
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-8">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800">Online PDF Viewers</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    "Requires internet",
                    "File upload risks",
                    "Limited features",
                    "Slow performance",
                    "Privacy concerns"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                      <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 lg:py-28 bg-[#F8FAFC]">
          <div className="container mx-auto px-6 max-w-[1000px]">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-16 text-center tracking-tight">Simple Access to Better PDF Reading</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {/* Free Tier */}
              <div className="rounded-[22px] border border-slate-200 bg-white p-8 lg:p-10 shadow-sm flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Reader</h3>
                <div className="text-4xl font-black text-slate-900 mb-8">Free</div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "Open and read PDFs",
                    "Search documents",
                    "Zoom and navigate",
                    "Bookmarks",
                    "Print documents",
                    "Dark mode"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <DownloadButton className="w-full justify-center" variant="primary" />
              </div>

              {/* Premium Tier */}
              <div className="rounded-[22px] border-2 border-[#E50914] bg-white p-8 lg:p-10 shadow-xl relative flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E50914] text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">RECOMMENDED</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Luxor PDF Suite</h3>
                <div className="text-4xl font-black text-slate-900 mb-8">Premium</div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "Reader plus advanced Luxor PDF tools",
                    "PDF security tools",
                    "PDF conversion tools",
                    "Merge, split, compress, and organize PDFs",
                    "Future product integrations"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-800 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-[#E50914] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold bg-[#FFF3F3] text-[#E50914] hover:bg-[#FFD6D6] transition-colors border border-[#FFD6D6]">
                  Explore Luxor PDF Suite
                </Link>
              </div>
            </div>

            {/* System requirements */}
            <div className="bg-white border border-slate-200 rounded-[22px] p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">System requirements</h3>
              <p className="text-sm text-slate-500 mb-8 text-center">What your PC needs to install and run Luxor PDF Reader</p>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {systemRequirements.map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Monitor className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-sm font-semibold text-slate-900 mb-1">{label}</dt>
                      <dd className="text-sm text-slate-500 leading-relaxed">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="support" className="py-20 lg:py-28 bg-white border-y border-slate-100">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-12 text-center tracking-tight">Frequently Asked Questions</h2>
            <Accordion faqs={faqs} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 lg:py-28 bg-[#F8FAFC]">
          <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="rounded-[32px] overflow-hidden relative" style={{ background: "linear-gradient(135deg, #E50914 0%, #FF2020 55%, #B8000B 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              
              <div className="grid lg:grid-cols-2 gap-12 p-12 lg:p-20 relative z-10 items-center">
                <div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                    <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight">Ready to read PDFs the fast and secure way?</h2>
                  <p className="text-lg text-white/80">Download Luxor PDF Reader for Windows today.</p>
                </div>
                
                <div className="flex justify-start lg:justify-end">
                  <DownloadButton variant="white" className="w-full sm:w-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </MotionConfig>
  );
}
