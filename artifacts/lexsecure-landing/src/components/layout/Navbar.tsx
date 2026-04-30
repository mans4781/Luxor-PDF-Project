import { Link } from "wouter";
import { ChevronDown, BookOpen, FileSignature, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginModal } from "@/components/LoginModal";

const productItems = [
  {
    label: "Luxor PDF Reader",
    href: "/products/pdf-reader",
    icon: BookOpen,
    desc: "Flagship PDF reader",
    badge: "Flagship",
    iconBg: "bg-[#312E81]/8 border-[#312E81]/15 group-hover:bg-[#312E81]/15",
    iconColor: "text-[#312E81]",
    badgeBg: "bg-[#312E81]/10 text-[#312E81]",
  },
  {
    label: "LuxorSign",
    href: "/products/esign",
    icon: FileSignature,
    desc: "Legally-binding eSignatures",
    badge: "Add-on",
    iconBg: "bg-[#2563EB]/8 border-[#2563EB]/15 group-hover:bg-[#2563EB]/15",
    iconColor: "text-[#2563EB]",
    badgeBg: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  {
    label: "PDF Expiry",
    href: "/products/pdf-security",
    icon: Lock,
    desc: "Self-destructing documents",
    badge: "Add-on",
    iconBg: "bg-[#FB7185]/10 border-[#FB7185]/20 group-hover:bg-[#FB7185]/20",
    iconColor: "text-[#E11D48]",
    badgeBg: "bg-[#FB7185]/15 text-[#9F1239]",
  },
];

export function Navbar() {
  const [scrolled, setScrolled]         = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [loginOpen, setLoginOpen]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkCls = "relative text-[15px] font-medium text-slate-700 hover:text-[#312E81] transition-colors after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#312E81] after:via-[#2563EB] after:to-[#FB7185] after:rounded-full after:transition-all after:duration-300 hover:after:w-full";

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
        <Link href={import.meta.env.BASE_URL} className="flex items-center">
          <img
            src={`${import.meta.env.BASE_URL}brand/luxor-logo.png?v=1777537273`}
            alt="Luxor PDF"
            className="h-10 w-auto select-none"
            draggable={false}
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href={import.meta.env.BASE_URL} className={linkCls}>Home</a>

          {/* Products dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              onClick={() => setProductsOpen(o => !o)}
              className={`${linkCls} flex items-center gap-1`}
            >
              Products
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} />
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
                    {productItems.map(({ label, href, icon: Icon, desc, badge, iconBg, iconColor, badgeBg }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setProductsOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors duration-150"
                      >
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-[-4deg] ${iconBg}`}>
                          <Icon size={18} className={iconColor} strokeWidth={2.2} />
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

          <Link href="/features" className={linkCls}>Features</Link>
          <Link href="/pricing" className={linkCls}>Pricing</Link>
          <Link href="/about" className={linkCls}>About</Link>
          <Link href="/contact" className={linkCls}>Contact</Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLoginOpen(true)}
            className="text-[15px] font-medium text-slate-700 hover:text-[#312E81] hover:bg-slate-100 hidden sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            asChild
            className="text-[15px] font-semibold bg-[#312E81] hover:bg-[#3730A3] text-white shadow-md shadow-[#312E81]/20 hover:shadow-lg hover:shadow-[#312E81]/30 hover:-translate-y-0.5 rounded-lg hidden sm:inline-flex transition-all duration-200"
          >
            <Link href="/pricing">Start free →</Link>
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
