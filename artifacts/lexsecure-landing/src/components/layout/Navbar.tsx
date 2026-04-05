import { Link } from "wouter";
import { Shield, ChevronDown, BookOpen, PenTool, FileSignature, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginModal } from "@/components/LoginModal";

const navLinks = [
  { label: "Home",     href: "BASE_URL", gradient: "from-rose-500 to-orange-400" },
  { label: "About Us", href: "#about",   gradient: "from-violet-500 to-purple-400" },
];

const productItems = [
  {
    label: "Luxor PDF Reader",
    href: "/products/pdf-reader",
    icon: BookOpen,
    desc: "Fast, lightweight PDF viewer",
    gradient: "from-sky-500 to-blue-500",
    bg: "bg-sky-50",
    iconColor: "#0284c7",
    strokeWidth: 1.5,
  },
  {
    label: "Luxor PDF Editor",
    href: "/products/pdf-editor",
    icon: PenTool,
    desc: "Edit text, images & pages",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
    iconColor: "#7c3aed",
    strokeWidth: 2,
  },
  {
    label: "Luxor eSign",
    href: "/products/esign",
    icon: FileSignature,
    desc: "Legally binding e-signatures",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    iconColor: "#059669",
    strokeWidth: 1.75,
  },
  {
    label: "Luxor PDF Security",
    href: "/products/pdf-security",
    icon: Lock,
    desc: "Encrypt, redact & set expiry",
    gradient: "from-rose-500 to-orange-500",
    bg: "bg-rose-50",
    iconColor: "#e11d48",
    strokeWidth: 2.5,
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

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#FA0F00] p-2 rounded-md">
            <Shield className="w-[23px] h-[23px] text-white" strokeWidth={2.5} />
          </div>
          <span className="font-serif font-bold text-[1.71rem] text-primary tracking-tight">Luxor PDF</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href, gradient }) => (
            <a
              key={label}
              href={href === "BASE_URL" ? import.meta.env.BASE_URL : href}
              className="group relative text-[1.05rem] font-medium transition-colors duration-300"
            >
              <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-blue-700 font-bold group-hover:text-transparent transition-colors duration-300`}>
                {label}
              </span>
              <span className={`absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 group-hover:w-full`} />
            </a>
          ))}

          {/* Products dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              onClick={() => setProductsOpen(o => !o)}
              className="group flex items-center gap-1 text-[1.05rem] font-bold text-blue-700 transition-colors duration-300 hover:text-transparent bg-clip-text hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-400 relative"
            >
              <span className="bg-gradient-to-r from-sky-500 to-blue-400 bg-clip-text text-blue-700 font-bold group-hover:text-transparent transition-colors duration-300">
                Products
              </span>
              <ChevronDown
                className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}
              />
              <span className={`absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all duration-300 group-hover:w-full`} />
            </button>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  {/* Arrow */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-slate-100 rotate-45" />

                  <div className="p-2">
                    {productItems.map(({ label, href, icon: Icon, desc, gradient, bg, iconColor, strokeWidth }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setProductsOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors duration-150 group/item"
                      >
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon
                            size={20}
                            color={iconColor}
                            strokeWidth={strokeWidth}
                          />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{label}</p>
                          <p className="text-xs text-slate-400 leading-tight">{desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                    <a href="#products" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">View all products →</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Features link */}
          <a
            href="#features"
            className="group relative text-[1.05rem] font-medium transition-colors duration-300"
          >
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-blue-700 font-bold group-hover:text-transparent transition-colors duration-300">
              Features
            </span>
            <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 group-hover:w-full" />
          </a>

          {/* Pricing link */}
          <Link
            href="/pricing"
            className="group relative text-[1.05rem] font-medium transition-colors duration-300"
          >
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-blue-700 font-bold group-hover:text-transparent transition-colors duration-300">
              Pricing
            </span>
            <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* Buy Now + Login */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="text-[1.05rem] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-white border-0 shadow-md transition-all duration-300 hidden sm:inline-flex"
          >
            <a href="#buy">Buy Now</a>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLoginOpen(true)}
            className="text-[1.05rem] font-bold text-blue-700 hidden sm:inline-flex hover:bg-blue-50 hover:text-blue-800 transition-colors duration-300 border border-blue-200"
          >
            Login
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
