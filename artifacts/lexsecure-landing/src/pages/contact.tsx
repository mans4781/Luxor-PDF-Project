import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  Mail, Send, MessageSquare, Headphones, Star, Check,
  ChevronDown, Plus, Minus, CheckCircle2,
} from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

/* ── Decorative leaves (original) ── */
function LeafCluster({ className = "", tone = "grey" }: { className?: string; tone?: "grey" | "blush" }) {
  const fills = tone === "blush" ? ["#fbd5d5", "#f8c4c4", "#fce8e8"] : ["#e5e7eb", "#eef0f3", "#f4f5f7"];
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <path d="M20 118 C22 70 40 40 78 22 C58 62 44 92 38 118 Z" fill={fills[0]} />
      <path d="M42 118 C48 80 66 56 98 44 C80 78 64 100 58 118 Z" fill={fills[1]} />
      <path d="M4 118 C6 86 14 64 34 48 C24 76 16 100 14 118 Z" fill={fills[2]} />
    </svg>
  );
}

/* ── Satisfaction illustration (original): laptop + chat bubble + envelope ── */
function SatisfactionIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]" aria-hidden="true">
      <svg viewBox="0 0 420 320" fill="none" className="w-full h-auto">
        <defs>
          <linearGradient id="lxsBubble" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ef4444" />
            <stop offset="1" stopColor="#dc2626" />
          </linearGradient>
          <pattern id="lxsDots" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1.8" cy="1.8" r="1.8" fill="#f3c9c9" />
          </pattern>
        </defs>

        {/* leaves behind */}
        <path d="M60 268 C56 200 76 152 128 118 C102 180 84 232 80 268 Z" fill="#e8eaee" />
        <path d="M92 268 C96 214 118 176 160 152 C136 204 112 240 106 268 Z" fill="#f6dcdc" />
        <path d="M348 268 C352 216 338 178 306 154 C326 202 340 240 342 268 Z" fill="#eceef1" />
        <path d="M322 268 C320 228 308 198 284 180 C300 218 312 246 314 268 Z" fill="#f8e3e3" />

        {/* dots + sparkles */}
        <rect x="34" y="96" width="44" height="40" rx="4" fill="url(#lxsDots)" />
        <path d="M330 74 l0 20 M320 84 l20 0" stroke="#ef8b8b" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M108 60 l0 12 M102 66 l12 0" stroke="#f3b0b0" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="356" cy="128" r="5" stroke="#f3b0b0" strokeWidth="2.6" />
        <circle cx="76" cy="170" r="4" stroke="#e3e6ea" strokeWidth="2.4" />

        {/* laptop */}
        <g>
          <rect x="112" y="128" width="184" height="122" rx="10" fill="#3f4756" />
          <rect x="120" y="136" width="168" height="106" rx="6" fill="#ffffff" />
          {/* screen content: support doc rows */}
          <rect x="132" y="148" width="64" height="8" rx="4" fill="#e6414d" opacity="0.85" />
          <rect x="132" y="166" width="140" height="7" rx="3.5" fill="#e5e9ef" />
          <rect x="132" y="181" width="126" height="7" rx="3.5" fill="#edf0f4" />
          <rect x="132" y="196" width="140" height="7" rx="3.5" fill="#e5e9ef" />
          <rect x="132" y="211" width="96" height="7" rx="3.5" fill="#edf0f4" />
          <rect x="132" y="226" width="52" height="9" rx="4.5" fill="#f6caca" />
          {/* base */}
          <path d="M92 250 H316 L302 266 C300 268.4 297 270 294 270 H114 C111 270 108 268.4 106 266 Z" fill="#4b5364" />
          <rect x="186" y="252" width="36" height="5" rx="2.5" fill="#39404e" />
        </g>

        {/* chat bubble */}
        <g>
          <path
            d="M132 46 C132 33 142.7 22 156 22 H208 C221.3 22 232 33 232 46 V74 C232 87 221.3 98 208 98 H172 L150 118 L154 98 H156 C142.7 98 132 87 132 74 Z"
            fill="url(#lxsBubble)"
          />
          <circle cx="163" cy="60" r="6" fill="#ffffff" />
          <circle cx="182" cy="60" r="6" fill="#ffffff" opacity="0.85" />
          <circle cx="201" cy="60" r="6" fill="#ffffff" opacity="0.7" />
        </g>

        {/* envelope */}
        <g transform="rotate(-6 262 236)">
          <rect x="218" y="204" width="88" height="62" rx="8" fill="#ffffff" stroke="#e4e7ec" />
          <path d="M220 210 L262 240 L304 210" stroke="#e6414d" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <path d="M218 262 L248 236 M306 262 L276 236" stroke="#eef0f4" strokeWidth="2.4" />
        </g>

        {/* ground shadow */}
        <ellipse cx="204" cy="286" rx="130" ry="10" fill="#d9dde3" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ── Data ── */
