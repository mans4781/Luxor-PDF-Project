import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import { Lock, Shield, Eye, Clock, Key, FileX, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Key,           title: "256-bit AES Encryption",   desc: "Industry-standard AES-256 encryption locks your PDF. Only recipients with the correct password can open it." },
  { icon: Clock,         title: "Automatic Expiry Dates",   desc: "Set a date after which the PDF automatically becomes unreadable — perfect for time-limited access control." },
  { icon: Eye,           title: "Redaction",                desc: "Permanently burn out sensitive text and images. No hidden layers — the data is truly gone, not just hidden." },
  { icon: Shield,        title: "Permission Controls",      desc: "Prevent printing, copying, editing, and screen-capture independently. Enforce exactly what recipients can do." },
  { icon: FileX,         title: "Remote Revoke",            desc: "Revoke access to a distributed PDF at any time — even after the recipient has it on their device." },
  { icon: AlertTriangle, title: "Watermarking",             desc: "Burn dynamic watermarks (name, date, email) into every page to trace leaks and deter unauthorised sharing." },
];

function SecurityMockup() {
  return (
    <svg viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      <rect width="520" height="340" rx="12" fill="#1c0a09" />
      <rect x="0" y="0" width="520" height="36" rx="12" fill="#450a0a" />
      <circle cx="18" cy="18" r="5" fill="#ef4444" />
      <circle cx="34" cy="18" r="5" fill="#f59e0b" />
      <circle cx="50" cy="18" r="5" fill="#22c55e" />
      {/* Toolbar */}
      <rect x="0" y="36" width="520" height="32" fill="#7f1d1d" />
      <rect x="10" y="44" width="96" height="16" rx="4" fill="#b91c1c" />
      <text x="58" y="55" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">🔒 Protect Document</text>
      <rect x="115" y="47" width="80" height="10" rx="2" fill="#991b1b" opacity="0.6" />
      <rect x="204" y="47" width="60" height="10" rx="2" fill="#991b1b" opacity="0.6" />
      {/* Left panel - settings */}
      <rect x="0" y="68" width="150" height="272" fill="#450a0a" />
      <text x="10" y="84" fill="#fca5a5" fontSize="8" fontWeight="bold">PROTECTION</text>
      {/* Password section */}
      <rect x="8" y="90" width="134" height="60" rx="4" fill="#7f1d1d" />
      <text x="16" y="104" fill="#fca5a5" fontSize="8" fontWeight="bold">Password</text>
      <rect x="16" y="108" width="118" height="14" rx="3" fill="#1c0a09" />
      <text x="22" y="119" fill="#ef4444" fontSize="8">••••••••••••</text>
      <rect x="16" y="126" width="118" height="14" rx="3" fill="#1c0a09" />
      <text x="22" y="137" fill="#6b7280" fontSize="8">Confirm password</text>
      {/* Expiry section */}
      <rect x="8" y="156" width="134" height="50" rx="4" fill="#7f1d1d" />
      <text x="16" y="170" fill="#fca5a5" fontSize="8" fontWeight="bold">Expiry Date</text>
      <rect x="16" y="174" width="118" height="24" rx="3" fill="#1c0a09" />
      <text x="22" y="190" fill="#ef4444" fontSize="8">31 Dec 2024 · 23:59</text>
      {/* Permissions */}
      <rect x="8" y="212" width="134" height="90" rx="4" fill="#7f1d1d" />
      <text x="16" y="226" fill="#fca5a5" fontSize="8" fontWeight="bold">PERMISSIONS</text>
      {[["Printing","off"],["Copying","off"],["Editing","off"],["Screenshots","off"]].map(([lbl, val], i) => (
        <g key={lbl}>
          <text x="16" y={238 + i * 17} fill="#d1d5db" fontSize="8">{lbl}</text>
          <rect x="114" y={229 + i * 17} width="22" height="11" rx="5.5" fill="#991b1b" />
          <circle cx="118" cy={234 + i * 17} r="4" fill="#6b7280" />
        </g>
      ))}
      {/* Main PDF view */}
      <rect x="150" y="68" width="270" height="272" fill="white" />
      {/* Watermark */}
      <text x="285" y="210" textAnchor="middle" fill="#ef4444" fontSize="32" fontWeight="bold" opacity="0.08" transform="rotate(-35, 285, 210)">CONFIDENTIAL</text>
      {/* Content */}
      <rect x="170" y="86" width="180" height="12" rx="2" fill="#1c0a09" />
      <rect x="170" y="104" width="225" height="4" rx="1" fill="#e2e8f0" />
      <rect x="170" y="111" width="210" height="4" rx="1" fill="#e2e8f0" />
      {/* Redacted block */}
      <rect x="170" y="125" width="225" height="14" rx="2" fill="#1c0a09" />
      <text x="175" y="136" fill="#6b7280" fontSize="7">█████████████ Redacted Content █████████████</text>
      <rect x="170" y="145" width="200" height="4" rx="1" fill="#e2e8f0" />
      <rect x="170" y="152" width="215" height="4" rx="1" fill="#e2e8f0" />
      <rect x="170" y="159" width="190" height="4" rx="1" fill="#e2e8f0" />
      {/* Expiry badge */}
      <rect x="170" y="173" width="225" height="36" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1" />
      <text x="182" y="187" fill="#b91c1c" fontSize="9" fontWeight="bold">⏰  Expires: 31 December 2024</text>
      <text x="182" y="200" fill="#6b7280" fontSize="8">This document will be inaccessible after the expiry date</text>
      <rect x="170" y="218" width="225" height="4" rx="1" fill="#e2e8f0" />
      <rect x="170" y="226" width="200" height="4" rx="1" fill="#e2e8f0" />
      <rect x="170" y="234" width="218" height="4" rx="1" fill="#e2e8f0" />
      {/* Lock icon bottom right */}
      <circle cx="370" cy="300" r="18" fill="#b91c1c" opacity="0.1" />
      <text x="370" y="306" textAnchor="middle" fill="#b91c1c" fontSize="16">🔒</text>
      {/* Right info panel */}
      <rect x="420" y="68" width="100" height="272" fill="#450a0a" />
      <text x="430" y="84" fill="#fca5a5" fontSize="8" fontWeight="bold">STATUS</text>
      <rect x="428" y="90" width="82" height="22" rx="4" fill="#166534" />
      <text x="469" y="105" textAnchor="middle" fill="#bbf7d0" fontSize="8" fontWeight="bold">✓ Protected</text>
      <rect x="428" y="118" width="82" height="22" rx="4" fill="#7f1d1d" />
      <text x="469" y="133" textAnchor="middle" fill="#fca5a5" fontSize="8">Expires in 60d</text>
      <text x="430" y="158" fill="#fca5a5" fontSize="8" fontWeight="bold">ENCRYPTION</text>
      <rect x="428" y="163" width="82" height="18" rx="3" fill="#7f1d1d" />
      <text x="469" y="176" textAnchor="middle" fill="#fca5a5" fontSize="8">AES-256</text>
      <text x="430" y="200" fill="#fca5a5" fontSize="8" fontWeight="bold">REVOKE</text>
      <rect x="428" y="206" width="82" height="26" rx="4" fill="#b91c1c" />
      <text x="469" y="223" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Revoke Access</text>
    </svg>
  );
}

