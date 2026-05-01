import { useState, useEffect, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Github,
  Chrome,
  Sparkles,
} from "lucide-react";
import { checkDevPassword, setDevAuthed, isDevAuthed } from "@/lib/devAuth";

export default function DeveloperLoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("dev@luxorpdf.com");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authed, jump straight to dashboard.
  useEffect(() => {
    if (isDevAuthed()) setLocation("/developer/dashboard");
  }, [setLocation]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and developer password.");
      return;
    }

    setLoading(true);
    // Tiny artificial delay for UX feel
    setTimeout(() => {
      if (checkDevPassword(password)) {
        setDevAuthed(true);
        setLocation("/developer/dashboard");
      } else {
        setError("Incorrect developer password. Please try again.");
        setLoading(false);
      }
    }, 450);
  }

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* ── Left: Form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-blue-50/60 via-white to-rose-50/40 relative overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 bg-[#312E81]/8 rounded-full blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 bg-[#DC2626]/8 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Brand row */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-[15%] bg-white border border-[#DC2626]/40 shadow-sm flex items-center justify-center group-hover:border-[#DC2626]/70 group-hover:shadow-md transition-all">
              <span className="text-[#DC2626] font-extrabold text-base tracking-tight">L</span>
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-slate-900">Luxor PDF</div>
              <div className="text-[10px] tracking-[0.14em] uppercase text-slate-500 font-semibold">Developer Portal</div>
            </div>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h1>
          <p className="text-slate-600 mb-8">
            Sign in to access your API keys, usage analytics, and webhooks.
          </p>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              <Chrome className="w-4 h-4 text-[#2563EB]" /> Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              <Github className="w-4 h-4 text-slate-900" /> GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">or continue with</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81]/30 focus:border-[#312E81] transition"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Developer password
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                  onClick={() => alert("Contact your workspace admin to reset the developer password.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your developer password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81]/30 focus:border-[#312E81] transition"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                Use the developer password configured in <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700">src/lib/devAuth.ts</code>
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#312E81] focus:ring-[#312E81]/30"
                />
                Keep me signed in
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#312E81] hover:bg-[#3730A3] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            New to Luxor PDF?{" "}
            <Link href="/pricing" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
              Create a developer account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ── Right: Brand panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[#312E81] relative overflow-hidden">
        {/* Grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div aria-hidden="true" className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#DC2626]/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#2563EB]/20 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md px-12 text-white"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Luxor PDF API · v2
          </div>

          <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            Build secure document workflows in minutes.
          </h2>
          <p className="text-white/70 text-lg mb-10">
            One API for PDF reading, eSignatures, and self-destructing documents — with enterprise-grade encryption built in.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-3.5">
            {[
              { icon: ShieldCheck, label: "AES-256 encryption end-to-end", color: "text-emerald-300" },
              { icon: KeyRound, label: "Scoped API keys with rotation", color: "text-amber-300" },
              { icon: Lock, label: "Compliance: SOC 2 · GDPR · HIPAA", color: "text-rose-300" },
            ].map(({ icon: Icon, label, color }) => (
              <li key={label} className="flex items-center gap-3 text-white/85">
                <span className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </span>
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>

          {/* Sample code card */}
          <div className="mt-10 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-hidden shadow-xl">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <span className="ml-3 text-[11px] font-mono text-white/50">curl</span>
            </div>
            <pre className="px-4 py-3 text-[12px] leading-relaxed font-mono text-white/85 overflow-x-auto">
{`curl https://api.luxorpdf.com/v2/documents \\
  -H "Authorization: Bearer sk_live_•••" \\
  -F "file=@contract.pdf" \\
  -F "expires_in=7d"`}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
