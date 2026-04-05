import { useState } from "react";
import { motion } from "framer-motion";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  Mail, Phone, MapPin, Clock, Send, MessageSquare,
  Headphones, Building2, ChevronRight, CheckCircle2
} from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

/* ── Decorative SVG ── */
function ContactGraphic() {
  return (
    <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background rings */}
      <circle cx="200" cy="170" r="155" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="200" cy="170" r="115" stroke="white" strokeOpacity="0.09" strokeWidth="1" />
      <circle cx="200" cy="170" r="75"  stroke="white" strokeOpacity="0.13" strokeWidth="1" />

      {/* Main envelope */}
      <rect x="110" y="110" width="180" height="120" rx="12" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.35" strokeWidth="1.5"/>
      {/* Envelope flap */}
      <path d="M110 122 L200 175 L290 122" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      {/* Envelope lines */}
      <line x1="130" y1="190" x2="210" y2="190" stroke="white" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round"/>
      <line x1="130" y1="205" x2="190" y2="205" stroke="white" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>

      {/* Send arrow bubble */}
      <circle cx="268" cy="218" r="22" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
      <path d="M258 218 L274 218 M268 211 L275 218 L268 225" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Chat bubbles */}
      <rect x="48" y="80" width="90" height="52" rx="14" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      <path d="M62 132 L58 145 L74 132" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      <rect x="58" y="94" width="60" height="7" rx="3" fill="white" fillOpacity="0.4"/>
      <rect x="58" y="108" width="45" height="6" rx="3" fill="white" fillOpacity="0.25"/>

      <rect x="262" y="60" width="90" height="52" rx="14" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      <path d="M338 112 L342 125 L326 112" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>
      <rect x="272" y="74" width="60" height="7" rx="3" fill="white" fillOpacity="0.4"/>
      <rect x="272" y="88" width="42" height="6" rx="3" fill="white" fillOpacity="0.25"/>

      {/* Floating contact pills */}
      <rect x="55"  y="230" width="78" height="26" rx="13" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.3"/>
      <text x="94" y="247" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600">📧 Email</text>
      <rect x="150" y="265" width="100" height="26" rx="13" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.3"/>
      <text x="200" y="282" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600">💬 Live Chat</text>
      <rect x="268" y="240" width="78" height="26" rx="13" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.3"/>
      <text x="307" y="257" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600">📞 Phone</text>

      {/* Dots */}
      <circle cx="70"  cy="60"  r="5" fill="white" fillOpacity="0.25"/>
      <circle cx="340" cy="185" r="4" fill="white" fillOpacity="0.2"/>
      <circle cx="50"  cy="185" r="3" fill="#a78bfa" fillOpacity="0.6"/>
      <circle cx="355" cy="295" r="6" fill="#fbbf24" fillOpacity="0.3"/>
    </svg>
  );
}

/* ── Data ── */
const channels = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "For general questions, billing, and account issues.",
    contact: "support@luxorpdf.com",
    badge: "Replies within 24 hrs",
    badgeColor: "bg-sky-100 text-sky-700",
    gradient: "from-sky-500 to-blue-600",
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    desc: "For Professional & Enterprise plan holders.",
    contact: "priority@luxorpdf.com",
    badge: "Replies within 4 hrs",
    badgeColor: "bg-violet-100 text-violet-700",
    gradient: "from-violet-600 to-indigo-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: Building2,
    title: "Sales & Enterprise",
    desc: "Custom plans, volume licensing, and demos.",
    contact: "sales@luxorpdf.com",
    badge: "Same-day response",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const info = [
  { icon: MapPin, label: "Office", value: "12 Holborn Viaduct, London, EC1A 2BN, United Kingdom" },
  { icon: Phone,  label: "Phone", value: "+44 20 7946 0321" },
  { icon: Clock,  label: "Hours", value: "Mon–Fri 9 AM – 6 PM GMT · Emergency support 24 / 7 (Enterprise)" },
  { icon: Mail,   label: "General", value: "hello@luxorpdf.com" },
];

