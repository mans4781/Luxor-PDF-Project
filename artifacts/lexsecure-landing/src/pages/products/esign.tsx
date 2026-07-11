import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import { FileSignature, ShieldCheck, Mail, Clock, Users, BarChart3, Globe } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: ShieldCheck, title: "Legally Binding",         desc: "Signatures meet eIDAS, ESIGN Act, and UETA standards — fully admissible in courts across 40+ countries." },
  { icon: Mail,        title: "Email Workflow",          desc: "Send documents for signature directly from the app. Recipients get a secure link — no account required." },
  { icon: Clock,       title: "Signature Audit Trail",   desc: "Every signing action is timestamped with IP, device, and identity data sealed inside the PDF." },
  { icon: Users,       title: "Multi-party Signing",     desc: "Define signing order and roles — signer, approver, witness. Route documents through complex approval chains." },
  { icon: BarChart3,   title: "Status Dashboard",        desc: "Track which recipients have signed, viewed, or declined. Send automated reminders with one click." },
  { icon: Globe,       title: "Any Device, Anywhere",    desc: "Recipients can sign on desktop or mobile without installing anything. Touch-friendly signature pad included." },
];

const steps = [
  { n: "1", title: "Upload your document", desc: "Drag in any PDF contract, agreement, or form." },
  { n: "2", title: "Place signature fields", desc: "Drag signature, initials, date, and text fields onto the page." },
  { n: "3", title: "Send & track", desc: "Add recipient emails and hit Send. Watch signatures come in live." },
  { n: "4", title: "Download sealed PDF", desc: "Get a legally certified PDF with the full audit trail embedded." },
];

function ESignMockup() {
  return (
    <svg viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      <rect width="520" height="340" rx="12" fill="#022c22" />
      <rect x="0" y="0" width="520" height="36" rx="12" fill="#014737" />
      <circle cx="18" cy="18" r="5" fill="#ef4444" />
      <circle cx="34" cy="18" r="5" fill="#f59e0b" />
      <circle cx="50" cy="18" r="5" fill="#22c55e" />
      {/* Top bar */}
      <rect x="0" y="36" width="520" height="32" fill="#065f46" />
      <rect x="10" y="44" width="80" height="16" rx="4" fill="#059669" />
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">+ Send for Sign</text>
      <rect x="300" y="44" width="60" height="16" rx="4" fill="#064e3b" />
      <rect x="368" y="44" width="60" height="16" rx="4" fill="#064e3b" />
      {/* Doc list sidebar */}
      <rect x="0" y="68" width="140" height="272" fill="#014737" />
      <text x="10" y="84" fill="#6ee7b7" fontSize="8" fontWeight="bold">DOCUMENTS</text>
      {[
        { name: "NDA_2024.pdf",      status: "Signed",  color: "#059669" },
        { name: "Contract_v2.pdf",   status: "Pending", color: "#d97706" },
        { name: "Invoice_007.pdf",   status: "Pending", color: "#d97706" },
        { name: "Agreement.pdf",     status: "Viewed",  color: "#0284c7" },
      ].map((doc, i) => (
        <g key={doc.name}>
          <rect x="8" y={90 + i * 54} width="124" height="46" rx="4" fill={i === 0 ? "#065f46" : "#022c22"} />
          <text x="16" y={106 + i * 54} fill="#d1fae5" fontSize="8" fontWeight="bold">{doc.name}</text>
          <rect x="16" y={110 + i * 54} width="50" height="12" rx="3" fill={doc.color + "33"} />
          <text x="41" y={120 + i * 54} textAnchor="middle" fill={doc.color} fontSize="7">{doc.status}</text>
        </g>
      ))}
      {/* Main document view */}
      <rect x="140" y="68" width="240" height="272" fill="white" />
      <rect x="160" y="86" width="160" height="12" rx="2" fill="#064e3b" />
      <rect x="160" y="104" width="200" height="4" rx="1" fill="#e2e8f0" />
      <rect x="160" y="111" width="185" height="4" rx="1" fill="#e2e8f0" />
      <rect x="160" y="118" width="195" height="4" rx="1" fill="#e2e8f0" />
      <rect x="160" y="135" width="200" height="4" rx="1" fill="#e2e8f0" />
      <rect x="160" y="142" width="170" height="4" rx="1" fill="#e2e8f0" />
      {/* Signature field */}
      <rect x="160" y="162" width="120" height="40" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="172" y="179" fill="#059669" fontSize="8">Signature</text>
      {/* Signature SVG path */}
      <path d="M168 192 Q178 182 190 188 Q202 194 215 186 Q222 182 228 188" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="160" y="212" width="80" height="20" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="1" strokeDasharray="3 2" />
      <text x="172" y="226" fill="#059669" fontSize="8">Date</text>
      {/* Checkmark seal */}
      <circle cx="300" cy="190" r="22" fill="#059669" opacity="0.1" />
      <circle cx="300" cy="190" r="16" fill="#059669" opacity="0.15" />
      <text x="300" y="196" textAnchor="middle" fill="#059669" fontSize="14" fontWeight="bold">✓</text>
      <rect x="160" y="245" width="200" height="4" rx="1" fill="#e2e8f0" />
      <rect x="160" y="252" width="180" height="4" rx="1" fill="#e2e8f0" />
      {/* Right panel */}
      <rect x="380" y="68" width="140" height="272" fill="#014737" />
      <text x="390" y="84" fill="#6ee7b7" fontSize="8" fontWeight="bold">RECIPIENTS</text>
      {[
        { name: "Alice Wong", role: "Signer", done: true },
        { name: "Bob Chen",   role: "Approver", done: false },
        { name: "Carol Diaz", role: "Witness", done: false },
      ].map((r, i) => (
        <g key={r.name}>
          <rect x="388" y={90 + i * 64} width="120" height="54" rx="4" fill="#022c22" />
          <circle cx="404" cy={108 + i * 64} r="8" fill={r.done ? "#059669" : "#064e3b"} />
          <text x="404" y={112 + i * 64} textAnchor="middle" fill="white" fontSize="8">{r.name[0]}</text>
          <text x="418" y={106 + i * 64} fill="#d1fae5" fontSize="8" fontWeight="bold">{r.name}</text>
          <text x="418" y={116 + i * 64} fill="#6ee7b7" fontSize="7">{r.role}</text>
          <rect x="418" y={122 + i * 64} width="48" height="10" rx="3" fill={r.done ? "#059669" : "#d97706"} opacity="0.3" />
          <text x="442" y={131 + i * 64} textAnchor="middle" fill={r.done ? "#059669" : "#d97706"} fontSize="7">{r.done ? "Signed" : "Waiting"}</text>
        </g>
      ))}
    </svg>
  );
}

