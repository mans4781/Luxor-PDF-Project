import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Linkedin, Twitter, Facebook, Mail, ArrowRight } from "lucide-react";
import { useVisitorCount } from "@/hooks/useVisitorCount";

type LinkItem = { label: string; href: string };

const PRODUCT_LINKS: LinkItem[] = [
  { label: "PDF Reader", href: "/products/pdf-reader" },
  { label: "PDF Security", href: "/products/pdf-security" },
  { label: "PDF Editor", href: "/products/pdf-editor" },
  { label: "eSign", href: "/products/esign" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

const RESOURCE_LINKS: LinkItem[] = [
  { label: "Help Center", href: "/contact" },
  { label: "Documentation", href: "/features" },
  { label: "Security Guide", href: "/#security" },
  { label: "Release Notes", href: "/about" },
];

const LEGAL_LINKS: LinkItem[] = [
  { label: "Privacy Policy", href: "/about" },
  { label: "Terms of Service", href: "/about" },
  { label: "Cookie Policy", href: "/about" },
  { label: "Licensing", href: "/about" },
];

const SOCIAL_LINKS = [
  { label: "Luxor PDF on LinkedIn", icon: Linkedin, href: "#" },
  { label: "Luxor PDF on Twitter", icon: Twitter, href: "#" },
  { label: "Luxor PDF on Facebook", icon: Facebook, href: "#" },
];

export function Footer() {
  const visitorCount = useVisitorCount();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
    setTimeout(() => setSubmitted(false), 3500);
  }

  return (
    <footer className="relative overflow-hidden bg-[#1e1b4b] px-6 pt-20 text-white lg:px-8">
      {/* Decorative glow blobs */}
      <div
        aria-hidden="true"
        className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#312E81]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#FB7185]/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#2563EB]/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Top grid */}
        <div className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1.1fr]">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 text-left group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
              aria-label="Luxor PDF — home"
            >
              <span className="flex h-[53px] w-[53px] items-center justify-center rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105">
                <img
                  src={`${import.meta.env.BASE_URL}brand/luxor-icon.png`}
                  alt=""
                  className="h-[34px] w-[34px] select-none"
                  draggable={false}
                />
              </span>
              <div>
                <div className="text-xl font-black tracking-tight">
                  Luxor PDF
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-200">
                  Secure PDF Suite
                </div>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-blue-100/90">
              A modern PDF platform for reading, converting, merging, splitting,
              extracting, and protecting business documents.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all duration-200 hover:border-[#FB7185]/60 hover:bg-[#FB7185] hover:text-white hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </a>
              ))}
            </div>
          </div>

          {/* Products column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#FB7185]">
              Products
            </h3>
            <ul className="mt-5 space-y-3">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm text-blue-100/90 transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#FB7185]">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm text-blue-100/90 transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#FB7185]">
              Resources
            </h3>
            <ul className="mt-5 space-y-3">
              {RESOURCE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm text-blue-100/90 transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#FB7185]">
              Stay updated
            </h3>
            <p className="mt-5 text-sm leading-7 text-blue-100/90">
              Get product updates, PDF security tips, and launch announcements.
            </p>
            <form
              onSubmit={onSubscribe}
              className="mt-5 flex rounded-2xl bg-white p-1 shadow-xl shadow-indigo-950/30 focus-within:ring-2 focus-within:ring-[#FB7185] focus-within:ring-offset-2 focus-within:ring-offset-[#1e1b4b]"
            >
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <button
                type="submit"
                className="group flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Join
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 text-xs text-emerald-300 transition-opacity duration-300 ${
                submitted ? "opacity-100" : "opacity-0"
              }`}
            >
              Thanks — we'll be in touch.
            </p>
            <div className="mt-6 space-y-2 text-sm text-blue-100/90">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#FB7185]" strokeWidth={2.4} />
                <a
                  href="mailto:hello@luxorpdf.com"
                  className="transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                >
                  hello@luxorpdf.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#FB7185]" strokeWidth={2.4} />
                <a
                  href="mailto:support@luxorpdf.com"
                  className="transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
                >
                  support@luxorpdf.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 py-7 text-sm text-blue-100/80 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <span>
              © {new Date().getFullYear()} Luxor PDF. All rights reserved.
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-blue-300/40 sm:inline-block" />
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-blue-300/40 sm:inline-block" />
            <span className="tabular-nums text-blue-200/70">
              {visitorCount === null
                ? "· · ·"
                : `${visitorCount.toLocaleString()} visitors`}
            </span>
          </div>
          <nav
            aria-label="Legal"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="transition-colors hover:text-white rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1b4b]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
