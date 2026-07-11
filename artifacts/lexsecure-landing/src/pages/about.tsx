import { motion } from "framer-motion";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  Target, Eye, Heart, Zap, Users, Globe, Award,
  Lock, Lightbulb, Handshake
} from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

/* ─── Inline SVG Illustrations ─── */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background circles */}
      <circle cx="240" cy="190" r="170" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="240" cy="190" r="130" stroke="white" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="240" cy="190" r="90"  stroke="white" strokeOpacity="0.12" strokeWidth="1" />

      {/* Floating document cards */}
      <rect x="60"  y="80"  width="100" height="130" rx="10" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" />
      <rect x="72"  y="100" width="76"  height="8"   rx="3"  fill="white" fillOpacity="0.5" />
      <rect x="72"  y="116" width="56"  height="6"   rx="3"  fill="white" fillOpacity="0.3" />
      <rect x="72"  y="130" width="64"  height="6"   rx="3"  fill="white" fillOpacity="0.3" />
      <rect x="72"  y="144" width="48"  height="6"   rx="3"  fill="white" fillOpacity="0.3" />
      <rect x="72"  y="164" width="30"  height="22"  rx="5"  fill="white" fillOpacity="0.2" />
      <rect x="108" y="164" width="30"  height="22"  rx="5"  fill="#a78bfa" fillOpacity="0.7" />

      {/* Center shield */}
      <path d="M240 100 L300 126 L300 186 C300 222 272 250 240 264 C208 250 180 222 180 186 L180 126 Z"
        fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M240 116 L288 138 L288 186 C288 214 266 238 240 250 C214 238 192 214 192 186 L192 138 Z"
        fill="white" fillOpacity="0.08" />
      {/* Lock inside shield */}
      <rect x="225" y="183" width="30" height="22" rx="4" fill="white" fillOpacity="0.9" />
      <path d="M231 183 L231 175 C231 168 249 168 249 175 L249 183" stroke="white" strokeOpacity="0.9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="240" cy="194" r="3.5" fill="#6d28d9" />

      {/* Right doc card */}
      <rect x="320" y="110" width="100" height="130" rx="10" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" />
      <rect x="332" y="130" width="76"  height="8"   rx="3"  fill="white" fillOpacity="0.5" />
      <rect x="332" y="146" width="56"  height="6"   rx="3"  fill="white" fillOpacity="0.3" />
      <rect x="332" y="160" width="64"  height="6"   rx="3"  fill="white" fillOpacity="0.3" />
      <circle cx="360" cy="196" r="12" fill="#fbbf24" fillOpacity="0.7" />
      <path d="M356 196 L359 199 L364 193" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Floating pills */}
      <rect x="150" y="270" width="80"  height="26" rx="13" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.3" />
      <text x="190" y="287" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">AES-256</text>

      {/* Dots */}
      <circle cx="100" cy="290" r="5" fill="white" fillOpacity="0.25" />
      <circle cx="390" cy="80"  r="4" fill="white" fillOpacity="0.2" />
      <circle cx="60"  cy="240" r="3" fill="#a78bfa" fillOpacity="0.5" />
      <circle cx="420" cy="290" r="6" fill="#fbbf24" fillOpacity="0.3" />
    </svg>
  );
}

