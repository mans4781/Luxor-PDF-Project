import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Finally, a PDF tool we can actually use. Our IT department banned cloud PDF converters years ago due to data sovereignty concerns. LuxorSecure running client-side solves everything.",
    author: "Sarah Jenkins",
    role: "Managing Partner, Jenkins & Croft Legal",
    cardBg: "bg-gradient-to-br from-[#EEF2FF] to-white",
    border: "border-[#312E81]/15",
    quoteColor: "text-[#312E81]/20",
    avatarBg: "bg-gradient-to-br from-[#312E81] to-[#3730A3]",
    accent: "text-[#312E81]",
  },
  {
    quote: "The expiry feature is brilliant for sending confidential term sheets to prospective investors. We know exactly when access is revoked, and we control it cryptographically.",
    author: "Michael Torres",
    role: "Director of M&A, Catalyst Ventures",
    cardBg: "bg-gradient-to-br from-[#FFF1F2] to-white",
    border: "border-[#FB7185]/25",
    quoteColor: "text-[#FB7185]/30",
    avatarBg: "bg-gradient-to-br from-[#FB7185] to-[#E11D48]",
    accent: "text-[#E11D48]",
  },
  {
    quote: "Merging 500-page discovery documents in the browser without uploading them first feels like magic. The desktop app is even faster. Indispensable tool for our paralegals.",
    author: "David Chen",
    role: "Head of IT, Chen & Associates",
    cardBg: "bg-gradient-to-br from-[#EFF6FF] to-white",
    border: "border-[#2563EB]/20",
    quoteColor: "text-[#2563EB]/25",
    avatarBg: "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]",
    accent: "text-[#2563EB]",
  },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("");
}

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-[#312E81]/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-5 shadow-sm">
            <Star className="w-3.5 h-3.5 text-[#FB7185] fill-[#FB7185]" />
            Loved by professionals
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4 tracking-[-0.02em]">Trusted by Professionals</h2>
          <p className="text-lg text-slate-600">Used daily by law firms, financial institutions, and security-conscious businesses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`group p-8 rounded-2xl border ${t.border} ${t.cardBg} shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-shadow duration-300 relative overflow-hidden`}
            >
              <Quote className={`w-12 h-12 ${t.quoteColor} absolute top-5 right-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`} />
              {/* 5-star row */}
              <div className="flex items-center gap-0.5 mb-4 relative">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={`w-3.5 h-3.5 fill-current ${t.accent}`} />
                ))}
              </div>
              <p className="text-slate-800 font-medium leading-relaxed mb-6 relative z-10 text-[15px]">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                  {initials(t.author)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm leading-tight">{t.author}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
