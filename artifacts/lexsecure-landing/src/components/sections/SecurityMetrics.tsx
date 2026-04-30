import { motion, useReducedMotion } from "framer-motion";
import { KeyRound, Timer, Lock, Share2, ShieldCheck } from "lucide-react";

type Metric = {
  icon: typeof KeyRound;
  label: string;
  value: number;
  caption: string;
  accent: string;
  textColor: string;
};

const METRICS: Metric[] = [
  {
    icon: KeyRound,
    label: "Password Strength",
    value: 90,
    caption: "AES-256 with custom complexity rules",
    accent: "#312E81",
    textColor: "#312E81",
  },
  {
    icon: Timer,
    label: "Access Expiry",
    value: 74,
    caption: "Documents auto-revoke at your deadline",
    accent: "#2563EB",
    textColor: "#1D4ED8",
  },
  {
    icon: Lock,
    label: "Permission Control",
    value: 82,
    caption: "Disable print, copy, edit, and download",
    accent: "#DC2626",
    textColor: "#B91C1C",
  },
  {
    icon: Share2,
    label: "Sharing Safety",
    value: 65,
    caption: "Per-recipient links with audit trail",
    accent: "#FB7185",
    textColor: "#BE123C",
  },
];

export function SecurityMetrics() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <section
      id="security-metrics"
      className="relative py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[#312E81]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-24 w-96 h-96 bg-[#FB7185]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#312E81]/8 border border-[#312E81]/15 text-[#312E81] text-xs font-semibold uppercase tracking-wider mb-5"
          >
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.4} />
            Security at a glance
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-4"
          >
            Built-in protection,{" "}
            <span className="text-[#2563EB]">measured and visible.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="text-lg text-slate-600 leading-relaxed"
          >
            Every document you share through Luxor is wrapped in four layers of
            control — and you can see exactly how each one is working.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 md:p-10"
        >
          <div className="space-y-8">
            {METRICS.map(
              ({ icon: Icon, label, value, caption, accent, textColor }) => (
                <motion.div
                  key={label}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${accent}14`, color: accent }}
                      aria-hidden="true"
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900">
                          {label}
                        </h3>
                        <span
                          className="text-lg font-extrabold tabular-nums tracking-tight"
                          style={{ color: textColor }}
                          aria-hidden="true"
                        >
                          {value}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3 leading-snug">
                        {caption}
                      </p>
                      <div
                        className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                        role="progressbar"
                        aria-label={`${label}: ${value} percent`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={value}
                      >
                        <motion.div
                          initial={
                            prefersReducedMotion
                              ? { width: `${value}%` }
                              : { width: 0 }
                          }
                          whileInView={{ width: `${value}%` }}
                          viewport={{ once: true }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : {
                                  duration: 1.1,
                                  delay: 0.2,
                                  ease: [0.22, 1, 0.36, 1],
                                }
                          }
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
