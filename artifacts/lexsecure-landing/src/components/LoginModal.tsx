import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

function ShieldGraphic() {
  return (
    <svg viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Floating rings */}
      <circle cx="160" cy="200" r="150" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="160" cy="200" r="110" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="160" cy="200" r="72" stroke="white" strokeOpacity="0.12" strokeWidth="1" />

      {/* Floating dots */}
      <circle cx="60" cy="80"  r="4" fill="white" fillOpacity="0.3" />
      <circle cx="260" cy="120" r="3" fill="white" fillOpacity="0.2" />
      <circle cx="40" cy="290" r="5" fill="white" fillOpacity="0.15" />
      <circle cx="285" cy="300" r="4" fill="white" fillOpacity="0.25" />
      <circle cx="100" cy="350" r="3" fill="white" fillOpacity="0.2" />
      <circle cx="230" cy="60"  r="6" fill="white" fillOpacity="0.1" />

      {/* Shield body */}
      <path
        d="M160 60 L240 95 L240 175 C240 225 205 265 160 285 C115 265 80 225 80 175 L80 95 Z"
        fill="white"
        fillOpacity="0.15"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      {/* Shield inner glow */}
      <path
        d="M160 80 L225 110 L225 175 C225 215 197 248 160 265 C123 248 95 215 95 175 L95 110 Z"
        fill="white"
        fillOpacity="0.08"
      />

      {/* Lock icon inside shield */}
      <rect x="143" y="168" width="34" height="26" rx="4" fill="white" fillOpacity="0.9" />
      <path
        d="M150 168 L150 160 C150 151 170 151 170 160 L170 168"
        stroke="white"
        strokeOpacity="0.9"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="160" cy="181" r="4" fill="#4f46e5" />

      {/* Checkmark badges */}
      <g opacity="0.85">
        <rect x="18" y="160" width="72" height="28" rx="14" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <text x="54" y="178" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">AES-256</text>
      </g>
      <g opacity="0.85">
        <rect x="230" y="200" width="76" height="28" rx="14" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <text x="268" y="218" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">Zero-Trust</text>
      </g>
      <g opacity="0.85">
        <rect x="60" y="310" width="68" height="28" rx="14" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <text x="94" y="328" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">GDPR</text>
      </g>

      {/* Tagline */}
      <text x="160" y="345" textAnchor="middle" fill="white" fillOpacity="0.7" fontSize="13" fontWeight="500">
        Secure. Private. Yours.
      </text>
    </svg>
  );
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState<"login" | "signup">("login");

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 1500);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[820px] rounded-3xl overflow-hidden shadow-2xl flex pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Left graphic panel ── */}
              <div className="hidden md:flex w-[340px] shrink-0 flex-col items-center justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative p-8 overflow-hidden">
                {/* Background shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="bg-white/95 rounded-lg px-3 py-2 shadow-md">
                    <img
                      src={`${import.meta.env.BASE_URL}brand/luxor-logo.png?v=1777494202`}
                      alt="Luxor PDF"
                      className="h-8 w-auto select-none"
                      draggable={false}
                    />
                  </div>
                  <p className="text-white/60 text-xs text-center">Professional PDF Suite</p>
                </div>

                <div className="relative z-10 w-full flex-1 flex items-center justify-center py-4">
                  <ShieldGraphic />
                </div>

                <div className="relative z-10 text-center">
                  <p className="text-white/80 text-sm font-medium">Trusted by 50,000+ professionals</p>
                  <div className="flex justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-300 text-sm">★</span>
                    ))}
                    <span className="text-white/60 text-xs ml-1 self-center">4.9/5</span>
                  </div>
                </div>
              </div>

              {/* ── Right form panel ── */}
              <div className="flex-1 bg-white flex flex-col">
                {/* Close button */}
                <div className="flex justify-end p-4">
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-8 pb-10">
                  {/* Tab switcher */}
                  <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
                    {(["login", "signup"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          tab === t
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {t === "login" ? "Sign In" : "Create Account"}
                      </button>
                    ))}
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 mb-1">
                    {tab === "login" ? "Welcome back" : "Get started free"}
                  </h2>
                  <p className="text-slate-500 text-sm mb-7">
                    {tab === "login"
                      ? "Sign in to your Luxor PDF account"
                      : "Create your account in seconds"}
                  </p>

                  {/* Social buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#00a4ef">
                        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                      </svg>
                      Microsoft
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">or continue with email</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {tab === "signup" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">First name</label>
                          <input
                            type="text"
                            placeholder="Jane"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Last name</label>
                          <input
                            type="text"
                            placeholder="Doe"
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-600">Password</label>
                        {tab === "login" && (
                          <a href="#forgot" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</a>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder={tab === "signup" ? "Min. 8 characters" : "••••••••"}
                          required
                          className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {tab === "login" && (
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600" />
                        <span className="text-sm text-slate-600">Remember me for 30 days</span>
                      </label>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-70 mt-2"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {tab === "login" ? "Sign In" : "Create Account"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-sm text-slate-500 mt-6">
                    {tab === "login" ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={() => setTab(tab === "login" ? "signup" : "login")}
                      className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors"
                    >
                      {tab === "login" ? "Sign up free" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
