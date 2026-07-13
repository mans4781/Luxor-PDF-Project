import { Headphones, Lock, PenLine, PenSquare, RefreshCw, ShieldCheck, Users } from "lucide-react";

const baseUrl = import.meta.env.BASE_URL;

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
      <img
        src={`${baseUrl}brand/luxor-icon-nav.webp`}
        alt=""
        className="h-[53px] w-auto select-none"
        draggable={false}
      />
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
