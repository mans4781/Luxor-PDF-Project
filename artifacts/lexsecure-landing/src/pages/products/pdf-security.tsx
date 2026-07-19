import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  Lock, Shield, Eye, Layers, Share2, Droplets, EyeOff, Printer,
  Scissors, Boxes, Link2, CheckCircle2, Upload, ShieldCheck,
  BarChart3, Zap, MousePointer2, Building2, FileLock2, Monitor,
  LayoutDashboard, FileText, Stamp, SlidersHorizontal, History,
  Settings, FolderLock, Download,
} from "lucide-react";
import { motion } from "framer-motion";
import secureHeroDashboard from "@/assets/secure-hero-dashboard.png";

const APP_URL = "/pdf-expiry/";
const SECURE_INSTALLER_URL = "/api/downloads/luxor-pdf-secure-latest.exe";

const BLUE = "#1d4ed8";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function WindowsGlyph({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <rect x="0" y="0" width="7.4" height="7.4" />
      <rect x="8.6" y="0" width="7.4" height="7.4" />
      <rect x="0" y="8.6" width="7.4" height="7.4" />
      <rect x="8.6" y="8.6" width="7.4" height="7.4" />
    </svg>
  );
}

function ShieldBadge({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 112" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      <path d="M48 4 L90 20 V56 C90 84 72 100 48 108 C24 100 6 84 6 56 V20 Z" fill="url(#shieldGrad)" />
      <path d="M48 12 L82 25 V56 C82 79 67 93 48 100 C29 93 14 79 14 56 V25 Z" fill="#2563eb" opacity="0.6" />
      <rect x="36" y="48" width="24" height="20" rx="4" fill="white" />
      <path d="M41 48 V42 a7 7 0 0 1 14 0 V48" stroke="white" strokeWidth="5" fill="none" />
      <circle cx="48" cy="57" r="3" fill={BLUE} />
      <rect x="46.5" y="58" width="3" height="6" rx="1.5" fill={BLUE} />
    </svg>
  );
}

/* === Hero dashboard mockup === */
function DashboardMockup() {
  const sideItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Lock, label: "Encrypt" },
    { icon: Droplets, label: "Watermark" },
    { icon: EyeOff, label: "Redact" },
    { icon: SlidersHorizontal, label: "Permissions" },
    { icon: Scissors, label: "Merge / Split" },
    { icon: Boxes, label: "Batch Process" },
    { icon: Share2, label: "Secure Share" },
    { icon: History, label: "History" },
    { icon: Settings, label: "Settings" },
  ];
  const docs = [
    { name: "Annual_Report_2024.pdf", meta: "2.4 MB · Encrypted", ok: true },
    { name: "Contract_Confidential.pdf", meta: "1.1 MB · Watermarked", ok: true },
    { name: "Employee_Records.pdf", meta: "3.6 MB · Protected", ok: true },
    { name: "Project_Proposal.pdf", meta: "1.8 MB · Permissions set", ok: true },
    { name: "Financial_Statement.pdf", meta: "2.7 MB · Protected", ok: true },
  ];
  const toggles = ["Password Protection", "Restrict Printing", "Restrict Copying", "Encrypt with AES-256"];
  return (
    <div className="rounded-2xl bg-white shadow-2xl border border-blue-100 overflow-hidden text-left">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e40af]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-[#1d4ed8]" strokeWidth={2.5} />
          </div>
          <span className="text-white text-xs font-bold">LUXOR PDF Secure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-300/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-blue-300/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-blue-300/60" />
        </div>
      </div>
      <div className="flex">
        <div className="w-[150px] shrink-0 bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] py-3 px-2 space-y-0.5">
          {sideItems.map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${active ? "bg-white text-[#1d4ed8]" : "text-blue-100"}`}>
              <Icon className="w-3 h-3 shrink-0" strokeWidth={2.4} />
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 bg-slate-50 p-4">
          <p className="text-[11px] font-bold text-slate-900">Dashboard</p>
          <p className="text-[8.5px] text-slate-500 mb-3">Welcome back! Your documents are secure.</p>
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            <div>
              <p className="text-[8.5px] font-bold text-slate-700 mb-1.5">Recent Documents</p>
              <div className="space-y-1.5">
                {docs.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-2 py-1.5">
                    <div className="w-5 h-6 rounded-sm bg-red-50 border border-red-200 flex items-center justify-center">
                      <span className="text-[5px] font-bold text-red-500">PDF</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-bold text-slate-800 truncate">{d.name}</p>
                      <p className="text-[6.5px] text-slate-400">{d.meta}</p>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[8.5px] font-bold text-slate-700 mb-1.5">Security Overview</p>
              <div className="bg-white rounded-lg border border-slate-100 p-3 flex flex-col items-center">
                <div className="w-14 h-16 mb-2">
                  <svg viewBox="0 0 96 112" className="w-full h-full">
                    <path d="M48 4 L90 20 V56 C90 84 72 100 48 108 C24 100 6 84 6 56 V20 Z" fill="#2563eb" />
                    <rect x="38" y="46" width="20" height="17" rx="3" fill="white" />
                    <path d="M42 46 V41 a6 6 0 0 1 12 0 V46" stroke="white" strokeWidth="4" fill="none" />
                  </svg>
                </div>
                <p className="text-[7.5px] font-bold text-emerald-600 mb-2 text-center">Your documents are protected</p>
                <div className="w-full space-y-1.5">
                  {toggles.map((t) => (
                    <div key={t} className="flex items-center justify-between">
                      <span className="text-[7px] text-slate-600 font-medium">{t}</span>
                      <span className="w-6 h-3 rounded-full bg-[#1d4ed8] relative">
                        <span className="absolute right-0.5 top-0.5 w-2 h-2 rounded-full bg-white" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === Encrypt panel mockup (showcase section) === */
function EncryptMockup() {
  const sideItems = ["Dashboard", "Encrypt", "Watermark", "Redact", "Permissions", "Merge / Split", "Batch Process", "Secure Share", "History", "Settings"];
  return (
    <div className="rounded-2xl bg-white shadow-2xl border border-blue-100 overflow-hidden text-left">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e40af]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
            <Shield className="w-3 h-3 text-[#1d4ed8]" strokeWidth={2.5} />
          </div>
          <span className="text-white text-[11px] font-bold">Encrypt PDF</span>
        </div>
        <span className="text-blue-200 text-xs leading-none">×</span>
      </div>
      <div className="flex">
        <div className="w-[110px] shrink-0 bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] py-3 px-2 space-y-0.5">
          {sideItems.map((label, i) => (
            <div key={label} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-semibold ${i === 1 ? "bg-white text-[#1d4ed8]" : "text-blue-100"}`}>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 bg-slate-50 p-4">
          <div className="grid grid-cols-[3fr_2fr] gap-3">
            <div>
              <p className="text-[9px] font-bold text-slate-800 mb-2">Security Settings</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[7px] font-bold text-slate-500 mb-0.5">Encryption Level</p>
                  <div className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[8px] font-semibold text-slate-800 flex items-center justify-between">
                    AES-256 (Recommended)
                    <span className="text-slate-400">▾</span>
                  </div>
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-500 mb-0.5">User Password</p>
                  <div className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[9px] font-bold text-slate-600 tracking-widest">••••••••••</div>
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-500 mb-0.5">Owner Password</p>
                  <div className="bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[9px] font-bold text-slate-600 tracking-widest">••••••••••</div>
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-500 mb-1">Permissions</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[["Allow Printing", true], ["Allow Copying", false], ["Allow Editing", false], ["Allow Content Extraction", false]].map(([label, on]) => (
                      <div key={label as string} className="flex items-center gap-1">
                        <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${on ? "bg-[#1d4ed8] border-[#1d4ed8]" : "bg-white border-slate-300"}`}>
                          {on ? <span className="text-white text-[6px] leading-none">✓</span> : null}
                        </span>
                        <span className="text-[6.5px] text-slate-600 font-medium">{label as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 mb-2 flex items-center gap-2">
                <div className="w-6 h-7 rounded-sm bg-red-50 border border-red-200 flex items-center justify-center">
                  <span className="text-[5.5px] font-bold text-red-500">PDF</span>
                </div>
                <div>
                  <p className="text-[7.5px] font-bold text-slate-800">Annual_Report_2024.pdf</p>
                  <p className="text-[6.5px] text-slate-400">2.4 MB · 32 pages</p>
                </div>
              </div>
              <p className="text-[7px] font-bold text-slate-500 mb-1">Security Status</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-3">
                <p className="text-[8px] font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Strong Protection
                </p>
                <p className="text-[6.5px] text-emerald-600">AES-256 encryption applied</p>
              </div>
              <div className="mt-auto bg-[#1d4ed8] rounded-lg py-2 text-center">
                <span className="text-white text-[8.5px] font-bold inline-flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Encrypt &amp; Save
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === Content data === */
const benefitCards = [
  { icon: Lock, title: "AES Encryption", desc: "Bank-level AES-256 encryption to protect your sensitive PDFs." },
  { icon: Layers, title: "Batch Protection", desc: "Secure multiple PDF files at once and save valuable time." },
  { icon: SlidersHorizontal, title: "Permission Control", desc: "Restrict printing, copying, editing, and more with ease." },
  { icon: Share2, title: "Secure Sharing", desc: "Share documents securely with access control." },
];

const features = [
  { icon: Lock, title: "Password Protection", desc: "Password protect your PDFs with strong passwords to prevent unauthorized access." },
  { icon: Shield, title: "Encryption", desc: "Encrypt PDFs using AES-256 bit encryption for maximum security and compliance." },
  { icon: Droplets, title: "Watermarking", desc: "Add text or image watermarks to protect your documents and assert ownership." },
  { icon: EyeOff, title: "Redaction", desc: "Permanently remove sensitive content and metadata from PDFs." },
  { icon: Printer, title: "Restrict Printing & Copying", desc: "Control what users can do — restrict printing, copying, editing, and content extraction." },
  { icon: Scissors, title: "Merge / Split / Secure", desc: "Merge multiple PDFs, split large files, and apply security in one seamless workflow." },
  { icon: Boxes, title: "Batch Processing", desc: "Apply security settings to multiple PDFs at once with powerful batch tools." },
  { icon: Link2, title: "Secure File Sharing", desc: "Share PDFs securely with access controls, expiry dates, and tracking." },
];

const steps = [
  { icon: Upload, title: "Upload PDF", desc: "Import your PDF file or drag and drop it into the app." },
  { icon: ShieldCheck, title: "Apply Security Rules", desc: "Set passwords, permissions, encryption, watermarks, and more." },
  { icon: Share2, title: "Share or Save", desc: "Save securely or share with controlled access." },
  { icon: BarChart3, title: "Track and Manage", desc: "Monitor access and manage documents with full control." },
];

const showcaseBullets = [
  { icon: FileLock2, title: "Document Protection", desc: "Protect sensitive information with encryption and access controls." },
  { icon: FolderLock, title: "Access Control", desc: "Define who can view, print, copy, or edit your documents." },
  { icon: History, title: "Audit-Friendly", desc: "Maintain logs and track document access for compliance and audits." },
  { icon: Building2, title: "Business-Ready", desc: "Built for professionals and enterprises who value security and productivity." },
];

const trustBlocks = [
  { icon: Zap, title: "Fast & Reliable", desc: "High-performance desktop app built for speed and efficiency." },
  { icon: MousePointer2, title: "Easy to Use", desc: "Intuitive interface for all users — no technical skills required." },
  { icon: Eye, title: "Privacy Focused", desc: "Your files stay on your device. We don't collect or store data." },
  { icon: Building2, title: "Enterprise-Grade", desc: "Advanced security that meets today's compliance standards." },
];

export default function PdfSecurityPage() {
  return (
    <ProductPageLayout>
      {/* === HERO === */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef4ff] via-white to-[#e8f0fe] py-20 lg:py-24">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-blue-200/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" aria-hidden="true" />
        <div className="container mx-auto px-6 max-w-[88rem] relative">
          <div className="grid lg:grid-cols-[5fr_6fr] gap-14 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-[#1d4ed8] text-sm font-semibold mb-6">
                <ShieldCheck className="w-4 h-4" strokeWidth={2.2} />
                Trusted PDF Protection for Professionals
              </div>
              <h1 className="text-5xl lg:text-[56px] font-extrabold leading-[1.06] tracking-tight text-slate-900 mb-6">
                Secure Every PDF<br />
                <span className="text-[#1d4ed8]">with Confidence</span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
                Protect sensitive documents, control access, and simplify PDF security with powerful encryption, permission controls, watermarks, and more — all in one easy-to-use desktop application.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={SECURE_INSTALLER_URL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5"
                >
                  <WindowsGlyph className="w-4 h-4" />
                  Download for Windows
                </a>
                <a
                  href={APP_URL}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-[#1d4ed8] font-semibold border-2 border-[#1d4ed8]/30 transition-colors"
                >
                  Start Free Trial
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <Monitor className="w-4 h-4 text-slate-400" />
                Mac, Android and iOS coming soon
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-blue-300/25 to-sky-300/25 rounded-3xl blur-2xl" aria-hidden="true" />
              <img
                src={secureHeroDashboard}
                alt="Luxor PDF Secure dashboard"
                className="relative w-full max-w-[640px] mx-auto drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* === BENEFITS STRIP === */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefitCards.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow px-6 py-6">
                <div className="w-11 h-11 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[15px] mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8] font-bold mb-3">Powerful Features</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Everything You Need to Secure PDF Documents</h2>
          </motion.div>
          <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#1d4ed8]" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-slate-900 text-[15px] mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8] font-bold mb-3">Simple Workflow</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">How It Works</h2>
          </motion.div>
          <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+44px)] w-[calc(100%-88px)] border-t-2 border-dashed border-blue-200" aria-hidden="true" />
                )}
                <div className="w-16 h-16 rounded-full bg-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                  <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1d4ed8] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[220px]">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === SHOWCASE === */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div {...fadeUp}>
              <EncryptMockup />
            </motion.div>
            <motion.div {...fadeUp}>
              <div className="space-y-7">
                {showcaseBullets.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{title}</h3>
                      <p className="text-slate-500 text-[15px] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === TRUST === */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-[#1d4ed8] font-bold mb-3">Why Choose Luxor PDF Secure</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Built for Security. Designed for You.</h2>
          </motion.div>
          <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBlocks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-blue-100 bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1d4ed8]" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[15px] mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp}>
            <div className="rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] relative overflow-hidden px-8 py-8 lg:px-14 lg:py-10">
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} aria-hidden="true" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <ShieldBadge className="w-16 h-[76px] lg:w-20 lg:h-24 shrink-0 drop-shadow-xl" />
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl lg:text-[30px] font-extrabold text-white tracking-tight leading-tight mb-2">Ready to Secure Your PDFs?</h2>
                  <p className="text-blue-100 text-base lg:text-lg font-medium mb-4 lg:mb-0">
                    Take control of your documents with Luxor PDF Secure. Start your free trial today — no credit card required.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-center lg:items-end gap-3">
                  <div className="flex flex-wrap justify-center gap-3">
                    <a href={APP_URL} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/30 transition-colors">
                      Start Free Trial
                    </a>
                    <a href={SECURE_INSTALLER_URL} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-[#1d4ed8] font-bold shadow-xl transition-colors">
                      <WindowsGlyph className="w-4 h-4" />
                      Download for Windows
                    </a>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-blue-100 text-xs font-medium">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Full access for 7 days</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No credit card required</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </ProductPageLayout>
  );
}