const reachCards = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "For all inquiries and support, reach out to us via email.",
    email: "support@luxorpdf.com",
  },
  {
    icon: Headphones,
    title: "General Inquiries",
    desc: "Have a general question about our products or services?",
    email: "enquiry@luxorpdf.com",
  },
  {
    icon: Star,
    title: "Feedback & Suggestions",
    desc: "We value your feedback! Help us improve by sharing your thoughts.",
    email: "feedback@luxorpdf.com",
  },
];

const satisfactionPoints = [
  "Expert support from real people",
  "Quick and helpful responses",
  "We listen, we care, we improve",
];

const heroPoints = [
  "We reply to all emails within 24 hours",
  "Friendly and knowledgeable support",
  "Committed to providing the best experience",
];

const products = ["Luxor PDF Reader", "Luxor PDF Secure", "Luxor PDF eSign", "Convert Tools", "Other"];

const faqs = [
  {
    q: "How long does it take to get a response?",
    a: "We reply to every email within 24 hours, and usually much faster during business days. Complex technical questions may take a little longer while we investigate properly.",
  },
  {
    q: "What information should I include in my message?",
    a: "Tell us which Luxor PDF product you're using, what you were trying to do, and what happened instead. Screenshots and your operating system version help us resolve things faster.",
  },
  {
    q: "Do you offer technical support?",
    a: "Yes — every Luxor PDF user gets technical support by email. Paid plan holders receive priority handling, and we'll walk you through any setup, licensing, or feature question.",
  },
];

type FormState = "idle" | "sending" | "sent";

const inputCls =
  "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition-all";

