import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardHat, Mail, Sparkles, X, Bell } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Under Construction" popup shown whenever someone tries to sign in
 * or create an account on the marketing site. Sign-in is intentionally
 * disabled while the auth flow is being finalized.
 *
 * Keeps the original `{ open, onClose }` API so every existing
 * sign-in/sign-up trigger across the landing site works without
 * additional plumbing.
 */
export function LoginModal({ open, onClose }: LoginModalProps) {
  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="construction-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="construction-title"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/30 border border-slate-200"
          >
            {/* Decorative top band */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#312E81] via-[#2563EB] to-[#FB7185]">
              {/* Animated stripes */}
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.55) 0 14px, transparent 14px 32px)",
                }}
              />
              {/* Soft glow blobs */}
              <div className="absolute -top-8 -left-6 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-10 right-0 w-40 h-40 rounded-full bg-[#FB7185]/40 blur-3xl" />

              {/* Hard hat icon */}
              <motion.div
                initial={{ rotate: -8, y: 4 }}
                animate={{ rotate: [-8, 6, -8], y: [4, -2, 4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1/2 -translate-x-1/2 bottom-[-28px] w-[72px] h-[72px] rounded-2xl bg-white shadow-lg shadow-indigo-900/20 flex items-center justify-center border border-white"
              >
                <HardHat className="w-9 h-9 text-amber-500" strokeWidth={2.2} />
              </motion.div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-7 pt-12 pb-7 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" />
                Coming soon
              </div>

              <h2
                id="construction-title"
                className="text-2xl font-semibold text-slate-900 tracking-[-0.01em] mb-2"
              >
                We're putting on the finishing touches
              </h2>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Sign-in and account creation are temporarily unavailable
                while we finalize the Luxor PDF Suite. Thanks for your
                patience — we'll be live very soon.
              </p>

              {/* Quick actions */}
              <div className="mt-6 flex flex-col gap-2.5">
                <a
                  href="mailto:hello@luxorpdf.com?subject=Notify%20me%20when%20Luxor%20PDF%20launches"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#312E81] hover:bg-[#3730A3] text-white text-sm font-semibold shadow-sm shadow-[#312E81]/25 hover:shadow-md transition-all"
                >
                  <Bell className="w-4 h-4" />
                  Notify me at launch
                </a>
                <a
                  href="mailto:hello@luxorpdf.com"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-500" />
                  Contact the team
                </a>
              </div>

              {/* Footer note */}
              <p className="mt-5 text-[11px] text-slate-400">
                You can still browse the site and explore our tools.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