const topics = [
  "General enquiry",
  "Sales & pricing",
  "Technical support",
  "Bug report",
  "Feature request",
  "Partnership",
  "Press & media",
  "Other",
];

type FormState = "idle" | "sending" | "sent";

/* ── Component ── */
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", topic: "", message: "" });
  const [status, setStatus] = useState<FormState>("idle");

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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0    left-1/4  w-[480px] h-[480px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[380px] h-[380px] bg-indigo-600/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="cg" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#cg)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fade(0)}>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <MessageSquare className="w-3.5 h-3.5 text-violet-300" />
                We're here to help
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-5">
                Get in touch with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                  Luxor PDF
                </span>
              </h1>
              <p className="text-indigo-200 text-lg leading-relaxed mb-8">
                Whether you have a question about features, pricing, need a demo, or just want to say hello — our team is ready and happy to help.
              </p>
              <div className="flex flex-col gap-3">
                {info.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-violet-300" />
                    </div>
                    <div>
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">{label}</span>
                      <p className="text-white/85 text-sm leading-snug">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fade(0.15)} className="flex items-center justify-center">
              <div className="w-full max-w-sm aspect-[4/3.4]">
                <ContactGraphic />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact Channels ── */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div {...fade()} className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">Get Help Fast</span>
            <h2 className="text-3xl font-bold text-slate-800 mt-4 mb-2">Choose your channel</h2>
            <p className="text-slate-500">Pick the contact method that suits your need.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {channels.map(({ icon: Icon, title, desc, contact, badge, badgeColor, gradient, bg, iconColor }, i) => (
              <motion.div
                key={title}
                {...fade(i * 0.08)}
                className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  <p className="text-slate-500 text-sm mb-3">{desc}</p>
                  <a
                    href={`mailto:${contact}`}
                    className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                  >
                    {contact}
                    <ChevronRight className={`w-3.5 h-3.5 text-violet-600`} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form + Map ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">

            {/* Form */}
            <motion.div {...fade(0)}>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Send us a message</h2>
              <p className="text-slate-500 text-sm mb-8">Fill out the form and we'll get back to you within one business day.</p>

              {status === "sent" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-16 px-8 bg-emerald-50 rounded-3xl border border-emerald-100"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Message sent!</h3>
                  <p className="text-slate-500 text-sm max-w-xs">Thanks for reaching out. A member of our team will get back to you within 24 hours.</p>
                  <button
                    onClick={() => { setStatus("idle"); setForm({ name: "", email: "", company: "", topic: "", message: "" }); }}
                    className="mt-6 text-sm text-emerald-700 font-semibold hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full name <span className="text-rose-500">*</span></label>
                      <input
                        type="text" name="name" required value={form.name} onChange={handleChange}
                        placeholder="Jane Doe"
                        className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email address <span className="text-rose-500">*</span></label>
                      <input
                        type="email" name="email" required value={form.email} onChange={handleChange}
                        placeholder="you@company.com"
                        className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Company / Organisation</label>
                    <input
                      type="text" name="company" value={form.company} onChange={handleChange}
                      placeholder="Acme Legal Ltd. (optional)"
                      className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Topic <span className="text-rose-500">*</span></label>
                    <select
                      name="topic" required value={form.topic} onChange={handleChange}
                      className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-slate-50 text-slate-700 appearance-none"
                    >
                      <option value="" disabled>Select a topic…</option>
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Message <span className="text-rose-500">*</span></label>
                    <textarea
                      name="message" required value={form.message} onChange={handleChange}
                      rows={5}
                      placeholder="Tell us how we can help…"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all bg-slate-50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-70"
                  >
                    {status === "sending" ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    We respect your privacy. Your data is never sold or shared.
                  </p>
                </form>
              )}
            </motion.div>

            {/* Info sidebar */}
            <motion.div {...fade(0.12)} className="flex flex-col gap-6">
              {/* Map placeholder */}
              <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-gradient-to-br from-indigo-50 to-violet-50 relative" style={{ height: 240 }}>
                <svg viewBox="0 0 520 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  {/* Grid lines for map feel */}
                  {[0,40,80,120,160,200].map(y => (
                    <line key={`h${y}`} x1="0" y1={y} x2="520" y2={y} stroke="#e0e7ff" strokeWidth="1"/>
                  ))}
                  {[0,60,120,180,240,300,360,420,480].map(x => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#e0e7ff" strokeWidth="1"/>
                  ))}
                  {/* Roads */}
                  <path d="M0 120 Q130 100 260 120 Q390 140 520 120" stroke="#c7d2fe" strokeWidth="8" strokeLinecap="round"/>
                  <path d="M200 0 Q210 120 220 240" stroke="#c7d2fe" strokeWidth="6" strokeLinecap="round"/>
                  <path d="M0 60  Q200 70 520 50"  stroke="#e0e7ff" strokeWidth="4"/>
                  <path d="M0 180 Q220 185 520 170" stroke="#e0e7ff" strokeWidth="4"/>
                  {/* Blocks */}
                  <rect x="30"  y="70"  width="80" height="40" rx="6" fill="#ddd6fe" fillOpacity="0.6"/>
                  <rect x="310" y="50"  width="90" height="55" rx="6" fill="#ddd6fe" fillOpacity="0.5"/>
                  <rect x="60"  y="145" width="60" height="50" rx="6" fill="#ddd6fe" fillOpacity="0.5"/>
                  <rect x="340" y="145" width="100"height="60" rx="6" fill="#ddd6fe" fillOpacity="0.5"/>
                  {/* Pin */}
                  <circle cx="218" cy="118" r="18" fill="#6d28d9" fillOpacity="0.15"/>
                  <circle cx="218" cy="118" r="10" fill="#6d28d9"/>
                  <circle cx="218" cy="115" r="4"  fill="white"/>
                  <path d="M218 128 L218 138" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex items-end p-4 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-800">Luxor PDF HQ</p>
                    <p className="text-[10px] text-slate-500">12 Holborn Viaduct, London, EC1A 2BN</p>
                  </div>
                </div>
              </div>

              {/* Office hours */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600" /> Office Hours
                </h3>
                <div className="space-y-2">
                  {[
                    { days: "Monday – Friday", hours: "9:00 AM – 6:00 PM GMT", active: true },
                    { days: "Saturday",        hours: "10:00 AM – 2:00 PM GMT", active: true },
                    { days: "Sunday",          hours: "Closed", active: false },
                  ].map(({ days, hours, active }) => (
                    <div key={days} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 font-medium">{days}</span>
                      <span className={active ? "text-emerald-600 font-semibold" : "text-slate-400"}>{hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-500">Enterprise 24 / 7 emergency support always active</span>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white">
                <h3 className="font-bold mb-1">Follow us</h3>
                <p className="text-indigo-200 text-sm mb-4">Stay updated on new features, tips, and news.</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Twitter / X",  href: "#", emoji: "𝕏" },
                    { label: "LinkedIn",     href: "#", emoji: "in" },
                    { label: "YouTube",      href: "#", emoji: "▶" },
                    { label: "GitHub",       href: "#", emoji: "⌥" },
                  ].map(({ label, href, emoji }) => (
                    <a
                      key={label}
                      href={href}
                      className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      <span>{emoji}</span> {label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ Teaser ── */}
      <section className="py-14 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <motion.div {...fade()}>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Looking for quick answers?</h2>
            <p className="text-slate-500 text-sm mb-6">Check our live chatbot (bottom-right) or browse our common questions.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "How does PDF expiry work?",
                "Is there a free trial?",
                "What platforms are supported?",
                "How secure is my data?",
              ].map(q => (
                <span
                  key={q}
                  className="text-sm px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 font-medium shadow-sm"
                >
                  {q}
                </span>
              ))}
            </div>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
            >
              View Pricing & Plans <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

    </ProductPageLayout>
  );
}
