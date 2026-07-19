import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DownloadButton } from "@/components/reader/DownloadButton";
import readerHeroApp from "@/assets/reader-hero-app.png";
import readerProductivity from "@/assets/reader-productivity.png";
import { benefits, features, faqs } from "@/components/reader/data";
import { CheckCircle2, Plus, Monitor, Smartphone, XCircle, Star } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";

function WindowsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.1 10.6 4v7.6H3V5.1zm0 13.8V12.4h7.6V20L3 18.9zM11.6 3.85 21 2.5v9.1h-9.4V3.85zm0 16.3V12.4H21v9.1l-9.4-1.35z" />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 12.789c.024 2.605 2.285 3.472 2.31 3.483-.019.061-.361 1.236-1.191 2.449-.717 1.049-1.462 2.093-2.636 2.115-1.153.021-1.524-.684-2.842-.684-1.319 0-1.731.663-2.822.705-1.133.043-1.995-1.134-2.719-2.179-1.478-2.137-2.608-6.04-1.091-8.674.753-1.308 2.1-2.137 3.562-2.158 1.112-.021 2.162.748 2.842.748.679 0 1.955-.925 3.296-.789.561.023 2.137.227 3.148 1.708-.081.05-1.879 1.098-1.857 3.276zM14.19 5.246c.601-.728 1.006-1.741.895-2.746-.866.035-1.913.577-2.534 1.304-.557.644-1.045 1.675-.913 2.663.966.075 1.951-.491 2.552-1.221z" />
    </svg>
  );
}

function AndroidLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.38 8.4c0-.3.24-.55.55-.55h10.14c.31 0 .55.25.55.55v6.7c0 .72-.58 1.3-1.3 1.3h-.5v2.55a1.28 1.28 0 1 1-2.55 0V16.4h-2.54v2.55a1.28 1.28 0 1 1-2.55 0V16.4h-.5c-.72 0-1.3-.58-1.3-1.3V8.4zM3.5 8.05c.7 0 1.28.57 1.28 1.27v4.28a1.28 1.28 0 1 1-2.55 0V9.32c0-.7.57-1.27 1.27-1.27zm17 0c.7 0 1.28.57 1.28 1.27v4.28a1.28 1.28 0 1 1-2.55 0V9.32c0-.7.57-1.27 1.27-1.27zM8.66 3.4l-.87-1.58a.34.34 0 0 1 .13-.46.34.34 0 0 1 .46.13l.89 1.6a6.2 6.2 0 0 1 5.46 0l.89-1.6a.34.34 0 0 1 .46-.13c.16.09.22.3.13.46l-.87 1.58a5.55 5.55 0 0 1 2.6 3.88H6.06a5.55 5.55 0 0 1 2.6-3.88zm.85 2.03a.64.64 0 1 0 0 1.28.64.64 0 0 0 0-1.28zm4.98 0a.64.64 0 1 0 0 1.28.64.64 0 0 0 0-1.28z" />
    </svg>
  );
}

