import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  /** Toggled plans expose monthly/yearly prices. */
  monthlyPrice?: number;
  yearlyPrice?: number;
  /** Flat-rate plan (Premium) — single price, not affected by the toggle. */
  flatPrice?: number;
  /** Non-priced plans (Enterprise) display this label instead of a number. */
  priceLabel?: string;
  /** Rupee pricing shown to visitors in India. `yearly` is the total per year. */
  inr?: { monthly: number; yearly: number };
  /** Hide this card entirely for visitors in India. */
  hideInIndia?: boolean;
  /** Alternate card name for visitors in India. */
  indiaName?: string;
  cta: string;
  /**
   * When set, the Buy button initiates Stripe checkout for this plan via the
   * pdf-expiry /checkout page. Either a single ?plan= value (team/business) or
   * a monthly/yearly pair for toggled individual plans.
   */
  checkoutPlan?: string | { monthly: string; yearly: string };
  /** Enterprise uses a contact link instead of online checkout. */
  contactHref?: string;
  highlight?: boolean;
  badge?: string;
  /** Headline monthly secure-action allowance for this tier. */
  secureLimit: string;
  features: string[];
  limits: string;
};

// pdf-expiry app owns Clerk auth + the checkout-session POST. Buy buttons
// just deep-link to /pdf-expiry/checkout?plan=... — that page signs the
// user in (if needed) then redirects to Stripe.
const CHECKOUT_BASE = "/app/checkout";

