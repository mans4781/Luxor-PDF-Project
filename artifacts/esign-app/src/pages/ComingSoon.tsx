import { PenLine, Clock } from "lucide-react";
import { AuthMenu } from "@workspace/luxor-auth-ui";

export default function ComingSoon() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B1020] text-white overflow-hidden px-6">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[55%] h-[55%] rounded-full bg-indigo-600/30 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      {/* Auth menu top-right */}
      <div className="absolute top-5 right-6 z-10">
        <AuthMenu variant="dark" />
      </div>

      <div className="relative z-10 text-center max-w-xl">
        {/* Brand */}
        <div className="inline-flex items-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <PenLine className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-semibold tracking-tight">LuxorSign</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs font-medium mb-6">
          <Clock className="w-3.5 h-3.5" />
          Launching soon
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.02em] mb-5">
          Coming soon.
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed mb-10">
          The Luxor eSign app is almost ready. We're putting the finishing touches on a
          fast, secure way to sign and manage your documents. Check back shortly.
        </p>

        <a
          href="/lexsecure-landing/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/30"
        >
          Explore Luxor PDF
        </a>
      </div>

      <p className="relative z-10 mt-16 text-xs text-slate-500">
        © {new Date().getFullYear()} Luxor PDF Suite. All rights reserved.
      </p>
    </div>
  );
}