function Accordion({ faqs }: { faqs: { q: string, a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Split FAQs into two columns
  const half = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, half);
  const rightFaqs = faqs.slice(half);

  const renderColumn = (columnFaqs: typeof faqs, offset: number) => (
    <div className="space-y-3">
      {columnFaqs.map((faq, i) => {
        const actualIndex = i + offset;
        const isOpen = openIndex === actualIndex;
        return (
          <div key={actualIndex} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-colors shadow-sm">
            <button
              className="w-full flex items-center justify-between p-5 lg:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] focus-visible:ring-inset"
              onClick={() => setOpenIndex(isOpen ? null : actualIndex)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${actualIndex}`}
              id={`faq-trigger-${actualIndex}`}
            >
              <span className="font-semibold text-slate-900 text-[15px]">{faq.q}</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 ml-4">
                <Plus className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} aria-hidden="true" />
              </div>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${actualIndex}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${actualIndex}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 lg:p-6 pt-0 text-slate-600 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
      {renderColumn(leftFaqs, 0)}
      {renderColumn(rightFaqs, half)}
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
        <section className="bg-gradient-to-b from-[#FFF5F5] to-white pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden relative">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-stretch">
              
              {/* Left Side */}
              <motion.div className="min-w-0 flex flex-col items-start text-left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-red-100 bg-white text-xs font-bold tracking-widest text-[#E50914] uppercase mb-6 shadow-sm">
                  FAST • LIGHTWEIGHT • SECURE
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-[64px] font-extrabold text-[#111827] leading-[1.1] mb-6 tracking-tight">
                  Read PDFs Faster<br />
                  with <span className="text-[#E50914]">Luxor PDF Reader</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-[#4B5563] leading-relaxed mb-10 max-w-xl">
                  A fast, lightweight, and secure PDF reader for Windows. Open, view, search, annotate, and print PDFs with a smooth and elegant experience.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full sm:w-auto">
                  <DownloadButton className="w-full sm:w-auto px-8" />
                  <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                    Learn More
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span className="text-sm text-slate-500 font-medium">Trusted by thousands of users worldwide</span>
                </div>
              </motion.div>

              {/* Right Side */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative flex flex-col items-center lg:items-end justify-end min-w-0">
                <div className="relative w-full max-w-[820px]">
                  <img
                    src={readerHeroApp}
                    alt="Luxor PDF Reader application window showing the About page"
                    className="w-full h-auto drop-shadow-2xl"
                    loading="eager"
                  />
                </div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* BENEFITS STRIP */}
        <section className="bg-white -mt-12 relative z-10">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-8 lg:p-10">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 lg:divide-x divide-slate-100">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-5 lg:pl-8 first:lg:pl-0">
                    {"image" in benefit && benefit.image ? (
                      <img src={benefit.image} alt="" className="w-11 h-11 object-contain shrink-0" />
                    ) : (
                      <benefit.icon
                        className="w-11 h-11 text-[#E50914] shrink-0"
                        strokeWidth={2.25}
                        {...(benefit.filled ? { fill: "#E50914" } : {})}
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{benefit.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{benefit.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (5x2 grid) */}
        <section id="features" className="py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Everything You Need in a PDF Reader</h2>
              <p className="text-lg text-slate-500">Powerful features. Beautifully simple.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              {features.map((feat, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:bg-white hover:shadow-lg transition-all duration-300 group min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm text-[#E50914] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTIVITY SHOWCASE */}
        <section id="tools" className="py-24 lg:py-32 bg-[#FFF5F5]">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="order-2 lg:order-1 flex justify-center lg:justify-start relative min-w-0">
                <img src={readerProductivity} alt="Luxor PDF Reader productivity tools" className="w-full max-w-[820px] h-auto" />
              </div>
              <div className="order-1 lg:order-2 text-left">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white text-[#E50914] text-xs font-bold tracking-widest uppercase mb-6 shadow-sm border border-red-100">
                  BUILT FOR PRODUCTIVITY
                </div>
                <h2 className="text-3xl lg:text-[40px] font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">Tools that help you work smarter</h2>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg">
                  Luxor PDF Reader gives you all the essential tools to read, review, and manage your PDFs efficiently without the clutter.
                </p>
                <ul className="space-y-5">
                  {[
                    "Annotate and highlight important content",
                    "Add bookmarks and organize your documents",
                    "Search and navigate with ease",
                    "Work comfortably with dark mode",
                    "Print and share with advanced options"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-800 font-semibold text-lg">
                      <CheckCircle2 className="w-6 h-6 text-[#E50914] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMPATIBILITY SECTION */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Works Where You Work</h2>
              <p className="text-lg text-slate-500">Available now on Windows. More platforms are coming soon.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Windows */}
              <div className="rounded-2xl border-2 border-[#E50914] bg-[#FFF5F5] p-6 lg:p-7 relative overflow-hidden flex items-center gap-4 text-left shadow-lg min-w-0">
                <WindowsLogo className="w-11 h-11 text-[#E50914] shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-[#E50914]">Windows</h3>
                    <span className="bg-[#E50914] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">AVAILABLE NOW</span>
                  </div>
                  <p className="text-sm text-[#E50914]/80 font-medium">Windows 10/11 (64-bit)</p>
                </div>
              </div>

              {/* Mac */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-7 relative flex items-center gap-4 text-left opacity-70 hover:opacity-100 transition-opacity min-w-0">
                <AppleLogo className="w-11 h-11 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-slate-800">Mac</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">COMING SOON</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">macOS</p>
                </div>
              </div>

              {/* Android */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-7 relative flex items-center gap-4 text-left opacity-70 hover:opacity-100 transition-opacity min-w-0">
                <AndroidLogo className="w-11 h-11 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-slate-800">Android</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">COMING SOON</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Android Phones and Tablets</p>
                </div>
              </div>

              {/* iOS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-7 relative flex items-center gap-4 text-left opacity-70 hover:opacity-100 transition-opacity min-w-0">
                <AppleLogo className="w-11 h-11 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-lg font-bold text-slate-800">iOS</h3>
                    <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider">COMING SOON</span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">iPhone and iPad</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON SECTION */}
        <section className="py-24 lg:py-32 bg-[#F8FAFC]">
          <div className="container mx-auto px-6 max-w-[88rem]">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-16 text-center tracking-tight">Why Choose Luxor PDF Reader?</h2>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1: Luxor */}
              <div className="rounded-3xl bg-[#FFF5F5] p-8 lg:p-10 shadow-xl relative z-10 flex flex-col">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 mt-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                    <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Luxor PDF Reader</h3>
                </div>
                <ul className="space-y-6 flex-1">
                  {[
                    "Fast and lightweight",
                    "Clean and easy to use",
                    "Secure and private",
                    "Regular updates",
                    "Free to get started"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-900 font-semibold text-[15px]">
                      <div className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 2: Others */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:p-10 shadow-sm flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Monitor className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Other PDF Readers</h3>
                </div>
                <ul className="space-y-6 flex-1">
                  {[
                    "Slow with large files",
                    "Bloated and complex",
                    "Data collection risks",
                    "Infrequent updates",
                    "Hidden costs"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-500 font-medium text-[15px]">
                      <XCircle className="w-6 h-6 text-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Online */}
              <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:p-10 shadow-sm flex flex-col min-w-0">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Online PDF Viewers</h3>
                </div>
                <ul className="space-y-6 flex-1">
                  {[
                    "Requires internet",
                    "File upload risks",
                    "Limited features",
                    "Slow performance",
                    "Privacy concerns"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-500 font-medium text-[15px]">
                      <XCircle className="w-6 h-6 text-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="support" className="py-24 lg:py-32 bg-white">
          <div className="container mx-auto px-6 max-w-[1000px]">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
            </div>
            <Accordion faqs={faqs} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 lg:py-32 bg-gradient-to-br from-[#E50914] to-[#990000] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="container mx-auto px-6 max-w-[88rem] relative z-10">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-10 h-10" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to read PDFs smarter?</h2>
              <p className="text-xl text-red-100 mb-10 leading-relaxed font-medium">
                Join thousands of users who trust Luxor PDF Reader for their daily document needs.
              </p>
              <div className="flex flex-col items-center gap-4 w-full">
                <DownloadButton variant="white" className="px-10 py-4 text-lg shadow-xl" />
                <p className="text-red-200 text-sm mt-2">Requires Windows 10 or 11 (64-bit)</p>
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