function MissionGraphic() {
  return (
    <svg viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="160" cy="140" r="100" stroke="#6d28d9" strokeOpacity="0.15" strokeWidth="1.5" />
      <circle cx="160" cy="140" r="70"  stroke="#6d28d9" strokeOpacity="0.2"  strokeWidth="1.5" />
      <circle cx="160" cy="140" r="40"  fill="#6d28d9" fillOpacity="0.1" stroke="#6d28d9" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="160" cy="140" r="18"  fill="#6d28d9" fillOpacity="0.85" />
      <path d="M153 140 L158 145 L168 133" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Orbiting dots */}
      <circle cx="160" cy="40"  r="7" fill="#f59e0b" />
      <circle cx="260" cy="140" r="7" fill="#10b981" />
      <circle cx="160" cy="240" r="7" fill="#3b82f6" />
      <circle cx="60"  cy="140" r="7" fill="#f43f5e" />
      {/* Lines from center */}
      <line x1="160" y1="122" x2="160" y2="47"  stroke="#6d28d9" strokeOpacity="0.2" strokeDasharray="4 3" />
      <line x1="178" y1="140" x2="253" y2="140" stroke="#6d28d9" strokeOpacity="0.2" strokeDasharray="4 3" />
      <line x1="160" y1="158" x2="160" y2="233" stroke="#6d28d9" strokeOpacity="0.2" strokeDasharray="4 3" />
      <line x1="142" y1="140" x2="67"  y2="140" stroke="#6d28d9" strokeOpacity="0.2" strokeDasharray="4 3" />
    </svg>
  );
}

/* ─── Data ─── */

const stats = [
  { value: "50K+", label: "Active Users", color: "text-white" },
  { value: "120+", label: "Countries",    color: "text-white" },
  { value: "4.9★", label: "App Rating",   color: "text-white" },
  { value: "99.9%", label: "Uptime SLA",  color: "text-white" },
];

const values = [
  { icon: Lock,       title: "Privacy First",      color: "bg-violet-50 text-violet-600",  desc: "We believe your documents are yours alone. Every line of code we write starts with that principle." },
  { icon: Zap,        title: "Speed & Simplicity",  color: "bg-amber-50  text-amber-600",   desc: "Powerful tools should feel effortless. We obsess over performance so you never wait on your PDF software." },
  { icon: Lightbulb,  title: "Constant Innovation", color: "bg-sky-50    text-sky-600",     desc: "The PDF landscape evolves. We ship meaningful updates every month, driven by real user feedback." },
  { icon: Handshake,  title: "Transparent Trust",   color: "bg-emerald-50 text-emerald-600",desc: "No dark patterns, no hidden fees, no telemetry. What you see is exactly what you get." },
  { icon: Globe,      title: "Built for Everyone",  color: "bg-rose-50   text-rose-600",    desc: "From solo freelancers to Fortune 500 legal teams — our tools adapt to you, not the other way around." },
  { icon: Heart,      title: "People Over Profit",  color: "bg-pink-50   text-pink-600",    desc: "We're a small team that genuinely cares about the people using our products. Your satisfaction is our metric." },
];

const timeline = [
  { year: "2020", title: "The Idea",         color: "bg-violet-600", desc: "Aryan and Sara meet at a legal-tech conference and bond over a shared frustration: no PDF tool respected user privacy while being genuinely powerful." },
  { year: "2021", title: "First Build",      color: "bg-indigo-600", desc: "Six months in a garage (literally). The first version of Luxor PDF launches as a Windows desktop app with basic encryption and expiry dates." },
  { year: "2022", title: "Public Launch",    color: "bg-sky-600",    desc: "Beta opens to the public. 5,000 sign-ups in week one. The team grows to 8 people and moves into a proper office." },
  { year: "2023", title: "eSign & Mobile",   color: "bg-emerald-600",desc: "Luxor eSign ships alongside the Android app. The platform crosses 20,000 active users. Series A funding secured." },
  { year: "2024", title: "Enterprise Tier",  color: "bg-amber-500",  desc: "Enterprise plan launches with API access, dedicated support, and unlimited team collaboration. Fortune 500 clients onboard." },
  { year: "2025", title: "50K & Beyond",     color: "bg-rose-500",   desc: "Luxor PDF reaches 50,000 users across 120+ countries. Roadmap includes AI-assisted redaction and browser extension." },
];

/* ─── Page ─── */

