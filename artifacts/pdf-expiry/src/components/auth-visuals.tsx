import { Headphones, Lock, PenLine, PenSquare, RefreshCw, ShieldCheck, Users } from "lucide-react";

const baseUrl = import.meta.env.BASE_URL;

/* ─── Small brand SVGs for the social buttons ────────────────────────── */

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v2.98h3.87c2.26-2.09 3.55-5.17 3.55-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.93l-3.87-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.07A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.19 7.19 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.64H1.29a11.97 11.97 0 0 0 0 10.72l3.98-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.64l3.98 3.07C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <path
        fill="#111111"
        d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.53-1.41 3.48-2.8 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.02-1.16-3.03-4.59zM14.16 4.06c.8-.97 1.33-2.31 1.19-3.65-1.15.05-2.53.76-3.36 1.73-.73.85-1.38 2.22-1.2 3.53 1.27.1 2.58-.65 3.37-1.61z"
      />
    </svg>
  );
}

/* ─── Left panel illustration (original Luxor art) ───────────────────── */

export function DocIllustration() {
  return (
    <div className="relative w-[240px] h-[210px] mx-auto" aria-hidden="true">
      {/* soft blob */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(252,165,165,0.55) 0%, rgba(254,226,226,0.35) 55%, transparent 75%)",
        }}
      />
      {/* document card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[140px] bg-white rounded-xl shadow-xl shadow-rose-200/50 border border-slate-100 p-3">
        <div className="inline-flex items-center rounded-md bg-[#DC2626] px-2 py-1 text-[10px] font-extrabold text-white tracking-wide">
          PDF
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-[5px] rounded-full bg-rose-200/80 w-full" />
          <div className="h-[5px] rounded-full bg-slate-200 w-5/6" />
          <div className="h-[5px] rounded-full bg-slate-200 w-full" />
          <div className="h-[5px] rounded-full bg-rose-200/80 w-4/6" />
          <div className="h-[5px] rounded-full bg-slate-200 w-5/6" />
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute left-1 top-4 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <PenSquare className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute right-2 top-6 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <ShieldCheck className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute left-2 bottom-4 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <PenLine className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute right-4 bottom-2 w-10 h-10 rounded-xl bg-[#DC2626] shadow-lg shadow-rose-300/50 flex items-center justify-center">
        <Lock className="w-[18px] h-[18px] text-white" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ─── Decorative dot grid ────────────────────────────────────────────── */

export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute w-28 h-28 opacity-40 ${className ?? ""}`}
      style={{
        backgroundImage: "radial-gradient(#fca5a5 1.5px, transparent 1.5px)",
        backgroundSize: "14px 14px",
      }}
    />
  );
}

/* ─── Brand logo lockup ──────────────────────────────────────────────── */

export function LuxorLogoLockup() {
  return (
    <a
      href="/"
      className="inline-flex items-center gap-3"
      aria-label="Luxor PDF — home"
      data-testid="link-logo-home"
    >
      <span className="flex h-[53px] w-[53px] items-center justify-center rounded-xl bg-red-50 shadow-sm ring-1 ring-red-300">
        <img
          src={`${baseUrl}brand/luxor-icon.png?v=20260712`}
          alt=""
          className="h-[39px] w-[39px] select-none"
          draggable={false}
        />
      </span>
      <span>
        <span className="block text-[26px] font-black tracking-tight leading-none">
          <span className="text-[#1e3a8a]">Luxor</span>{" "}
          <span className="text-[#DC2626]">PDF</span>
        </span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
          Secure PDF Suite
        </span>
      </span>
    </a>
  );
}

/* ─── Footer: trust bar + copyright ──────────────────────────────────── */

export function AuthFooter({ trustFirst }: { trustFirst?: { top: string; bottom: string } }) {
  const items = [
    { icon: Users, top: trustFirst?.top ?? "Trusted by", bottom: trustFirst?.bottom ?? "Millions of Users" },
    { icon: ShieldCheck, top: "Secure &", bottom: "Reliable" },
    { icon: RefreshCw, top: "Regular", bottom: "Updates" },
    { icon: Headphones, top: "24/7", bottom: "Support" },
  ];
  return (
    <>
      <div className="w-full mt-6 border-t border-slate-200 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {items.map(({ icon: Icon, top, bottom }, i) => (
            <div
              key={top + bottom}
              className={`flex items-center justify-center gap-3 py-2 ${
                i > 0 ? "sm:border-l sm:border-slate-300/70" : ""
              }`}
            >
              <Icon className="h-6 w-6 text-slate-600" strokeWidth={1.8} />
              <div className="text-[12px] leading-tight text-slate-600 font-medium">
                {top}
                <br />
                {bottom}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-8 pb-4 text-center text-[12px] text-slate-500">
        Copyright © {new Date().getFullYear()}.{" "}
        <span className="font-semibold text-[#DC2626]">Luxor PDF.</span>{" "}
        All rights reserved
      </p>
    </>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15";

export const authButtonClass =
  "relative mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60";

export const socialButtonClass =
  "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60";