const PLANS: Plan[] = [
  {
    id: "individual",
    name: "Starter",
    tagline: "For solo professionals securing their own documents.",
    monthlyPrice: 9,
    yearlyPrice: 7,
    inr: { monthly: 499, yearly: 4999 },
    cta: "Get Starter",
    checkoutPlan: { monthly: "monthly", yearly: "yearly" },
    secureLimit: "10 secure actions / month",
    limits: "1 user · Commercial use",
    features: [
      "Luxor PDF Reader (full)",
      "Unlimited general tools (convert, merge, split)",
      "Password protect, expiry, revoke, copy & print restriction",
      "1 user · 2 devices",
      "Priority email support",
    ],
  },
  {
    id: "team",
    name: "Pro",
    tagline: "For teams that share and protect documents together.",
    monthlyPrice: 29,
    yearlyPrice: 23,
    inr: { monthly: 1499, yearly: 14999 },
    cta: "Contact sales",
    contactHref: "mailto:sales@luxorpdf.com",
    highlight: true,
    badge: "Most popular",
    secureLimit: "50 secure actions / month",
    limits: "Per seat · Commercial use",
    features: [
      "Everything in Starter, plus:",
      "Shared monthly secure pool across the team",
      "Pro licenses & admin console",
      "5 users · 10 devices",
      "SSO & audit logs",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Premium",
    tagline: "Unlimited secure actions for high-volume orgs.",
    flatPrice: 99,
    hideInIndia: true,
    cta: "Contact sales",
    contactHref: "mailto:sales@luxorpdf.com",
    secureLimit: "Unlimited secure actions",
    limits: "Per org · Commercial use",
    features: [
      "Everything in Pro, plus:",
      "Unlimited secure actions every month",
      "10 users · 20 devices",
      "Advanced admin & usage analytics",
      "Dedicated success manager",
      "Volume discounts",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom quotas, SSO, and procurement for large orgs.",
    priceLabel: "Custom",
    indiaName: "Custom",
    cta: "Contact sales",
    contactHref: "mailto:sales@luxorpdf.com",
    secureLimit: "Custom secure quota",
    limits: "Custom terms",
    features: [
      "Everything in Premium, plus:",
      "Custom monthly secure quota",
      "Custom contracts & invoicing",
      "Dedicated SSO & SAML",
      "On-prem / private deployment options",
      "SLA & dedicated support",
    ],
  },
];

/** Column order matches PLANS: Starter, Pro, Premium, Enterprise. */
const COMPARE_COLUMNS = ["Starter", "Pro", "Premium", "Enterprise"] as const;

type CompareValue = string;
type CompareRow = { feature: string; values: [CompareValue, CompareValue, CompareValue, CompareValue]; emphasize?: boolean };
type CompareGroup = { group: string; note?: string; rows: CompareRow[] };

const UNLIMITED_ALL: [string, string, string, string] = ["Unlimited", "Unlimited", "Unlimited", "Unlimited"];
const YES_ALL: [string, string, string, string] = ["Yes", "Yes", "Yes", "Yes"];

const COMPARE_GROUPS: CompareGroup[] = [
  {
    group: "Seats & devices",
    rows: [
      { feature: "Users", values: ["1 user", "5 users", "10 users", "Custom"] },
      { feature: "Devices", values: ["2 devices", "10 devices", "20 devices", "Custom"] },
    ],
  },
  {
    group: "General tools",
    note: "Always unlimited on every paid plan.",
    rows: [
      { feature: "PDF Reader", values: UNLIMITED_ALL },
      { feature: "Merge PDF", values: UNLIMITED_ALL },
      { feature: "Split PDF", values: UNLIMITED_ALL },
      { feature: "Extract Pages", values: UNLIMITED_ALL },
      { feature: "Delete Pages", values: UNLIMITED_ALL },
      { feature: "Convert PDF to Image", values: UNLIMITED_ALL },
      { feature: "Convert Image to PDF", values: UNLIMITED_ALL },
    ],
  },
  {
    group: "Secure actions",
    note: "These three features draw from one shared monthly pool — not separate allowances.",
    rows: [
      { feature: "Password Protect PDF", values: ["10 / month", "50 / month", "Unlimited", "Custom"], emphasize: true },
      { feature: "Expiry Date / Secure PDF", values: ["10 / month", "50 / month", "Unlimited", "Custom"], emphasize: true },
      { feature: "Print / Copy Restriction", values: ["10 / month", "50 / month", "Unlimited", "Custom"], emphasize: true },
    ],
  },
  {
    group: "Management & support",
    rows: [
      { feature: "License Key Activation", values: YES_ALL },
      { feature: "Admin Dashboard", values: ["No", "Yes", "Yes", "Yes"] },
      { feature: "User Management", values: ["No", "Yes", "Yes", "Yes"] },
      { feature: "Device Management", values: ["Basic", "Yes", "Yes", "Yes"] },
      { feature: "Priority Support", values: ["No", "Basic", "Priority", "Dedicated"] },
    ],
  },
];

const FAQS = [
  {
    q: "What counts as a secure action?",
    a: "Secure actions are the metered premium operations: password-protecting a PDF, setting an expiry date, revoking access, and applying copy or print restrictions. They all draw from one shared monthly pool — Starter gets 10/month, Pro 50/month, and Premium is unlimited. General tools (convert, merge, split, view) are always unlimited on every paid plan.",
  },
  {
    q: "When does my monthly quota reset?",
    a: "Your secure-action pool resets every billing month, anchored to your subscription start date. You'll always see your remaining actions and the next reset date right inside your dashboard.",
  },
  {
    q: "How do license keys work?",
    a: "When you subscribe, we issue a license key that activates Luxor PDF on your devices. Keys auto-renew with your subscription. If you cancel, your existing key keeps working until the end of your billing period.",
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
    q: "Do you offer Enterprise or custom quotas?",
    a: "Yes. Premium gives you unlimited secure actions out of the box. For custom monthly quotas, SSO/SAML, on-prem deployment, or procurement terms, contact our sales team for an Enterprise plan.",
  },
  {
    q: "Which platforms are supported?",
    a: "Windows desktop (full installer), macOS (coming soon), and a web app that works in any modern browser. Same license unlocks all platforms.",
  },
];

/**
 * Region detection mirrors the checkout page: visitors in India see rupee
 * pricing (and are charged in INR via Razorpay); everyone else sees USD.
 */
function detectIsIndia(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz === "Asia/Kolkata" || tz === "Asia/Calcutta";
  } catch {
    return false;
  }
}

const inrFmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function checkoutHref(plan: Plan, yearly: boolean): string | null {
  if (!plan.checkoutPlan) return null;
  if (typeof plan.checkoutPlan === "string") {
    return `${CHECKOUT_BASE}?plan=${plan.checkoutPlan}`;
  }
  return `${CHECKOUT_BASE}?plan=${yearly ? plan.checkoutPlan.yearly : plan.checkoutPlan.monthly}`;
}

function CompareCell({ value }: { value: string }) {
  if (value === "No") {
    return <span className="inline-block text-slate-300">—</span>;
  }
  if (value === "Yes") {
    return (
      <span className="inline-flex w-5 h-5 rounded-full bg-emerald-50 items-center justify-center">
        <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
      </span>
    );
  }
  if (value === "Unlimited") {
    return <span className="font-medium text-slate-700">Unlimited</span>;
  }
  return <span className="text-slate-700">{value}</span>;
}

function CompareGroupRows({ group, isIndia }: { group: CompareGroup; isIndia: boolean }) {
  return (
    <>
      <tr className="bg-slate-50/60 border-t border-slate-200">
        <td colSpan={isIndia ? 4 : 5} className="px-5 py-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{group.group}</span>
          {group.note && <span className="ml-2 text-xs text-slate-400 normal-case font-normal">{group.note}</span>}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.feature} className="border-t border-slate-100">
          <td className="px-5 py-3 text-slate-700">
            {row.feature}
            {row.emphasize && <span className="text-[#FB7185]">*</span>}
          </td>
          {row.values.map((value, i) => {
            if (isIndia && COMPARE_COLUMNS[i] === "Premium") return null;
            return (
              <td
                key={i}
                className={`px-4 py-3 text-center ${COMPARE_COLUMNS[i] === "Pro" ? "bg-[#EAF2FB]/40" : ""}`}
              >
                <CompareCell value={value} />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const isIndia = useMemo(detectIsIndia, []);
  const visiblePlans = isIndia
    ? PLANS.filter((p) => !p.hideInIndia)
    : PLANS;
  // Yearly-billing savings vs paying monthly, based on the Starter plan.
  const savePct = isIndia
    ? Math.round((1 - 4999 / (499 * 12)) * 100)
    : 22;

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
              <span className="text-neutral-400 font-semibold">Pick your secure pool.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10">
              Every paid plan unlocks unlimited general tools. Your plan sets one shared monthly pool of secure actions — password protect, expiry, revoke, and copy/print restriction.
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
                  Save {savePct}%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6">
          <div className={`grid md:grid-cols-2 ${isIndia ? "lg:grid-cols-3 max-w-5xl" : "lg:grid-cols-4 max-w-[88rem]"} gap-6 mx-auto`}>
            {visiblePlans.map((plan, i) => {
              const href = checkoutHref(plan, yearly);
              const isCustom = plan.priceLabel !== undefined;
              const isFlat = plan.flatPrice !== undefined;
              const useInr = isIndia && plan.inr !== undefined;
              const price = useInr
                ? yearly
                  ? plan.inr!.yearly
                  : plan.inr!.monthly
                : isFlat
                  ? plan.flatPrice!
                  : yearly
                    ? (plan.yearlyPrice ?? 0)
                    : (plan.monthlyPrice ?? 0);
              const priceText = isCustom
                ? plan.priceLabel
                : useInr
                  ? inrFmt(price)
                  : `$${price}`;
              const displayName = isIndia && plan.indiaName ? plan.indiaName : plan.name;

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
                    <h2 className={`text-xl font-semibold mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{displayName}</h2>
                    <p className={`text-sm ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>{plan.tagline}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-5xl font-bold tracking-tight ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                        {priceText}
                      </span>
                      {!isCustom && (
                        <span className={`text-sm ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                          {useInr && yearly && !isFlat ? "/yr" : "/mo"}
                        </span>
                      )}
                    </div>
                    {isCustom ? (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Tailored to your org
                      </p>
                    ) : isFlat ? (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Billed monthly
                      </p>
                    ) : yearly ? (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        {useInr ? "Billed once a year" : `Billed $${price * 12}/year`}
                      </p>
                    ) : (
                      <p className={`text-xs mt-1 ${plan.highlight ? "text-neutral-300" : "text-slate-500"}`}>
                        Billed monthly
                      </p>
                    )}
                  </div>

                  {/* Headline secure-pool allowance */}
                  <div
                    className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${
                      plan.highlight
                        ? "bg-white/10 text-white"
                        : "bg-[#EAF2FB] text-[#312E81]"
                    }`}
                  >
                    {plan.secureLimit}
                  </div>

                  {href ? (
                    <a
                      href={href}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-7 ${
                        plan.highlight
                          ? "bg-white text-[#312E81] hover:bg-neutral-100"
                          : "bg-[#312E81] text-white hover:bg-[#3730A3]"
                      }`}
                      data-testid={`pricing-buy-${plan.id}`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <a
                      href={plan.contactHref ?? "mailto:sales@luxorpdf.com"}
                      className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-7 ${
                        plan.highlight
                          ? "bg-white text-[#312E81] hover:bg-neutral-100"
                          : "bg-[#312E81] text-white hover:bg-[#3730A3]"
                      }`}
                      data-testid={`pricing-buy-${plan.id}`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}

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
            Need custom quotas or Enterprise terms?{" "}
            <a href="mailto:sales@luxorpdf.com" className="text-[#312E81] font-semibold hover:underline">
              Talk to sales →
            </a>
          </p>
        </div>
      </section>

      {/* Full comparison table */}
      <section className="pb-24 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Compare plans</p>
            <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.02em]">
              Every feature, side by side.
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left font-semibold text-slate-900 px-5 py-4 w-[28%]">Feature</th>
                  {COMPARE_COLUMNS.filter((col) => !(isIndia && col === "Premium")).map((col) => (
                    <th
                      key={col}
                      className={`text-center font-semibold px-4 py-4 ${
                        col === "Pro" ? "text-[#312E81] bg-[#EAF2FB]" : "text-slate-900"
                      }`}
                    >
                      {col === "Enterprise" && isIndia ? "Custom" : col}
                      {col === "Pro" && (
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#FB7185]">
                          Most popular
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_GROUPS.map((grp) => (
                  <CompareGroupRows key={grp.group} group={grp} isIndia={isIndia} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            * Password Protect, Expiry / Secure PDF, and Print / Copy Restriction share a single monthly pool of secure actions.
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
              { label: "Unlimited tools", sub: "Convert, merge, split" },
              { label: "AES-256", sub: "Encryption built-in" },
              { label: "Free updates", sub: "For life of subscription" },
              { label: "Cancel anytime", sub: "No long contracts" },
              { label: "License keys", sub: "Auto-renewed" },
              { label: "Web + Desktop", sub: "Same subscription" },
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
          <p className="text-slate-600 mb-6 text-lg">Pick a plan and start securing documents in minutes.</p>
          <ul className="flex flex-wrap gap-2 justify-center mb-8">
            {[
              "Unlimited general tools",
              "Shared monthly secure pool",
              "Cancel anytime",
              "30-day refund",
            ].map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full px-3 py-1.5"
              >
                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={`${CHECKOUT_BASE}?plan=monthly`}
              className="px-7 py-3.5 rounded-lg bg-[#312E81] text-white font-semibold hover:bg-[#3730A3] transition-colors shadow-sm"
            >
              Get started
            </a>
            <a href="mailto:sales@luxorpdf.com" className="px-7 py-3.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-white transition-colors">
              Talk to sales
            </a>
          </div>
        </div>
      </section>
    </ProductPageLayout>
  );
}