export default function AboutPage() {
  return (
    <ProductPageLayout>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0   left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fade(0)}>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Users className="w-3.5 h-3.5 text-violet-300" />
                Meet the team behind Luxor PDF
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-5 text-white">
                We're on a mission to make{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                  PDF privacy
                </span>{" "}
                effortless
              </h1>
              <p className="text-indigo-200 text-lg leading-relaxed mb-8">
                Luxor PDF was born from a simple belief: the tools professionals rely on every day should respect their privacy, protect their clients, and just <em>work</em>.
                We're a team of engineers, designers, and security experts who are obsessed with making that a reality.
              </p>
              <div className="flex flex-wrap gap-6">
                {stats.map(({ value, label, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-white/60 text-sm mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div {...fade(0.15)} className="flex items-center justify-center">
              <div className="w-full max-w-sm aspect-square">
                <HeroIllustration />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div {...fade()} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">Our Story</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-4 mb-3">Our journey</h2>
            <p className="text-slate-500 text-lg">A timeline of how Luxor PDF grew from a weekend hack into a platform trusted by 50,000+ professionals.</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-indigo-200 to-rose-200" />

            <div className="space-y-10">
              {timeline.map(({ year, title, color, desc }, i) => (
                <motion.div key={year} {...fade(i * 0.08)} className="flex gap-6 items-start">
                  <div className="relative z-10 shrink-0">
                    <div className={`w-16 h-16 ${color} rounded-2xl flex flex-col items-center justify-center text-white shadow-lg`}>
                      <span className="text-xs font-bold opacity-70">{year}</span>
                      <span className="text-xl">✦</span>
                    </div>
                  </div>
                  <div className="pt-2 pb-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div {...fade()} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">Purpose</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-4 mb-3">Mission & Vision</h2>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Mission card */}
            <motion.div {...fade(0)} className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mission</h3>
              <p className="text-indigo-200 leading-relaxed">
                To give every professional total control over their documents — from creation to expiry — with privacy, security, and simplicity baked in from the ground up.
              </p>
            </motion.div>

            {/* Graphic */}
            <motion.div {...fade(0.1)} className="flex items-center justify-center py-4">
              <div className="w-64 h-64">
                <MissionGraphic />
              </div>
            </motion.div>

            {/* Vision card */}
            <motion.div {...fade(0.2)} className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 text-white shadow-xl shadow-amber-500/20">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Vision</h3>
              <p className="text-amber-100 leading-relaxed">
                A world where document workflows are fully private, enforceable, and seamless — where no lawyer, doctor, or entrepreneur ever has to worry about who can see their files.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fade()} className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">What Drives Us</span>
            <h2 className="text-4xl font-bold text-slate-800 mt-4 mb-3">Our Core Values</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Six principles that guide every decision — from product design to customer support.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {values.map(({ icon: Icon, title, color, desc }, i) => (
              <motion.div
                key={title}
                {...fade(i * 0.07)}
                className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Awards & Recognition ── */}
      <section className="py-14 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <motion.div {...fade()} className="flex flex-wrap justify-center gap-8 items-center">
            {[
              { icon: Award,    color: "text-amber-500",  bg: "bg-amber-50",   label: "Product Hunt",      sub: "#1 Product of the Day" },
              { icon: Users,    color: "text-rose-600",   bg: "bg-rose-50",    label: "50K+ Users",        sub: "120+ Countries" },
            ].map(({ icon: Icon, color, bg, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 text-white text-center">
        <div className="container mx-auto px-6">
          <motion.div {...fade()}>
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-rose-400" strokeWidth={2} />
            </div>
            <h2 className="text-4xl font-bold mb-4">Come build with us</h2>
            <p className="text-indigo-200 max-w-lg mx-auto text-lg mb-8">
              We're always hiring people who share our obsession with privacy, craft, and simplicity.
              And if you just want to try the product — we're here for that too.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#careers"
                className="px-8 py-3.5 rounded-2xl bg-white text-violet-700 font-bold hover:bg-indigo-50 transition-colors shadow-xl"
              >
                View Open Roles
              </a>
              <a
                href="#contact"
                className="px-8 py-3.5 rounded-2xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </ProductPageLayout>
  );
}