/* ── Component ── */
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", product: "", message: "" });
  const [status, setStatus] = useState<FormState>("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1600);
  }

  return (
    <ProductPageLayout>

      {/* ── Hero: intro + form card ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fdf7f7] to-white py-16 lg:py-20">
        {/* decorative backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-rose-100/60 blur-2xl" />
          <LeafCluster className="absolute bottom-0 left-0 w-40 opacity-90" tone="blush" />
          <LeafCluster className="absolute bottom-0 left-24 w-28 opacity-70" tone="grey" />
        </div>

        <div className="container relative mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left copy */}
            <motion.div {...fade(0)}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-1.5 text-xs font-bold text-[#DC2626] shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" />
                We'd Love to Hear From You
              </div>
              <h1 className="mb-5 font-serif text-5xl font-bold leading-tight text-slate-900">Contact Us</h1>
              <p className="mb-8 max-w-md text-[15px] leading-relaxed text-slate-600">
                Have a question, feedback, or need support? Our team is here to help you with anything related
                to <span className="font-semibold text-[#DC2626]">Luxor PDF</span>.
              </p>
              <ul className="space-y-3">
                {heroPoints.map(point => (
                  <li key={point} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Check className="h-3 w-3 text-[#DC2626]" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Form card */}
            <motion.div {...fade(0.12)}>
              <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-rose-100/60 sm:p-9">
                <div className="mb-6 text-center">
                  <h2 className="font-serif text-2xl font-bold text-slate-900">Send us a Message</h2>
                  <p className="mt-1.5 text-[13px] text-slate-500">
                    Fill out the form below and our team will get back to you.
                  </p>
                </div>

                {status === "sent" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-8 py-14 text-center"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                      <CheckCircle2 className="h-7 w-7 text-[#DC2626]" strokeWidth={1.8} />
                    </div>
                    <h3 className="mb-1.5 text-lg font-bold text-slate-900">Message sent!</h3>
                    <p className="max-w-xs text-sm text-slate-500">
                      Thanks for reaching out. Our team will get back to you within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setStatus("idle");
                        setForm({ name: "", email: "", subject: "", product: "", message: "" });
                      }}
                      className="mt-5 text-sm font-semibold text-[#DC2626] hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text" name="name" required value={form.name} onChange={handleChange}
                        placeholder="Full Name" aria-label="Full Name" className={inputCls}
                      />
                      <input
                        type="email" name="email" required value={form.email} onChange={handleChange}
                        placeholder="Email Address" aria-label="Email Address" className={inputCls}
                      />
                    </div>
                    <input
                      type="text" name="subject" required value={form.subject} onChange={handleChange}
                      placeholder="Subject" aria-label="Subject" className={inputCls}
                    />
                    <div className="relative">
                      <select
                        name="product" required value={form.product} onChange={handleChange}
                        aria-label="Product"
                        className={`${inputCls} appearance-none pr-10 ${form.product ? "text-slate-700" : "text-slate-400"}`}
                      >
                        <option value="" disabled>Product</option>
                        {products.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <textarea
                      name="message" required value={form.message} onChange={handleChange}
                      rows={5} placeholder="Message" aria-label="Message"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/25"
                    />
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#DC2626] text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:from-[#e63c3c] hover:to-[#c81e1e] disabled:opacity-70"
                    >
                      {status === "sending" ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <>
                          Send Message
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-slate-400">
                      By submitting this form, you agree to our{" "}
                      <Link href="/privacy" className="font-semibold text-[#DC2626] hover:underline">Privacy Policy</Link>.
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Other Ways to Reach Us ── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto px-6">
          <motion.div {...fade()} className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold text-slate-900">Other Ways to Reach Us</h2>
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#DC2626]" />
            <p className="mt-4 text-sm text-slate-500">Choose the most convenient way to get in touch with us.</p>
          </motion.div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {reachCards.map(({ icon: Icon, title, desc, email }, i) => (
              <motion.div
                key={title}
                {...fade(i * 0.08)}
                className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[#ef4444] to-[#DC2626] shadow-lg shadow-red-500/25">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{title}</h3>
                <p className="mb-4 text-[13px] leading-relaxed text-slate-500">{desc}</p>
                <a href={`mailto:${email}`} className="mt-auto text-sm font-semibold text-[#DC2626] hover:underline">
                  {email}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Satisfaction ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fdf5f5] via-[#faf7f8] to-[#f7f4f5] py-16 lg:py-20">
        <div className="container relative mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fade(0)}>
              <SatisfactionIllustration />
            </motion.div>
            <motion.div {...fade(0.12)}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#DC2626] shadow-sm">
                <Headphones className="h-3.5 w-3.5" />
                We Are Here to Help
              </div>
              <h2 className="mb-5 font-serif text-4xl font-bold leading-tight text-slate-900">
                Your Satisfaction
                <br />
                Is <span className="text-[#DC2626]">Our Priority</span>
              </h2>
              <p className="mb-7 max-w-md text-[15px] leading-relaxed text-slate-600">
                At <span className="font-semibold">Luxor PDF</span>, we are committed to providing you with the best
                possible experience. Whether you need help with our products, have a suggestion, or just want to say
                hello, we're here for you.
              </p>
              <ul className="space-y-3">
                {satisfactionPoints.map(point => (
                  <li key={point} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Check className="h-3 w-3 text-[#DC2626]" strokeWidth={3} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto max-w-3xl px-6">
          <motion.div {...fade()} className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-slate-500">Quick answers to common questions.</p>
          </motion.div>

          <motion.div {...fade(0.08)} className="space-y-3">
            {faqs.map(({ q, a }, i) => {
              const open = openFaq === i;
              return (
                <div key={q} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                      <Headphones className="h-3.5 w-3.5 text-[#DC2626]" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-800">{q}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400">
                      {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pl-16 text-[13px] leading-relaxed text-slate-500">{a}</div>
                  )}
                </div>
              );
            })}
          </motion.div>

          <motion.p {...fade(0.14)} className="mt-8 text-center text-sm text-slate-500">
            Can't find what you're looking for?{" "}
            <a href="mailto:support@luxorpdf.com" className="font-semibold text-[#DC2626] hover:underline">
              Send us an email
            </a>{" "}
            and we'll be happy to help.
          </motion.p>
        </div>
      </section>

      {/* ── Email banner ── */}
      <section className="bg-white pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            {...fade()}
            className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-r from-[#fdf4f4] via-[#fbf6f6] to-[#f9f2f2] px-8 py-10 sm:px-12"
          >
            {/* right-side doc illustration */}
            <div className="pointer-events-none absolute bottom-0 right-6 hidden items-end md:flex" aria-hidden="true">
              <LeafCluster className="w-24 opacity-80" tone="blush" />
              <svg viewBox="0 0 90 110" className="-ml-6 mb-2 w-20" fill="none">
                <path d="M8 14 C8 8 12.5 4 18 4 H58 L82 28 V96 C82 102 77.5 106 72 106 H18 C12.5 106 8 102 8 96 Z" fill="#ffffff" stroke="#f0dede" />
                <path d="M58 4 L82 28 H66 C61.6 28 58 24.4 58 20 Z" fill="#f5caca" />
                <rect x="18" y="34" width="34" height="16" rx="5" fill="#DC2626" />
                <text x="35" y="46" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="9" fill="#ffffff">PDF</text>
                <rect x="18" y="60" width="46" height="5" rx="2.5" fill="#f2d7d7" />
                <rect x="18" y="72" width="40" height="5" rx="2.5" fill="#f7e3e3" />
                <rect x="18" y="84" width="46" height="5" rx="2.5" fill="#f2d7d7" />
              </svg>
            </div>

            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ef4444] to-[#DC2626] shadow-lg shadow-red-500/30">
                <Mail className="h-7 w-7 text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#DC2626]/70">
                  Still Have Questions?
                </div>
                <h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
                  We're Just an Email Away
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  Email us at
                  <a
                    href="mailto:support@luxorpdf.com"
                    className="rounded-full border border-red-100 bg-white px-4 py-1.5 text-sm font-semibold text-[#DC2626] shadow-sm hover:underline"
                  >
                    support@luxorpdf.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </ProductPageLayout>
  );
}
