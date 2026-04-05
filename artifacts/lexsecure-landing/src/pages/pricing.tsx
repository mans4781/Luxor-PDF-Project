import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Zap, Shield, Building2, Star, ArrowRight } from "lucide-react";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-50",
    badge: null,
    desc: "Perfect for individuals and freelancers who need essential PDF tools.",
    monthlyPrice: 9,
    yearlyPrice: 7,
    cta: "Start Free Trial",
    ctaStyle: "border-2 border-sky-500 text-sky-600 hover:bg-sky-50",
    gradient: "from-sky-500 to-blue-500",
    headerBg: "bg-gradient-to-br from-sky-50 to-blue-50",
    features: [
      { text: "Luxor PDF Reader",          included: true  },
      { text: "Luxor PDF Editor (basic)",  included: true  },
      { text: "Luxor eSign — 5 docs/mo",  included: true  },
      { text: "PDF Security & Encryption", included: true  },
      { text: "Expiry dates on PDFs",      included: true  },
      { text: "Up to 50 MB file size",     included: true  },
      { text: "1 device",                  included: true  },
      { text: "Advanced redaction",        included: false },
      { text: "Remote revoke",             included: false },
      { text: "Team collaboration",        included: false },
      { text: "Priority support",          included: false },
      { text: "API access",                included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Shield,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    badge: "Most Popular",
    desc: "For professionals and small teams who need the full PDF power suite.",
    monthlyPrice: 24,
    yearlyPrice: 19,
    cta: "Get Professional",
    ctaStyle: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25",
    gradient: "from-violet-600 to-indigo-600",
    headerBg: "bg-gradient-to-br from-violet-600 to-indigo-700",
    features: [
      { text: "Luxor PDF Reader",              included: true },
      { text: "Luxor PDF Editor (full)",       included: true },
      { text: "Luxor eSign — 50 docs/mo",     included: true },
      { text: "PDF Security & Encryption",     included: true },
      { text: "Expiry dates on PDFs",          included: true },
      { text: "Up to 500 MB file size",        included: true },
      { text: "Up to 3 devices",               included: true },
      { text: "Advanced redaction",            included: true },
      { text: "Remote revoke",                 included: true },
      { text: "Team collaboration (up to 5)",  included: true },
      { text: "Priority support",              included: false },
      { text: "API access",                    included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    badge: "Best Value",
    desc: "For organisations needing unlimited access, compliance, and dedicated support.",
    monthlyPrice: 59,
    yearlyPrice: 47,
    cta: "Contact Sales",
    ctaStyle: "border-2 border-amber-500 text-amber-700 hover:bg-amber-50",
    gradient: "from-amber-500 to-orange-500",
    headerBg: "bg-gradient-to-br from-amber-50 to-orange-50",
    features: [
      { text: "Luxor PDF Reader",              included: true },
      { text: "Luxor PDF Editor (full)",       included: true },
      { text: "Luxor eSign — Unlimited",       included: true },
      { text: "PDF Security & Encryption",     included: true },
      { text: "Expiry dates on PDFs",          included: true },
      { text: "Unlimited file size",           included: true },
      { text: "Unlimited devices",             included: true },
      { text: "Advanced redaction",            included: true },
      { text: "Remote revoke",                 included: true },
      { text: "Team collaboration (unlimited)",included: true },
      { text: "Dedicated priority support",    included: true },
      { text: "Full API access",               included: true },
    ],
  },
];

const faqs = [
  { q: "Can I switch plans at any time?", a: "Yes — upgrade or downgrade instantly. Billing is prorated so you only pay for what you use." },
  { q: "Is there a free trial?", a: "All plans start with a 14-day free trial. No credit card required until the trial ends." },
  { q: "How does annual billing work?", a: "Pay once a year and save up to 22% compared to monthly billing. You can cancel before the next renewal." },
  { q: "Does my data stay private?", a: "Absolutely. Luxor PDF processes all files locally on your device. Nothing is ever uploaded to our servers unless you explicitly share." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              14-day free trial · No credit card required
            </div>
            <h1 className="text-5xl font-bold mb-4">Simple, honest pricing</h1>
            <p className="text-indigo-200 text-lg max-w-xl mx-auto mb-10">
              One plan for every stage. Start free, scale when you're ready. Cancel any time.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-1.5">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${!yearly ? "bg-white text-slate-800 shadow" : "text-white/70 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${yearly ? "bg-white text-slate-800 shadow" : "text-white/70 hover:text-white"}`}
              >
                Yearly
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${yearly ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-300"}`}>
                  Save 22%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isPro = plan.id === "professional";

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative rounded-3xl overflow-hidden flex flex-col ${
                    isPro ? "ring-2 ring-violet-500 shadow-2xl shadow-violet-500/20 scale-[1.03]" : "border border-slate-200 shadow-sm hover:shadow-md"
                  } bg-white transition-shadow`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${
                      isPro ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className={`p-7 ${isPro ? plan.headerBg : plan.headerBg}`}>
                    <div className={`w-11 h-11 rounded-2xl ${plan.iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className={`w-5 h-5 ${plan.iconColor}`} strokeWidth={2} />
                    </div>
                    <h2 className={`text-xl font-bold mb-1 ${isPro ? "text-white" : "text-slate-800"}`}>{plan.name}</h2>
                    <p className={`text-sm leading-relaxed mb-5 ${isPro ? "text-indigo-200" : "text-slate-500"}`}>{plan.desc}</p>
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-extrabold ${isPro ? "text-white" : "text-slate-800"}`}>${price}</span>
                      <span className={`text-sm mb-1 ${isPro ? "text-indigo-200" : "text-slate-400"}`}>/mo</span>
                    </div>
                    {yearly && (
                      <p className={`text-xs mt-1 ${isPro ? "text-indigo-200" : "text-slate-400"}`}>
                        Billed ${price * 12}/year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex-1 p-7 space-y-3">
                    {plan.features.map(({ text, included }) => (
                      <div key={text} className="flex items-start gap-3">
                        {included ? (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-3 h-3 text-slate-400" strokeWidth={2.5} />
                          </div>
                        )}
                        <span className={`text-sm ${included ? "text-slate-700" : "text-slate-400"}`}>{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-7 pb-7">
                    <button className={`w-full py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${plan.ctaStyle}`}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Enterprise note */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Need a custom volume deal?{" "}
            <a href="mailto:sales@luxorpdf.com" className="text-violet-600 font-semibold hover:underline">
              Talk to our sales team →
            </a>
          </p>
        </div>
      </section>

      {/* Feature comparison strip */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">All plans include</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: "🔒", label: "AES-256 Encryption" },
              { icon: "⏰", label: "PDF Expiry Dates" },
              { icon: "🖥️", label: "Windows & Android" },
              { icon: "🔄", label: "Free Updates" },
              { icon: "📴", label: "100% Offline Mode" },
              { icon: "📄", label: "PDF/A Archival" },
              { icon: "🛡️", label: "GDPR Compliant" },
              { icon: "💬", label: "Email Support" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">Q</span> {q}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed pl-5">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-16 bg-gradient-to-br from-violet-900 to-indigo-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Start your free 14-day trial today</h2>
          <p className="text-indigo-200 mb-8 max-w-md mx-auto">No credit card. No commitment. Just powerful PDF tools.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#starter" className="px-8 py-3 rounded-xl bg-white text-violet-700 font-bold hover:bg-indigo-50 transition-colors shadow-lg">
              Start Free Trial
            </a>
            <a href="#contact" className="px-8 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">
              Talk to Sales
            </a>
          </div>
        </div>
      </section>
    </ProductPageLayout>
  );
}
