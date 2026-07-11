import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import {
  Lock, Shield, Eye, Clock, Key, Printer, KeyRound, Calendar,
  CheckCircle2, Link2, Copy, Sparkles, Globe, Zap, FileLock2,
  Timer, Ban, Server, MousePointer2, Newspaper,
} from "lucide-react";
import { motion } from "framer-motion";

const APP_URL = "/pdf-expiry/";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = {
  initial: {},
  whileInView: {},
  viewport: { once: true, margin: "-60px" },
  transition: { staggerChildren: 0.08, delayChildren: 0.05 },
};

function HeroMockup() {
  return (
    <svg viewBox="0 0 560 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      <defs>
        <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0a1628" />
          <stop offset="1" stopColor="#0a2e52" />
        </linearGradient>
        <linearGradient id="shareCard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5faff" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      {/* Window */}
      <rect width="560" height="360" rx="14" fill="url(#heroBg)" />
      <rect x="0" y="0" width="560" height="34" rx="14" fill="#050d1a" />
      <circle cx="18" cy="17" r="5" fill="#ef4444" />
      <circle cx="34" cy="17" r="5" fill="#f59e0b" />
      <circle cx="50" cy="17" r="5" fill="#22c55e" />
      <rect x="200" y="10" width="160" height="14" rx="7" fill="#0a1628" />
      <text x="280" y="20" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="600">luxorpdf.com / secure</text>

      {/* App header */}
      <rect x="20" y="50" width="520" height="46" rx="10" fill="#1e3a8a" />
      <circle cx="42" cy="73" r="13" fill="#dbeafe" />
      <text x="42" y="78" textAnchor="middle" fill="#1d4ed8" fontSize="14" fontWeight="bold">L</text>
      <text x="64" y="70" fill="white" fontSize="11" fontWeight="bold">Secure Your PDF</text>
      <text x="64" y="83" fill="#93c5fd" fontSize="8">Four protection modes · Encrypted in your browser</text>
      <rect x="448" y="62" width="78" height="22" rx="6" fill="#050d1a" />
      <text x="487" y="76" textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="bold">● Online</text>

      {/* Tab bar */}
      <rect x="20" y="106" width="520" height="36" rx="10" fill="#f5faff" />
      {/* Active tab — Expiry (rose) */}
      <rect x="26" y="111" width="123" height="26" rx="7" fill="#e11d48" />
      <text x="87" y="128" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">📅  Expiry Date</text>
      {/* Password (indigo) */}
      <text x="210" y="128" textAnchor="middle" fill="#312E81" fontSize="9" fontWeight="600">🔒  Password</text>
      {/* Print Control (amber) */}
      <text x="335" y="128" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="600">🖨️  Print Control</text>
      {/* Revoke (emerald) */}
      <text x="465" y="128" textAnchor="middle" fill="#065f46" fontSize="9" fontWeight="600">⛔  Revoke</text>

      {/* Card body */}
      <rect x="20" y="152" width="520" height="190" rx="12" fill="#0a1628" stroke="#1e3a8a" strokeWidth="1" />

      {/* File row */}
      <rect x="36" y="166" width="488" height="40" rx="8" fill="#172554" />
      <rect x="46" y="174" width="24" height="24" rx="4" fill="#1d4ed8" />
      <text x="58" y="190" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">PDF</text>
      <text x="80" y="184" fill="#dbeafe" fontSize="9" fontWeight="bold">Quarterly_Financials_Q4.pdf</text>
      <text x="80" y="196" fill="#93c5fd" fontSize="7">2.4 MB · Ready to protect</text>
      <circle cx="500" cy="186" r="9" fill="#1e3a8a" />
      <text x="500" y="190" textAnchor="middle" fill="#dbeafe" fontSize="10" fontWeight="bold">×</text>

      {/* Date picker */}
      <text x="36" y="226" fill="#93c5fd" fontSize="8" fontWeight="bold">EXPIRES ON</text>
      <rect x="36" y="232" width="244" height="42" rx="8" fill="#172554" stroke="#1e3a8a" />
      <rect x="46" y="240" width="24" height="26" rx="4" fill="#1e3a8a" />
      <text x="58" y="257" textAnchor="middle" fill="#dbeafe" fontSize="11">📅</text>
      <text x="80" y="252" fill="#dbeafe" fontSize="10" fontWeight="bold">31 Dec 2026</text>
      <text x="80" y="265" fill="#93c5fd" fontSize="7">23:59 · Document locks at this moment</text>

      {/* Countdown badge (animated pulse) */}
      <rect x="296" y="232" width="228" height="42" rx="8" fill="#050d1a" stroke="#1d4ed8" />
      <text x="306" y="248" fill="#93c5fd" fontSize="7" fontWeight="bold">EXPIRES IN</text>
      <text x="306" y="265" fill="#bfdbfe" fontSize="14" fontWeight="bold">06d : 14h : 22m : 18s</text>
      <circle cx="513" cy="245" r="4" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
      </circle>

      {/* Share link card */}
      <rect x="36" y="288" width="488" height="42" rx="8" fill="url(#shareCard)" />
      <rect x="44" y="296" width="22" height="26" rx="4" fill="#bfdbfe" />
      <text x="55" y="313" textAnchor="middle" fill="#1d4ed8" fontSize="11">🔗</text>
      <text x="74" y="306" fill="#1e3a8a" fontSize="7" fontWeight="bold">SECURE SHARE LINK</text>
      <text x="74" y="320" fill="#0a1628" fontSize="9" fontFamily="monospace">luxorpdf.com/v/x9f2a-q1n8?token=••••••</text>
      <rect x="430" y="298" width="84" height="22" rx="6" fill="#2563eb" />
      <text x="472" y="313" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">📋  Copy link</text>
    </svg>
  );
}

