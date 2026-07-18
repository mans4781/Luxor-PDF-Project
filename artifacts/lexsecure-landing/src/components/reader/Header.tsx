import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Tools", href: "#tools" },
    { label: "Security", href: "#security" },
    { label: "Pricing", href: "#pricing" },
    { label: "Support", href: "#support" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white h-[72px] flex items-center border-b border-slate-200",
        scrolled ? "shadow-sm" : ""
      )}
    >
      <div className="container mx-auto px-6 w-full flex items-center justify-between">
        {/* Left: Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <img
            src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`}
            alt="Luxor PDF Reader"
            className="h-8 w-auto transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            Luxor PDF Reader
          </span>
        </a>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[15px] font-medium text-slate-600 hover:text-[#E50914] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Download */}
        <div className="hidden md:flex items-center">
          <DownloadButton className="py-2.5 px-4" />
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[72px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg p-4 md:hidden flex flex-col gap-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:text-[#E50914]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="px-4 pb-4">
            <DownloadButton className="w-full justify-center" />
          </div>
        </div>
      )}
    </header>
  );
}