export default function PdfSecurityPage() {
  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-red-900 to-orange-900 text-white py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border border-rose-400/30 rounded-full px-4 py-1.5 text-rose-300 text-sm font-medium mb-6">
                <Lock className="w-4 h-4" strokeWidth={2.5} />
                Luxor PDF Security
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
                Control your PDFs <span className="text-rose-300">even after sharing</span>
              </h1>
              <p className="text-red-200 text-lg leading-relaxed mb-8">
                Encrypt, redact, watermark, and set expiry dates on any PDF. Revoke access remotely. Enforce strict permissions. Your confidential documents stay confidential — always.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#download" className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-colors shadow-lg shadow-rose-500/30">
                  Protect a Document Free
                </a>
                <a href="#features" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors">
                  See All Features
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <SecurityMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-rose-700 py-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[["AES-256","Military-grade encryption"], ["Remote Revoke","Instant access cut-off"], ["Zero Trace","True data removal"], ["GDPR Ready","Compliance built in"]].map(([val, lbl]) => (
              <div key={lbl}><p className="text-xl font-bold">{val}</p><p className="text-rose-200 text-sm">{lbl}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Complete document control</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every protection feature a legal or compliance team could need — packaged in a simple, fast desktop app.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-rose-600" strokeWidth={2.5} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-10 text-center">Who relies on Luxor PDF Security</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "Legal Teams",        use: "Share client contracts with time-limited access and automatic expiry after case closure." },
              { role: "HR Departments",     use: "Distribute sensitive offer letters and policy documents that can be revoked if not returned." },
              { role: "Finance & Audit",    use: "Redact PII from financial statements before external review. Prevent screenshot capture." },
              { role: "Research & IP",      use: "Watermark confidential R&D documents to trace leaks and protect intellectual property." },
            ].map(({ role, use }) => (
              <div key={role} className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-rose-600" strokeWidth={2.5} />
                  <h3 className="font-semibold text-rose-800 text-sm">{role}</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-6">
          <p className="text-center text-slate-400 text-sm mb-6 uppercase tracking-wider font-medium">Standards & Compliance</p>
          <div className="flex flex-wrap justify-center gap-6">
            {["GDPR", "HIPAA Ready", "ISO 27001", "PDF/A Archival", "SOC 2 Ready", "FIPS 140-2"].map(b => (
              <div key={b} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium text-slate-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-rose-900 to-red-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Your documents. Your rules.</h2>
          <p className="text-rose-200 mb-8 max-w-md mx-auto">Start protecting PDFs in under 60 seconds. Works offline — your files never leave your machine.</p>
          <a href="#download" className="inline-block px-8 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold transition-colors shadow-xl shadow-rose-500/30">
            Download Luxor PDF Security
          </a>
        </div>
      </section>
    </ProductPageLayout>
  );
}
