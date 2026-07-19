import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  PenTool, Send, MousePointer2, Users, History, LayoutTemplate,
  BellRing, ShieldCheck, Upload, UserPlus, CheckCircle2, Shield,
  LayoutDashboard, FileText, FilePlus2, PenLine, Mail, UsersRound,
  Settings, ScrollText, Smile, Lock, Briefcase, Zap, Share2, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import esignShield from "@/assets/esign-shield.png";
import esignHeroDashboard from "@/assets/esign-hero-dashboard.png";
import esignSigningMockup from "@/assets/esign-signing-mockup.png";

const APP_URL = "/esign-app/";
const ESIGN_INSTALLER_URL = "/api/downloads/luxor-pdf-esign-latest.exe";

const GREEN = "#0f8f2f";
const GREEN_DARK = "#0a6e24";

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

/* === Hero dashboard mockup === */
function ESignDashboardMockup() {
  const sideItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: FileText, label: "Documents" },
    { icon: FilePlus2, label: "Upload Document" },
    { icon: PenLine, label: "Add Signature" },
    { icon: Mail, label: "Request Signatures" },
    { icon: UsersRound, label: "Signers" },
    { icon: LayoutTemplate, label: "Templates" },
    { icon: ScrollText, label: "Audit Trail" },
    { icon: Settings, label: "Settings" },
  ];
  const stats = [
    { label: "Total Documents", value: "24" },
    { label: "Pending Signatures", value: "7" },
    { label: "Completed", value: "17" },
    { label: "Templates", value: "12" },
  ];
  const docs = [
    { name: "Contract_2026.pdf", status: "Pending", pending: true },
    { name: "NDA_Agreement.pdf", status: "Signed", pending: false },
    { name: "Offer_Letter.pdf", status: "Pending", pending: true },
    { name: "Invoice_March.pdf", status: "Signed", pending: false },
    { name: "Policy_Document.pdf", status: "Pending", pending: true },
  ];
  const signers = [
    { name: "John Doe (You)", status: "Signed", pending: false },
    { name: "Jane Smith", status: "Pending", pending: true },
    { name: "Robert Brown", status: "Pending", pending: true },
  ];
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white shadow-2xl border border-green-100 overflow-hidden text-left">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a6e24]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <PenLine className="w-3.5 h-3.5 text-[#0f8f2f]" strokeWidth={2.5} />
            </div>
            <span className="text-white text-xs font-bold">LUXOR PDF eSign</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-300/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-300/60" />
          </div>
        </div>
        <div className="flex">
          <div className="w-[150px] shrink-0 bg-gradient-to-b from-[#0f8f2f] to-[#0a5c1e] py-3 px-2 space-y-0.5">
            {sideItems.map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${active ? "bg-white text-[#0f8f2f]" : "text-green-100"}`}>
                <Icon className="w-3 h-3 shrink-0" strokeWidth={2.4} />
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-900 mb-2.5">Dashboard</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-lg border border-slate-100 px-2 py-1.5">
                  <p className="text-[12px] font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-[6.5px] text-slate-500 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[3fr_2.6fr] gap-3">
              <div>
                <p className="text-[8.5px] font-bold text-slate-700 mb-1.5">Recent Documents</p>
                <div className="space-y-1.5">
                  {docs.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 bg-white rounded-lg border border-slate-100 px-2 py-1.5">
                      <div className="w-5 h-6 rounded-sm bg-green-50 border border-green-200 flex items-center justify-center">
                        <span className="text-[5px] font-bold text-green-600">PDF</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-800 truncate flex-1">{d.name}</p>
                      <span className={`text-[6.5px] font-bold px-1.5 py-0.5 rounded-full ${d.pending ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[8.5px] font-bold text-slate-700 mb-1.5">Document Preview</p>
                <div className="bg-white rounded-lg border border-slate-100 p-2.5 mb-2">
                  <p className="text-[7.5px] font-bold text-slate-800 mb-1.5">Employment Agreement</p>
                  <div className="space-y-1 mb-2">
                    <div className="h-1 rounded bg-slate-100 w-full" />
                    <div className="h-1 rounded bg-slate-100 w-11/12" />
                    <div className="h-1 rounded bg-slate-100 w-full" />
                    <div className="h-1 rounded bg-slate-100 w-4/5" />
                  </div>
                  <div className="rounded border border-dashed border-green-400 bg-green-50/60 px-2 py-1.5">
                    <p className="text-[10px] italic text-slate-700" style={{ fontFamily: "cursive" }}>John Doe</p>
                  </div>
                </div>
                <p className="text-[8.5px] font-bold text-slate-700 mb-1">Signer Fields</p>
                <div className="space-y-1">
                  {signers.map((s) => (
                    <div key={s.name} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-2 py-1">
                      <span className="text-[7px] font-semibold text-slate-700">{s.name}</span>
                      <span className={`text-[6.5px] font-bold ${s.pending ? "text-amber-600" : "text-green-600"}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-4 top-24 hidden lg:block bg-white rounded-xl shadow-xl border border-green-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0f8f2f] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Secure eSign</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#0f8f2f]" /> Verified &amp; Encrypted</p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#0f8f2f]" /> Legally Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* === Showcase signing mockup === */
function SigningMockup() {
  const signers = [
    { name: "John Doe (You)", status: "Signed", pending: false },
    { name: "Jane Smith", status: "Pending", pending: true },
    { name: "Robert Brown", status: "Pending", pending: true },
  ];
  return (
    <div className="rounded-2xl bg-white shadow-2xl border border-green-100 overflow-hidden text-left">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <FileText className="w-4 h-4 text-[#0f8f2f]" />
        <span className="text-xs font-bold text-slate-800">Employment Agreement.pdf</span>
      </div>
      <div className="grid grid-cols-[1.1fr_2fr_1.3fr]">
        <div className="border-r border-slate-100 p-3">
          <p className="text-[9px] font-bold text-slate-700 mb-2">Signers</p>
          <div className="space-y-1.5">
            {signers.map((s) => (
              <div key={s.name} className="rounded-lg border border-slate-100 px-2 py-1.5">
                <p className="text-[8px] font-bold text-slate-800">{s.name}</p>
                <span className={`text-[7px] font-bold ${s.pending ? "text-amber-600" : "text-green-600"}`}>{s.status}</span>
              </div>
            ))}
            <button type="button" className="w-full rounded-lg border border-dashed border-green-300 px-2 py-1.5 text-[8px] font-semibold text-[#0f8f2f]">+ Add Signer</button>
          </div>
        </div>
        <div className="p-4 bg-slate-50/60">
          <div className="bg-white rounded-lg border border-slate-100 p-3 h-full">
            <p className="text-[9px] font-extrabold text-slate-900 text-center mb-2 tracking-wide">EMPLOYMENT AGREEMENT</p>
            <div className="space-y-1.5 mb-3">
              <div className="h-1 rounded bg-slate-100 w-full" />
              <div className="h-1 rounded bg-slate-100 w-11/12" />
              <div className="h-1 rounded bg-slate-100 w-full" />
              <div className="h-1 rounded bg-slate-100 w-3/4" />
              <div className="h-1 rounded bg-slate-100 w-full" />
              <div className="h-1 rounded bg-slate-100 w-5/6" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-dashed border-slate-300 px-2 py-2">
                <p className="text-[7px] text-slate-400 mb-1">Signature</p>
                <div className="h-3" />
              </div>
              <div className="rounded border border-dashed border-green-400 bg-green-50/60 px-2 py-2">
                <p className="text-[7px] text-slate-400 mb-1">Signature</p>
                <p className="text-[11px] italic text-slate-700" style={{ fontFamily: "cursive" }}>Jane Smith</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-l border-slate-100 p-3">
          <p className="text-[9px] font-bold text-slate-700 mb-2">Send for Signatures</p>
          <p className="text-[7.5px] font-semibold text-slate-500 mb-1">Signing Order</p>
          <div className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] text-slate-700 mb-2">Sequential</div>
          <p className="text-[7.5px] font-semibold text-slate-500 mb-1">Message (Optional)</p>
          <div className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] text-slate-400 mb-3 h-12">Please review and sign the document.</div>
          <button type="button" className="w-full rounded-lg bg-[#0f8f2f] text-white text-[9px] font-bold py-1.5 flex items-center justify-center gap-1">
            <Send className="w-2.5 h-2.5" /> Send
          </button>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-semibold text-slate-500">Signing Progress</span>
          <span className="text-[8px] font-bold text-[#0f8f2f]">66%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#24b34b] to-[#0f8f2f]" style={{ width: "66%" }} />
        </div>
      </div>
    </div>
  );
}

const benefits = [
  { icon: ShieldCheck, title: "Legally Trusted eSignatures", desc: "ESIGN, UETA & global standards compliant." },
  { icon: Zap, title: "Fast Document Signing", desc: "Sign and send in seconds. Anywhere, anytime." },
  { icon: Users, title: "Multi-Signer Workflows", desc: "Collect signatures in order or in parallel." },
  { icon: Share2, title: "Secure Sharing & Tracking", desc: "Track every action with complete transparency." },
];

const features = [
  { icon: PenTool, title: "Draw / Type / Upload eSignature", desc: "Create your signature the way you like." },
  { icon: Send, title: "Request Signatures", desc: "Invite others to sign with ease." },
  { icon: MousePointer2, title: "Drag-and-Drop Signature Fields", desc: "Place fields anywhere on your PDF." },
  { icon: Users, title: "Multi-Signer Routing", desc: "Set signing order or allow parallel signing." },
  { icon: History, title: "Audit Trail", desc: "Track every action with date, time and IP logs." },
  { icon: LayoutTemplate, title: "Document Templates", desc: "Save and reuse templates for faster workflows." },
  { icon: BellRing, title: "Reminders & Notifications", desc: "Automatic emails to keep signers on track." },
  { icon: ShieldCheck, title: "Secure PDF Signing", desc: "256-bit encryption and secure cloud storage." },
];

const steps = [
  { icon: Upload, n: 1, title: "Upload PDF", desc: "Upload your document in seconds." },
  { icon: UserPlus, n: 2, title: "Add Signers & Fields", desc: "Add signers and place signature fields." },
  { icon: Send, n: 3, title: "Send or Sign", desc: "Send for signatures or sign yourself." },
  { icon: BarChart3, n: 4, title: "Track Status", desc: "Track progress in real time until completion." },
];

const smarterPoints = [
  { title: "Secure Workflow", desc: "Your documents are encrypted and protected at every step." },
  { title: "Team Collaboration", desc: "Work together seamlessly across teams and departments." },
  { title: "Business Ready", desc: "From contracts to HR forms, handle it all professionally." },
  { title: "Save Time & Effort", desc: "Automate reminders and reduce turnaround time." },
];

const trustBlocks = [
  { icon: Smile, title: "Easy to Use", desc: "Intuitive interface that anyone can use instantly." },
  { icon: Lock, title: "Secure & Private", desc: "Bank-grade encryption keeps your data safe." },
  { icon: Users, title: "Team Ready", desc: "Collaborate with your team from anywhere." },
  { icon: Briefcase, title: "Professional Workflow", desc: "Look professional and stay compliant every time." },
];

export default function ESignPage() {
  return (
    <ProductPageLayout>
      {/* === HERO === */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f2fbf4] via-white to-[#e8f8ec] py-16 lg:py-20">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#24b34b]/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] bg-[#0f8f2f]/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="container mx-auto px-6 max-w-[88rem] relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-[#dff5e5] border border-[#24b34b]/30 rounded-full px-4 py-1.5 text-[#0a6e24] text-sm font-semibold mb-6">
                <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                Trusted eSigning for Professionals
              </div>
              <h1 className="text-4xl lg:text-[52px] font-extrabold tracking-tight leading-[1.08] text-[#111827] mb-6">
                Sign Every PDF<br />
                <span className="text-[#0f8f2f]">with Confidence</span>
              </h1>
              <p className="text-[#4b5563] text-base lg:text-lg leading-relaxed mb-8 max-w-xl">
                LUXOR PDF eSign makes it easy to sign, request signatures, approve documents and automate your workflow. Secure, compliant and legally trusted eSigning for modern teams and professionals.
              </p>
              <div className="flex flex-wrap gap-3 mb-5 items-center">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0f8f2f] hover:bg-[#0a6e24] text-white font-bold shadow-lg shadow-green-600/20 transition-colors cursor-default select-none" aria-disabled="true">
                  <WindowsGlyph className="w-4 h-4" />
                  Download for Windows
                </span>
                <a href={APP_URL} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-[#dff5e5] text-[#0f8f2f] font-bold border border-[#0f8f2f]/40 transition-colors">
                  Start Free Trial
                </a>
              </div>
              <p className="text-sm text-[#4b5563] flex items-center gap-2">
                <Smile className="w-4 h-4 text-[#0f8f2f]" />
                Mac, Android and iOS coming soon
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <div className="relative">
                <img
                  src={esignHeroDashboard}
                  alt="LUXOR PDF eSign dashboard"
                  className="w-full rounded-2xl shadow-2xl border border-green-100"
                />
                <div className="absolute -right-4 top-24 hidden lg:block bg-white rounded-xl shadow-xl border border-green-100 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#0f8f2f] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Secure eSign</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#0f8f2f]" /> Verified &amp; Encrypted</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#0f8f2f]" /> Legally Compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === BENEFITS STRIP === */}
      <section className="py-10 bg-white border-b border-[#e5e7eb]">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} {...fadeUp} whileHover={{ y: -3 }} className="flex items-start gap-3.5 rounded-2xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-md transition-shadow px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-[#dff5e5] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#0f8f2f]" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-sm mb-0.5">{title}</p>
                  <p className="text-[#4b5563] text-xs leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="py-16 lg:py-20 bg-[#f8fdf9]">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-[#0f8f2f] text-xs font-bold tracking-[0.2em] uppercase mb-3">Everything You Need</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              Everything You Need for <span className="text-[#0f8f2f]">Fast &amp; Secure</span> eSigning
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} {...fadeUp} whileHover={{ y: -4 }} className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="w-11 h-11 rounded-xl bg-[#dff5e5] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#0f8f2f]" strokeWidth={1.9} />
                </div>
                <h3 className="font-bold text-[#111827] text-sm mb-1.5">{title}</h3>
                <p className="text-[#4b5563] text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              How <span className="text-[#0f8f2f]">LUXOR PDF eSign</span> Works
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
            {steps.map(({ icon: Icon, n, title, desc }, i) => (
              <motion.div key={title} {...fadeUp} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#0f8f2f] flex items-center justify-center mb-4 shadow-lg shadow-green-600/25">
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.9} />
                </div>
                {i < 3 && <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-[#24b34b]/40" aria-hidden="true" />}
                <p className="font-bold text-[#111827] mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dff5e5] text-[#0f8f2f] text-[11px] font-extrabold mr-1.5 align-middle">{n}</span>
                  {title}
                </p>
                <p className="text-[#4b5563] text-sm max-w-[220px]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === PRODUCT SHOWCASE === */}
      <section className="py-16 lg:py-20 bg-[#f8fdf9]">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-center">
            <motion.div {...fadeUp}>
              <img
                src={esignSigningMockup}
                alt="LUXOR PDF eSign document signing view"
                className="w-full rounded-2xl shadow-2xl border border-green-100"
              />
            </motion.div>
            <motion.div {...fadeUp}>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight mb-8">
                A <span className="text-[#0f8f2f]">Smarter</span> Way to Get Documents Signed
              </h2>
              <div className="space-y-5">
                {smarterPoints.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#dff5e5] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-[#0f8f2f]" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="font-bold text-[#111827] mb-0.5">{title}</p>
                      <p className="text-[#4b5563] text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === TRUST === */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-[#0f8f2f] text-xs font-bold tracking-[0.2em] uppercase mb-3">Why Choose LUXOR PDF eSign</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] tracking-tight">
              Built for Speed. <span className="text-[#0f8f2f]">Designed for Trust.</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustBlocks.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} {...fadeUp} className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#dff5e5] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#0f8f2f]" strokeWidth={1.9} />
                </div>
                <div>
                  <p className="font-bold text-[#111827] mb-1">{title}</p>
                  <p className="text-[#4b5563] text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA BANNER === */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-6 max-w-[88rem]">
          <motion.div {...fadeUp}>
            <div className="rounded-[28px] bg-gradient-to-br from-[#2cae4f] via-[#149135] to-[#0a6e24] relative overflow-hidden px-8 pt-8 pb-8 lg:px-12 lg:pt-10 lg:pb-10 shadow-2xl shadow-green-900/20">
              <div className="absolute -top-24 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-28 right-10 w-80 h-80 bg-[#0a6e24]/60 rounded-full blur-3xl" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  <img
                    src={esignShield}
                    alt="LUXOR eSign shield badge"
                    className="w-36 lg:w-44 shrink-0"
                  />
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl lg:text-[38px] font-extrabold text-white tracking-tight leading-[1.15] mb-3">
                      Ready to<br className="hidden lg:block" /> Simplify eSigning?
                    </h2>
                    <p className="text-green-50/90 text-base lg:text-lg font-medium max-w-md mx-auto lg:mx-0">
                      Join thousands of professionals who trust LUXOR PDF eSign.
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col gap-4 w-full sm:w-auto">
                    <a href={APP_URL} className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-white hover:bg-green-50 text-[#0f8f2f] font-bold text-base shadow-xl transition-colors">
                      Start Free Trial
                      <span aria-hidden="true" className="font-extrabold">&rsaquo;</span>
                    </a>
                    <span className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl bg-[#128a30] text-white font-bold text-base border border-white/70 shadow-lg cursor-default select-none" aria-disabled="true">
                      <WindowsGlyph className="w-4.5 h-4.5" />
                      Download for Windows
                    </span>
                  </div>
                </div>
                <div className="mt-8 flex justify-center lg:justify-start lg:pl-56">
                  <div className="rounded-2xl bg-[#0a6e24]/45 border border-white/10 px-6 py-3.5 flex flex-col sm:flex-row items-center gap-y-2">
                    {[
                      { icon: CheckCircle2, label: "No credit card required" },
                      { icon: Zap, label: "Fast setup" },
                      { icon: History, label: "Cancel anytime" },
                    ].map(({ icon: Icon, label }, i) => (
                      <div key={label} className="flex items-center">
                        {i > 0 && <span className="hidden sm:block w-px h-6 bg-white/20 mx-6" aria-hidden="true" />}
                        <span className="inline-flex items-center gap-2.5 text-white text-sm font-semibold">
                          <span className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-white" strokeWidth={2.1} />
                          </span>
                          {label}
                        </span>
                      </div>
                    ))}
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
