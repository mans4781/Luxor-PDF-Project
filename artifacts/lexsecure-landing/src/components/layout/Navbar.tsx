import { Link } from "wouter";
import { ChevronDown, Home, Layers, Sparkles, Tag, Info, Wrench, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { goToSignIn, goToSignUp } from "@/lib/authUrls";
import { ONLINE_TOOL_COLUMNS } from "@/lib/online-tools-catalog";

const productItems = [
  {
    label: "Luxor PDF Reader",
    href: "/products/pdf-reader",
    iconSrc: "brand/product-reader.png",
    desc: "Flagship PDF reader",
    badge: "Flagship",
    iconBg: "bg-[#DC2626]/5 border-[#DC2626]/15 group-hover:bg-[#DC2626]/10",
    badgeBg: "bg-[#312E81]/10 text-[#312E81]",
  },
  {
    label: "Luxor PDF Secure",
    href: "/products/pdf-security",
    iconSrc: "brand/product-secure.png",
    desc: "Self-destructing documents",
    badge: "Add-on",
    iconBg: "bg-[#2563EB]/5 border-[#2563EB]/15 group-hover:bg-[#2563EB]/10",
    badgeBg: "bg-[#2563EB]/10 text-[#1D4ED8]",
  },
  {
    label: "Luxor PDF eSign",
    href: "/products/esign",
    iconSrc: "brand/product-esign.png",
    desc: "Legally-binding eSignatures",
    badge: "Add-on",
    iconBg: "bg-[#16A34A]/5 border-[#16A34A]/15 group-hover:bg-[#16A34A]/10",
    badgeBg: "bg-[#16A34A]/10 text-[#15803D]",
  },
];

export function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [toolsOpen, setToolsOpen]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkCls = "relative inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#312E81] hover:text-[#1E1B4B] transition-colors after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#312E81] after:via-[#2563EB] after:to-[#FB7185] after:rounded-full after:transition-all after:duration-300 hover:after:w-full";
  const linkIconCls = "w-4 h-4 text-[#312E81]/70 group-hover:text-[#DC2626] transition-colors";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-lg border-b border-slate-200/70" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href={import.meta.env.BASE_URL} className="group flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}brand/luxor-icon.png?v=20260627`}
            alt=""
            aria-hidden="true"
            className="h-[53px] w-[53px] select-none rounded-[15%] border border-[#DC2626]/40 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-[#DC2626]/70 group-hover:shadow-md"
            draggable={false}
          />
          <div className="flex flex-col leading-none">
            <span className="text-[23px] font-extrabold tracking-tight">
              <span className="text-[#1e3a8a]">Luxor</span>{" "}
              <span className="text-[#DC2626]">PDF</span>
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Secure PDF Suite
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          <a href={import.meta.env.BASE_URL} className={`group ${linkCls}`}>
            <Home className={linkIconCls} strokeWidth={2.2} />
            Home
          </a>

          <Link href="/about" className={`group ${linkCls}`}>
            <Info className={linkIconCls} strokeWidth={2.2} />
            About
          </Link>

          {/* Products dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              onClick={() => { setToolsOpen(false); setProductsOpen(o => !o); }}
              className={`group ${linkCls}`}
            >
              <Layers className={linkIconCls} strokeWidth={2.2} />
              Products
              <ChevronDown className={`w-4 h-4 ml-0.5 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden z-50"
                >
                  <div className="p-2">
                    {productItems.map(({ label, href, iconSrc, desc, badge, iconBg, badgeBg }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setProductsOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors duration-150"
                      >
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-[-4deg] ${iconBg}`}>
                          <img
                            src={`${import.meta.env.BASE_URL}${iconSrc}`}
                            alt=""
                            aria-hidden="true"
                            className="w-8 h-8 object-contain select-none"
                            draggable={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#312E81] transition-colors">{label}</p>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>
                              {badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-tight mt-0.5">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-3 py-2.5 bg-gradient-to-r from-[#312E81]/5 via-[#2563EB]/5 to-[#FB7185]/5 border-t border-slate-100">
                    <p className="text-[11px] text-slate-500 text-center">
                      One subscription · <span className="font-semibold text-[#312E81]">All three apps</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Online Tools mega menu */}
          <div
            ref={toolsRef}
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              onClick={() => { setProductsOpen(false); setToolsOpen(o => !o); }}
              className={`group ${linkCls}`}
              data-testid="nav-online-tools"
            >
              <Wrench className={linkIconCls} strokeWidth={2.2} />
              Online Tools
              <ChevronDown className={`w-4 h-4 ml-0.5 transition-transform duration-200 ${toolsOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[860px] max-w-[92vw] bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gradient-to-r from-[#312E81]/5 via-[#2563EB]/5 to-[#FB7185]/5 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-[#1E1B4B]">All online PDF tools</p>
                      <p className="text-[11px] text-slate-500">Runs in your browser — no upload, no account.</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Free for everyone
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-x-4 gap-y-1 p-5">
                    {ONLINE_TOOL_COLUMNS.map((col) => (
                      <div key={col.title} className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#312E81]/70 mb-2 px-2">
                          {col.title}
                        </p>
                        <ul className="space-y-0.5">
                          {col.tools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                              <li key={tool.href}>
                                <a
                                  href={tool.href}
                                  onClick={() => setToolsOpen(false)}
                                  className="group/tool flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#312E81] transition-colors"
                                >
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-black/5 transition-transform duration-150 group-hover/tool:scale-110"
                                    style={{ backgroundColor: `${tool.color}1A`, color: tool.color }}
                                    aria-hidden="true"
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="truncate">{tool.label}</span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-100">
                    <a
                      href="/pdf-expiry/online-tools"
                      onClick={() => setToolsOpen(false)}
                      data-testid="mega-link-all-tools"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1754F4] hover:underline"
                    >
                      <Grid3x3 className="w-4 h-4" />
                      Browse all tools
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/features" className={`group ${linkCls}`}>
            <Sparkles className={linkIconCls} strokeWidth={2.2} />
            Features
          </Link>
          <Link href="/pricing" className={`group ${linkCls}`}>
            <Tag className={linkIconCls} strokeWidth={2.2} />
            Pricing
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={goToSignIn}
            className="text-[15px] font-semibold text-[#312E81] hover:text-[#1E1B4B] hover:bg-slate-100 hidden sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            onClick={goToSignUp}
            className="text-[15px] font-semibold bg-[#312E81] hover:bg-[#3730A3] text-white shadow-md shadow-[#312E81]/20 hover:shadow-lg hover:shadow-[#312E81]/30 hover:-translate-y-0.5 rounded-lg hidden sm:inline-flex transition-all duration-200"
          >
            Start free →
          </Button>
        </div>
      </div>

    </motion.header>
  );
}