/* === Mode card mockups (small) === */
function ExpiryModeMockup() {
  return (
    <svg viewBox="0 0 220 130" className="w-full">
      <rect width="220" height="130" rx="10" fill="#fff1f2" />
      <rect x="14" y="14" width="192" height="24" rx="6" fill="#e11d48" />
      <text x="110" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">📅  Expiry Date</text>
      <rect x="14" y="46" width="192" height="32" rx="6" fill="white" stroke="#fecaca" />
      <text x="22" y="60" fill="#9f1239" fontSize="7" fontWeight="bold">EXPIRES</text>
      <text x="22" y="73" fill="#1c0a09" fontSize="9" fontWeight="bold">31 Dec 2026 · 23:59</text>
      <rect x="14" y="86" width="192" height="32" rx="6" fill="#fecaca" />
      <text x="22" y="100" fill="#9f1239" fontSize="7" fontWeight="bold">COUNTDOWN</text>
      <text x="22" y="113" fill="#9f1239" fontSize="9" fontWeight="bold">06d : 14h : 22m</text>
      <circle cx="195" cy="102" r="4" fill="#e11d48">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function PasswordModeMockup() {
  return (
    <svg viewBox="0 0 220 130" className="w-full">
      <rect width="220" height="130" rx="10" fill="#eef2ff" />
      <rect x="14" y="14" width="192" height="24" rx="6" fill="#312E81" />
      <text x="110" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">🔒  Password</text>
      <rect x="14" y="46" width="192" height="28" rx="6" fill="white" stroke="#c7d2fe" />
      <text x="22" y="64" fill="#4338ca" fontSize="10" fontFamily="monospace" fontWeight="bold">••••••••••••</text>
      <circle cx="180" cy="60" r="8" fill="#312E81" />
      <text x="180" y="64" textAnchor="middle" fill="white" fontSize="9">👁</text>
      <rect x="14" y="82" width="98" height="32" rx="6" fill="#312E81" />
      <text x="63" y="102" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">AES-256 ✓</text>
      <rect x="118" y="82" width="88" height="32" rx="6" fill="white" stroke="#c7d2fe" />
      <text x="162" y="102" textAnchor="middle" fill="#312E81" fontSize="8" fontWeight="bold">In-browser</text>
    </svg>
  );
}

function PrintControlModeMockup() {
  return (
    <svg viewBox="0 0 220 130" className="w-full">
      <rect width="220" height="130" rx="10" fill="#fffbeb" />
      <rect x="14" y="14" width="192" height="24" rx="6" fill="#d97706" />
      <text x="110" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">🖨️  Print Control</text>
      <rect x="14" y="46" width="192" height="68" rx="6" fill="white" stroke="#fed7aa" />
      <rect x="78" y="56" width="64" height="42" rx="4" fill="#fef3c7" stroke="#d97706" />
      <rect x="84" y="50" width="52" height="12" rx="2" fill="#fde68a" />
      <rect x="88" y="74" width="44" height="16" rx="2" fill="white" stroke="#d97706" strokeWidth="0.5" />
      <line x1="68" y1="46" x2="152" y2="114" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      <text x="110" y="108" textAnchor="middle" fill="#92400e" fontSize="7" fontWeight="bold">PRINTING BLOCKED</text>
    </svg>
  );
}

function RevokeModeMockup() {
  return (
    <svg viewBox="0 0 220 130" className="w-full">
      <rect width="220" height="130" rx="10" fill="#ecfdf5" />
      <rect x="14" y="14" width="192" height="24" rx="6" fill="#065f46" />
      <text x="110" y="30" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">⛔  Revoke Access</text>
      <rect x="14" y="46" width="192" height="32" rx="6" fill="white" stroke="#a7f3d0" />
      <text x="22" y="60" fill="#047857" fontSize="7" fontWeight="bold">SHARED LINK</text>
      <text x="22" y="73" fill="#0a1628" fontSize="8" fontFamily="monospace">luxorpdf.com/v/x9f2a</text>
      <line x1="22" y1="73" x2="158" y2="73" stroke="#dc2626" strokeWidth="1.2" />
      <rect x="14" y="86" width="192" height="32" rx="6" fill="#065f46" />
      <text x="110" y="106" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">✓ Revoked instantly</text>
    </svg>
  );
}

/* === Self-locking viewer mockups === */
function ViewerActiveMockup() {
  return (
    <svg viewBox="0 0 320 220" className="w-full drop-shadow-xl">
      <rect width="320" height="220" rx="10" fill="#050d1a" />
      <rect x="0" y="0" width="320" height="22" rx="10" fill="#0a1628" />
      <circle cx="14" cy="11" r="3" fill="#ef4444" />
      <circle cx="26" cy="11" r="3" fill="#f59e0b" />
      <circle cx="38" cy="11" r="3" fill="#22c55e" />
      <text x="160" y="14" textAnchor="middle" fill="#93c5fd" fontSize="6">luxorpdf.com/v/x9f2a</text>
      {/* PDF page */}
      <rect x="20" y="34" width="280" height="170" rx="6" fill="white" />
      <rect x="36" y="50" width="160" height="10" rx="2" fill="#0a1628" />
      <rect x="36" y="68" width="248" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="76" width="240" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="84" width="252" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="92" width="220" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="106" width="248" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="114" width="200" height="3" rx="1" fill="#e2e8f0" />
      <rect x="36" y="128" width="160" height="40" rx="4" fill="#eff6ff" />
      <text x="46" y="144" fill="#1e40af" fontSize="7" fontWeight="bold">CONFIDENTIAL</text>
      <rect x="46" y="148" width="120" height="3" rx="1" fill="#bfdbfe" />
      <rect x="46" y="155" width="100" height="3" rx="1" fill="#bfdbfe" />
      {/* Floating timer */}
      <rect x="200" y="42" width="92" height="36" rx="8" fill="#050d1a" stroke="#2563eb" strokeWidth="1.2" />
      <text x="246" y="55" textAnchor="middle" fill="#93c5fd" fontSize="6" fontWeight="bold">EXPIRES IN</text>
      <text x="246" y="71" textAnchor="middle" fill="#bfdbfe" fontSize="11" fontFamily="monospace" fontWeight="bold">00:14:32</text>
      <circle cx="287" cy="50" r="3" fill="#ef4444">
        <animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ViewerExpiredMockup() {
  return (
    <svg viewBox="0 0 320 220" className="w-full drop-shadow-xl">
      <rect width="320" height="220" rx="10" fill="#050d1a" />
      <rect x="0" y="0" width="320" height="22" rx="10" fill="#0a1628" />
      <circle cx="14" cy="11" r="3" fill="#ef4444" />
      <circle cx="26" cy="11" r="3" fill="#f59e0b" />
      <circle cx="38" cy="11" r="3" fill="#22c55e" />
      <text x="160" y="14" textAnchor="middle" fill="#1e3a8a" fontSize="6">luxorpdf.com/v/x9f2a</text>
      {/* Expired card */}
      <rect x="20" y="34" width="280" height="170" rx="6" fill="#0a1628" stroke="#1e3a8a" />
      <circle cx="160" cy="92" r="32" fill="#1e3a8a" opacity="0.4" />
      <circle cx="160" cy="92" r="22" fill="#1d4ed8" />
      <text x="160" y="99" textAnchor="middle" fill="white" fontSize="22">🔒</text>
      <text x="160" y="142" textAnchor="middle" fill="#dbeafe" fontSize="12" fontWeight="bold">Document expired</text>
      <text x="160" y="158" textAnchor="middle" fill="#93c5fd" fontSize="8">This shared link is no longer valid.</text>
      <text x="160" y="170" textAnchor="middle" fill="#93c5fd" fontSize="8">The document was removed from your view.</text>
      <rect x="120" y="180" width="80" height="16" rx="6" fill="#1e3a8a" />
      <text x="160" y="191" textAnchor="middle" fill="#dbeafe" fontSize="7" fontWeight="bold">CONTACT SENDER</text>
    </svg>
  );
}

/* === Page === */
const modes = [
  {
    name: "Expiry Date",
    tag: "Self-destruct",
    icon: Calendar,
    accent: "rose",
    desc: "Pick an exact moment when the document should disappear. The recipient's view locks itself in real time — no manual cleanup, no leftover copies.",
    mockup: ExpiryModeMockup,
  },
  {
    name: "Password",
    tag: "AES-256",
    icon: Lock,
    accent: "indigo",
    desc: "Lock the PDF with a password using AES-256. Encryption happens inside your browser — the original file never leaves your machine for protection.",
    mockup: PasswordModeMockup,
  },
  {
    name: "Print Control",
    tag: "Permission lock",
    icon: Printer,
    accent: "amber",
    desc: "Strip the print permission directly from the PDF. Recipients can read it, but can't print, redistribute, or feed it into another document.",
    mockup: PrintControlModeMockup,
  },
  {
    name: "Revoke",
    tag: "Kill switch",
    icon: KeyRound,
    accent: "emerald",
    desc: "Change your mind? Cut access to a shared link instantly — even if the expiry hasn't been reached yet. The recipient is locked out within seconds.",
    mockup: RevokeModeMockup,
  },
] as const;

const accentClasses = {
  rose:    { ring: "border-rose-200",    chip: "bg-rose-100 text-rose-700",       icon: "bg-rose-50 text-rose-600" },
  indigo:  { ring: "border-indigo-200",  chip: "bg-indigo-100 text-indigo-700",   icon: "bg-indigo-50 text-indigo-600" },
  amber:   { ring: "border-amber-200",   chip: "bg-amber-100 text-amber-800",     icon: "bg-amber-50 text-amber-700" },
  emerald: { ring: "border-emerald-200", chip: "bg-emerald-100 text-emerald-700", icon: "bg-emerald-50 text-emerald-600" },
};

const features = [
  { icon: Key,         title: "True AES-256 encryption",       desc: "Industry-standard cipher applied with qpdf — the same engine used by archival and government workflows." },
  { icon: Server,      title: "Encrypted in your browser",     desc: "Passwords are applied client-side. Your original file never gets uploaded for the encryption step." },
  { icon: Timer,       title: "Real-time self-locking viewer", desc: "The recipient's tab checks expiry every second locally and re-verifies with the server — the view auto-locks the moment time runs out." },
  { icon: Link2,       title: "Tokenised share links",         desc: "Each share gets a unique short link plus a secret token. Without both, the document simply isn't accessible." },
  { icon: Ban,         title: "Instant remote revoke",         desc: "Hit Revoke and the live viewer is invalidated within 30 seconds — perfect when a deal falls through or a recipient leaves." },
  { icon: Eye,         title: "Confirm-before-share dialog",   desc: "A 10-second countdown pops up with the password masked + copy button, so you never share a link without saving the key first." },
  { icon: Copy,        title: "One-click copy everywhere",     desc: "Copy the share link, copy the password, copy the recipient code — every secret has a clean, deliberate copy action." },
  { icon: FileLock2,   title: "Permission-flag enforcement",   desc: "Print Control writes proper PDF permission flags so most major readers will refuse the print/copy operation." },
  { icon: MousePointer2, title: "No install. No account.",     desc: "Works in any modern browser. Drop a file in, choose a mode, share. That's the whole flow." },
];

const steps = [
  { n: "1", title: "Drop in your PDF",      desc: "Drag a file into the browser. It stays local — nothing is uploaded yet." },
  { n: "2", title: "Pick a protection mode", desc: "Expiry, password, print control, or revoke. Mix and match as needed." },
  { n: "3", title: "Share the secure link",  desc: "Copy the tokenised link. Send it through any channel you trust." },
  { n: "4", title: "Stay in control",        desc: "Watch the countdown, change your mind, or revoke instantly — any time." },
];

export default function PdfSecurityPage() {
  return (
    <ProductPageLayout>
      {/* === Hero === */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 text-white py-24">
        {/* Animated background blobs */}
        <motion.div
          aria-hidden="true"
          className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-blue-500/25 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"
          animate={{ y: [0, 24, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"
          animate={{ y: [0, -18, 0], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-sky-300/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-[5fr_6fr] gap-14 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" strokeWidth={2.2} />
                Newly revised · Four protection modes
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-[1.05] mb-6 text-white">
                Share PDFs that <span className="bg-gradient-to-r from-sky-300 via-sky-200 to-blue-200 bg-clip-text text-transparent">lock themselves</span>
              </h1>
              <p className="text-blue-100/85 text-lg leading-relaxed mb-8 max-w-xl">
                Luxor PDF Secure puts a real expiry, an AES-256 password, a print block, and a kill switch on any document — and gives recipients a viewer that locks in real time. Encrypt in your browser, share a tokenised link, revoke whenever you want.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={APP_URL}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40 hover:-translate-y-0.5"
                >
                  Protect a PDF — free →
                </a>
                <a
                  href="#modes"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors backdrop-blur-sm"
                >
                  See the four modes
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-200/80">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-300" /> No account required</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-300" /> Browser-only encryption</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-300" /> Works on any device</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="relative"
            >
              {/* Subtle glow under the mockup */}
              <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 to-sky-500/20 rounded-3xl blur-2xl" aria-hidden="true" />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <HeroMockup />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === Stats strip === */}
      <section className="bg-blue-700 py-7">
        <div className="container mx-auto px-6">
          <motion.div
            {...stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center"
          >
            {[
              ["AES-256",      "Browser-side encryption"],
              ["1-second tick", "Real-time expiry check"],
              ["≤ 30 sec",     "Server revoke propagation"],
              ["4 modes",      "Of protection in one app"],
            ].map(([val, lbl]) => (
              <motion.div key={lbl} variants={fadeUp}>
                <p className="text-2xl font-bold tracking-tight">{val}</p>
                <p className="text-blue-200 text-sm">{lbl}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === Four modes === */}
      <section id="modes" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-600 font-bold mb-3">The toolkit</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Four ways to lock down a PDF</h2>
            <p className="text-slate-500 leading-relaxed">
              Each mode is a separate tab in the app, with its own colour and its own preview. Use them on their own or combine them for layered protection.
            </p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-2 gap-6">
            {modes.map(({ name, tag, icon: Icon, accent, desc, mockup: Mockup }) => {
              const a = accentClasses[accent];
              return (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className={`group bg-white rounded-2xl p-6 border ${a.ring} shadow-sm hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.icon}`}>
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${a.chip}`}>{tag}</span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors">
                    <Mockup />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* === Self-locking viewer spotlight === */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-sky-950 text-white relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="container mx-auto px-6 relative">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-5">
              <Timer className="w-4 h-4" strokeWidth={2.2} />
              The killer feature
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">A viewer that watches the clock for you</h2>
            <p className="text-blue-100/80 leading-relaxed">
              Every recipient gets a tokenised page that ticks every second locally and checks back in with the server every thirty. The instant the expiry hits, the document is wiped from the page — no refresh needed, no leftover copy in their cache.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-semibold uppercase tracking-wider text-xs">Live · before expiry</span>
              </div>
              <ViewerActiveMockup />
              <p className="mt-4 text-blue-100/70 text-sm leading-relaxed">
                The recipient sees a clean, watermarked PDF with a live countdown floating in the corner. Local tick + server check keeps the timer honest.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="mb-3 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-rose-300 font-semibold uppercase tracking-wider text-xs">Locked · the moment time runs out</span>
              </div>
              <ViewerExpiredMockup />
              <p className="mt-4 text-blue-100/70 text-sm leading-relaxed">
                When the clock hits zero (or you revoke early), the document blob is destroyed and the recipient is shown a clean lock screen instead.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === How it works === */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-600 font-bold mb-3">How it works</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">From upload to revoked in four steps</h2>
            <p className="text-slate-500">No setup, no admin console. Drop a file, share a link, stay in control.</p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-4 gap-6">
            {steps.map(({ n, title, desc }, i) => (
              <motion.div key={n} variants={fadeUp} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  {n}
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" />
                )}
                <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === Features grid === */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-600 font-bold mb-3">Under the hood</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Built for people who can't afford a leak</h2>
            <p className="text-slate-500">Every detail of the flow is designed to keep secrets actually secret.</p>
          </motion.div>

          <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-600" strokeWidth={2.2} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === Use cases === */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Who relies on Luxor PDF Secure</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From legal teams to indie consultants — anyone who sends a PDF they wish they could take back.</p>
          </motion.div>
          <motion.div {...stagger} className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { role: "Legal teams",     use: "Send draft contracts with a 7-day expiry. Once the deal is signed elsewhere, revoke and move on.", icon: Shield },
              { role: "HR & recruiting", use: "Distribute offer letters that lock themselves if the candidate doesn't accept by the deadline.",   icon: Clock },
              { role: "Finance & audit", use: "Share quarterly statements with print blocking and a tight expiry — no copies floating around.",   icon: FileLock2 },
              { role: "Consultants",     use: "Deliver proposals with a kill switch. Lose the lead? Revoke the link and the deck is gone.",       icon: Zap },
              { role: "Publishers",      use: "Send review galleys with a hard embargo date. Revoke the link the moment a draft leaks early.",                                  icon: Newspaper },
            ].map(({ role, use, icon: Icon }) => (
              <motion.div
                key={role}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100 hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-blue-100 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
                </div>
                <h3 className="font-semibold text-blue-900 text-sm mb-2">{role}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{use}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 text-white">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(59,130,246,0.5), transparent 40%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.4), transparent 45%)",
            backgroundSize: "200% 200%",
          }}
        />
        <motion.div {...fadeUp} className="container mx-auto px-6 relative text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Your documents. Your countdown. Your call.</h2>
          <p className="text-blue-100/85 mb-8 max-w-md mx-auto">
            Open the app and protect your first PDF in under sixty seconds. No signup. No card. No catch.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={APP_URL}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-blue-700 font-bold transition-all shadow-xl shadow-blue-950/40 hover:-translate-y-0.5 hover:shadow-blue-950/60"
            >
              <Lock className="w-4 h-4" strokeWidth={2.5} />
              Open Luxor PDF Secure
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 backdrop-blur-sm transition-colors"
            >
              <Globe className="w-4 h-4" strokeWidth={2.2} />
              See pricing
            </a>
          </div>
        </motion.div>
      </section>
    </ProductPageLayout>
  );
}
