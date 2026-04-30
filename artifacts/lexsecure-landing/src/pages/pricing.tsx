import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  cta: string;
  ctaHref: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: string;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try Luxor PDF Reader, forever free.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Get started free",
    ctaHref: "/web-app",
    limits: "1 device · Personal use",
    features: [
      "Luxor PDF Reader (full)",
      "Open & view unlimited PDFs",
      "Basic annotations & highlights",
      "Up to 25 MB per file",
      "Single device",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Everything an individual professional needs.",
    monthlyPrice: 9,
    yearlyPrice: 7,
    cta: "Start 14-day trial",
    ctaHref: "/web-app",
    highlight: true,
    badge: "Most popular",
    limits: "3 devices · Commercial use",
    features: [
      "Everything in Free, plus:",
      "Unlimited file size",
      "Tabs & multi-doc workflow",
      "Smart search across files",
      "Advanced annotations & redaction",
      "LuxorSign — 25 documents/month",
      "PDF Expiry — basic",
      "Priority email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams that share, sign, and protect documents.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    cta: "Start trial",
    ctaHref: "/contact",
    limits: "Per user · Commercial use",
    features: [
      "Everything in Pro, plus:",
      "Unlimited devices per user",
      "LuxorSign — Unlimited",
      "PDF Expiry — full (remote revoke)",
      "Team licenses & admin console",
      "SSO & audit logs",
      "Volume discounts (10+ seats)",
      "Dedicated success manager",
    ],
  },
];

const FAQS = [
  {
    q: "How do license keys work?",
    a: "When you subscribe, we issue a license key that activates Luxor PDF on your devices. Keys auto-renew yearly with your subscription — you'll get a fresh key every year. If you cancel, your existing key keeps working until the end of your billing period.",
  },
  {
    q: "Is the Free tier really free?",
    a: "Yes. Free is free forever — no credit card, no time limit. You get the full Luxor PDF Reader for personal use on one device, with basic annotation tools.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Absolutely. Upgrade instantly with prorated billing, or downgrade at the end of your billing period. No questions asked, no long-term contracts.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Nothing changes. All your PDFs, annotations, and signed documents stay on your device — Luxor is local-first. Your license key just stops working at the end of your billing cycle.",
  },
  {
    q: "Do you offer team or volume discounts?",
    a: "Yes. Business plan gets automatic volume discounts at 10+ seats. For larger orgs (100+ users), contact us for custom pricing and Enterprise SSO.",
  },
  {
    q: "Which platforms are supported?",
    a: "Windows desktop (full installer), macOS (coming soon), and a web app that works in any modern browser. Same license unlocks all platforms.",
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-[#EAF2FB] rounded-full filter blur-[120px] opacity-80" />
        </div>

        <div className="container mx-auto px-6 relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              Subscription pricing · Cancel anytime
            </div>
            <h1 className="text-5xl md:text-7xl text-slate-900 mb-5 tracking-[-0.02em] leading-[1.05]">
              Simple, fair pricing.<br />
              <span className="text-neutral-400 font-semibold">Start free.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10">
              One subscription, all of Luxor. Reader is the core — add LuxorSign and PDF Expiry as your needs grow.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full p-1">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${yearly ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Yearly
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">
                  Save 22%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan, i) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isFree = plan.monthlyPrice === 0;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    plan.highlight
                      ? "bg-[#312E81] text-white shadow-2xl shadow-[#312E81]/20 ring-1 ring-[#312E81]/30"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#FB7185] text-[#7F1D1D] text-xs font-bold uppercase tracking-wider shadow-md shadow-[#FB7185]/30">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h2 className={`text-xl font-semibold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h2>
                    <p className={`text-sm ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>{plan.tagline}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-bold tracking-tight ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                        {isFree ? "$0" : `$${price}`}
                      </span>
                      <span className={`text-sm ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        {isFree ? "" : "/mo"}
                      </span>
                    </div>
                    {!isFree && yearly && (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Billed ${price * 12}/year
                      </p>
                    )}
                    {!isFree && !yearly && (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Billed monthly
                      </p>
                    )}
                    {isFree && (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Free forever
                      </p>
                    )}
                  </div>

                  <Link href={plan.ctaHref}>
                    <button className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-7 ${
                      plan.highlight
                        ? "bg-white text-[#312E81] hover:bg-neutral-100"
                        : "bg-[#312E81] text-white hover:bg-[#3730A3]"
                    }`}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  <p className={`text-[11px] uppercase tracking-wider font-semibold mb-4 ${plan.highlight ? "text-neutral-400" : "text-slate-500"}`}>
                    {plan.limits}
                  </p>

                  <div className="flex-1 space-y-3 pt-1">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.highlight ? "bg-neutral-700" : "bg-emerald-50"
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${plan.highlight ? "text-white" : "text-emerald-600"}`} strokeWidth={3} />
                        </div>
                        <span className={`text-sm leading-snug ${plan.highlight ? "text-neutral-100" : "text-slate-700"}`}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-slate-500 text-sm mt-10">
            Need 100+ seats or custom Enterprise terms?{" "}
            <a href="mailto:sales@luxorpdf.com" className="text-[#312E81] font-semibold hover:underline">
              Talk to sales →
            </a>
          </p>
        </div>
      </section>

      {/* All plans include */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Every plan includes</p>
            <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.02em]">
              The Luxor essentials.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Privacy-first", sub: "Local processing" },
              { label: "AES-256", sub: "Encryption built-in" },
              { label: "Free updates", sub: "For life of subscription" },
              { label: "Cancel anytime", sub: "No long contracts" },
              { label: "License keys", sub: "Renewed yearly" },
              { label: "Web + Desktop", sub: "Same subscription" },
              { label: "GDPR ready", sub: "EU & India compliant" },
              { label: "30-day refund", sub: "If you're not happy" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-5 border border-slate-200 text-center">
                <p className="font-semibold text-slate-900 mb-1">{item.label}</p>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.02em]">
              Common questions.
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl p-7 border border-slate-200 hover:border-slate-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2 text-lg">{q}</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl text-slate-900 mb-5 tracking-[-0.02em]">
            Ready to switch to Luxor?
          </h2>
          <p className="text-slate-600 mb-8 text-lg">No credit card. No commitment. 14-day Pro trial included.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/web-app" className="px-7 py-3.5 rounded-lg bg-[#312E81] text-white font-semibold hover:bg-[#3730A3] transition-colors shadow-sm">
              Start free
            </Link>
            <a href="mailto:sales@luxorpdf.com" className="px-7 py-3.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-white transition-colors">
              Talk to sales
            </a>
          </div>
        </div>
      </section>
    </ProductPageLayout>
  );
}
