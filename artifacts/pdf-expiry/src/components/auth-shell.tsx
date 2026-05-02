import { ReactNode } from "react";
import { Link } from "wouter";
import {
  ShieldCheck,
  Lock,
  Globe2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

const baseUrl = import.meta.env.BASE_URL;
const basePath = baseUrl.replace(/\/$/, "");

type AuthShellProps = {
  children: ReactNode;
  variant: "sign-in" | "sign-up";
};

const FEATURES = [
  {
    icon: Lock,
    title: "Local-first by design",
    body: "Edit, convert and secure PDFs entirely in your browser — files never leave your device.",
  },
  {
    icon: ShieldCheck,
    title: "Expiry & revoke controls",
    body: "Share PDFs with built-in deadlines, password protection and an instant revoke switch.",
  },
  {
    icon: Globe2,
    title: "Works everywhere",
    body: "Any modern browser, any device. No installs, no plugins, no waiting.",
  },
];

export function AuthShell({ children, variant }: AuthShellProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50">
      {/* ── Left: brand showcase ─────────────────────────────────────────── */}
      <aside
        className="relative overflow-hidden lg:w-[44%] xl:w-[42%] text-white px-8 sm:px-12 py-10 lg:py-14 flex flex-col"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, #312E81 0%, #1e3a8a 40%, #0f172a 100%)",
        }}
      >
        {/* Decorative background glow */}
        <div
          className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #DC2626 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 w-[360px] h-[360px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
          }}
        />

        {/* Top: logo + back link */}
        <div className="relative flex items-center justify-between">
          <Link
            href={basePath || "/"}
            className="group flex items-center gap-3"
            aria-label="Luxor PDF Secure home"
          >
            <img
              src={`${baseUrl}brand/luxor-icon.png`}
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              draggable={false}
              className="h-14 w-14 rounded-2xl border border-white/30 bg-white shadow-lg transition-transform group-hover:scale-105 select-none"
            />
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-extrabold tracking-tight">
                <span className="text-white">Luxor</span>{" "}
                <span className="text-[#FCA5A5]">PDF</span>{" "}
                <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Secure
                </span>
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Private PDF Suite
              </span>
            </div>
          </Link>

          <Link
            href={basePath || "/"}
            className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-medium text-indigo-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to app
          </Link>
        </div>

        {/* Middle: pitch */}
        <div className="relative mt-10 lg:mt-16 max-w-md">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            {variant === "sign-in"
              ? "Welcome back"
              : "Create your free account"}
          </div>
          <h1 className="text-[30px] sm:text-[34px] leading-[1.1] font-extrabold tracking-tight">
            {variant === "sign-in" ? (
              <>
                Pick up right where{" "}
                <span className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
                  you left off.
                </span>
              </>
            ) : (
              <>
                The private way to{" "}
                <span className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
                  share PDFs.
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 text-[15px] text-indigo-100/90 leading-relaxed">
            {variant === "sign-in"
              ? "Sign in to access your secured PDFs, expiry settings and revoke controls."
              : "Get free access to in-browser PDF editing, expiry-controlled sharing and one-click revoke."}
          </p>
        </div>

        {/* Bottom: feature list */}
        <ul className="relative mt-10 lg:mt-12 space-y-4 max-w-md hidden sm:block">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3 items-start">
              <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-amber-200" strokeWidth={2} />
              </span>
              <div>
                <p className="font-semibold text-white text-[14px] leading-tight">
                  {title}
                </p>
                <p className="text-[13px] text-indigo-200/80 mt-0.5 leading-snug">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer note */}
        <p className="relative mt-auto pt-10 text-[11px] text-indigo-300/70">
          © {new Date().getFullYear()} Luxor PDF Secure · Part of the Luxor
          Suite
        </p>
      </aside>

      {/* ── Right: Clerk form ───────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 lg:py-14">
        <div className="w-full max-w-md">
          {/* Brand row above the Clerk card */}
          <Link
            href={basePath || "/"}
            className="group flex items-center justify-center gap-3 mb-6"
            aria-label="Luxor PDF Suite home"
          >
            <img
              src={`${baseUrl}brand/luxor-icon.png`}
              alt=""
              aria-hidden="true"
              width={48}
              height={48}
              draggable={false}
              className="h-12 w-12 rounded-2xl border border-[#DC2626]/40 bg-white shadow-sm transition-transform group-hover:scale-105 select-none"
            />
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-extrabold tracking-tight">
                <span className="text-[#1e3a8a]">Luxor</span>{" "}
                <span className="text-[#DC2626]">PDF</span>
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Secure PDF Suite
              </span>
            </div>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
