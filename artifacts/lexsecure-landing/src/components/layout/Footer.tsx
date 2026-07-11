import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useVisitorCount } from "@/hooks/useVisitorCount";

type LinkItem = { label: string; href: string };

const PRODUCT_LINKS: LinkItem[] = [
  { label: "PDF Reader", href: "/products/pdf-reader" },
  { label: "PDF Security", href: "/products/pdf-security" },
  { label: "PDF eSign", href: "/products/esign" },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

const POLICY_LINKS: LinkItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Licensing", href: "/licensing" },
  { label: "Refund Policy", href: "/refund" },
];

type SocialLink = {
  label: string;
  href: string;
  color: string;
  path: ReactNode;
};

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Luxor PDF on LinkedIn",
    href: "#",
    color: "#0A66C2",
    path: (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    ),
  },
  {
    label: "Luxor PDF on X",
    href: "#",
    color: "#000000",
    path: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  {
    label: "Luxor PDF on Facebook",
    href: "#",
    color: "#1877F2",
    path: (
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    ),
  },
  {
    label: "Luxor PDF on YouTube",
    href: "#",
    color: "#FF0000",
    path: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
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
    <footer className="relative overflow-hidden bg-slate-50 px-6 pt-20 text-slate-700 lg:px-8 border-t border-slate-200">
      {/* Decorative glow blobs */}
      <div
        aria-hidden="true"
        className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Top grid */}
        <div className="grid gap-10 border-b border-slate-200 pb-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr_1.1fr]">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 text-left group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
              aria-label="Luxor PDF — home"
            >
              <span className="flex h-[53px] w-[53px] items-center justify-center rounded-xl bg-red-50 shadow-sm ring-1 ring-red-300 transition-transform duration-300 group-hover:scale-105">
                <img
                  src={`${import.meta.env.BASE_URL}brand/luxor-icon.png?v=20260627`}
                  alt=""
                  className="h-[39px] w-[39px] select-none"
                  draggable={false}
                />
              </span>
              <div>
                <div className="text-[26px] font-black tracking-tight">
                  <span className="text-[#1e3a8a]">Luxor</span>{" "}
                  <span className="text-[#DC2626]">PDF</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                  Secure PDF Suite
                </div>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-600">
              A modern PDF platform for reading, converting, merging, splitting,
              extracting, and protecting business documents.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href, color, path }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{ color }}
                  className="flex h-10 w-10 items-center justify-center rounded-[3.3px] border border-blue-300 bg-blue-50 transition-all duration-200 hover:scale-110 hover:shadow-md hover:border-blue-400 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#312E81] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-[22px] w-[22px]"
                  >
                    {path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Products column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#312E81]">
              Products
            </h3>
            <ul className="mt-5 space-y-3">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm font-semibold text-[#312E81] transition-colors hover:text-[#1E1B4B] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#312E81]">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm font-semibold text-[#312E81] transition-colors hover:text-[#1E1B4B] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Policies column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#312E81]">
              Company Policies
            </h3>
            <ul className="mt-5 space-y-3">
              {POLICY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="block text-left text-sm font-semibold text-[#312E81] transition-colors hover:text-[#1E1B4B] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter column */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#312E81]">
              Stay updated
            </h3>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Get product updates, PDF security tips, and launch announcements.
            </p>
            <form
              onSubmit={onSubscribe}
              className="mt-5 flex rounded-2xl bg-white p-1 shadow-md ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[#E11D48] focus-within:ring-offset-2 focus-within:ring-offset-slate-50"
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
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                className="group flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Join
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>
            <p
              role="status"
              aria-live="polite"
              className={`mt-2 text-xs text-emerald-600 transition-opacity duration-300 ${
                submitted ? "opacity-100" : "opacity-0"
              }`}
            >
              Thanks — we'll be in touch.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 py-7 text-sm text-slate-600 md:flex-row md:items-center md:justify-center">
          <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:gap-5">
            <span>
              Copyright © {new Date().getFullYear()} Luxor PDF. All rights reserved.
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
            <span className="tabular-nums text-slate-500">
              {visitorCount === null
                ? "· · ·"
                : `${visitorCount.toLocaleString()} visitors`}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