export default function ESignPage() {
  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-green-900 text-white py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 text-emerald-300 text-sm font-medium mb-6">
                <FileSignature className="w-4 h-4" strokeWidth={1.75} />
                Luxor eSign
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
                Collect signatures <span className="text-emerald-300">faster & legally</span>
              </h1>
              <p className="text-teal-200 text-lg leading-relaxed mb-8">
                Send contracts, NDAs, and agreements for legally binding e-signatures in seconds. Track who has signed, send reminders, and download certified PDFs — all from your desktop.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold cursor-default select-none">
                  <Clock className="w-4 h-4" strokeWidth={2} />
                  Coming soon
                </span>
                <a href="#how-it-works" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors">
                  How It Works
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <ESignMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-emerald-600 py-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[["eIDAS Compliant","EU legal standard"], ["40+ Countries","Global recognition"], ["Tamper-proof Seal","Cryptographic lock"], ["Instant Delivery","Signed in minutes"]].map(([val, lbl]) => (
              <div key={lbl}><p className="text-xl font-bold">{val}</p><p className="text-emerald-200 text-sm">{lbl}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Four steps to a signed document</h2>
            <p className="text-slate-500 max-w-xl mx-auto">No complex setup. Get your first document signed in under three minutes.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }, i) => (
              <div key={n} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  {n}
                </div>
                {i < 3 && <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-emerald-200" />}
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-slate-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Enterprise-grade, startup-friendly</h2>
            <p className="text-slate-500 max-w-xl mx-auto">All the compliance and audit features of enterprise solutions — at a fraction of the cost.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-900 to-teal-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Stop chasing signatures by email</h2>
          <p className="text-emerald-200 mb-8 max-w-md mx-auto">Luxor eSign is launching soon. We're putting the finishing touches on it — check back shortly.</p>
          <span className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 font-bold cursor-default select-none">
            <Clock className="w-4 h-4" strokeWidth={2} />
            Coming soon
          </span>
        </div>
      </section>
    </ProductPageLayout>
  );
}
