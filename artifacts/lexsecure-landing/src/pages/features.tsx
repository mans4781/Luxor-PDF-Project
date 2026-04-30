import { motion } from "framer-motion";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Lock, FileSignature, BookOpen, PenTool, Layers, Clock, ShieldCheck,
  Zap, Globe, Smartphone, Users, FileSearch, Download, Eye, RefreshCw,
  CheckCircle, ArrowRight,
} from "lucide-react";

const FADE_UP = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SLIDE_LEFT = {
  hidden: { opacity: 0, x: -56 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const SLIDE_RIGHT = {
  hidden: { opacity: 0, x: 56 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const SCALE_UP = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const STAGGER_LIST = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const LIST_ITEM = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const TABLE_ROW = {
  hidden: { opacity: 0, x: -24 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Inline SVG Illustrations ──────────────────────────────────────────────────

function IlluExpiry() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#fff8f8" />
      {/* Document */}
      <rect x="120" y="40" width="160" height="210" rx="10" fill="white" stroke="#fca5a5" strokeWidth="2" />
      <rect x="140" y="70" width="100" height="8" rx="4" fill="#fca5a5" opacity="0.6" />
      <rect x="140" y="88" width="120" height="6" rx="3" fill="#fecaca" opacity="0.5" />
      <rect x="140" y="102" width="80" height="6" rx="3" fill="#fecaca" opacity="0.5" />
      <rect x="140" y="116" width="110" height="6" rx="3" fill="#fecaca" opacity="0.4" />
      <rect x="140" y="130" width="90" height="6" rx="3" fill="#fecaca" opacity="0.4" />
      <rect x="140" y="150" width="120" height="6" rx="3" fill="#fecaca" opacity="0.3" />
      <rect x="140" y="164" width="70" height="6" rx="3" fill="#fecaca" opacity="0.3" />
      {/* Lock overlay */}
      <circle cx="200" cy="200" r="36" fill="#ef4444" opacity="0.12" />
      <circle cx="200" cy="200" r="26" fill="#ef4444" opacity="0.2" />
      <rect x="188" y="196" width="24" height="18" rx="4" fill="#ef4444" />
      <path d="M192 196v-5a8 8 0 0 1 16 0v5" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Clock / timer */}
      <circle cx="340" cy="100" r="60" fill="white" stroke="#fca5a5" strokeWidth="2" />
      <circle cx="340" cy="100" r="50" fill="#fff1f2" />
      <line x1="340" y1="100" x2="340" y2="65" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <line x1="340" y1="100" x2="362" y2="112" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <circle cx="340" cy="100" r="5" fill="#ef4444" />
      <text x="310" y="175" fill="#ef4444" fontSize="13" fontWeight="700" fontFamily="system-ui">EXPIRED</text>
      {/* Sparks */}
      {[[290,230],[350,250],[310,260],[370,220]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="4" fill="#ef4444" opacity={0.3 - i*0.05} />
      ))}
    </svg>
  );
}

function IlluESign() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#f0fdf4" />
      {/* Document */}
      <rect x="80" y="30" width="200" height="240" rx="10" fill="white" stroke="#86efac" strokeWidth="2" />
      <rect x="106" y="60" width="130" height="8" rx="4" fill="#86efac" opacity="0.6" />
      <rect x="106" y="78" width="148" height="6" rx="3" fill="#bbf7d0" opacity="0.5" />
      <rect x="106" y="92" width="100" height="6" rx="3" fill="#bbf7d0" opacity="0.5" />
      <rect x="106" y="106" width="140" height="6" rx="3" fill="#bbf7d0" opacity="0.4" />
      <rect x="106" y="120" width="90" height="6" rx="3" fill="#bbf7d0" opacity="0.4" />
      <rect x="106" y="140" width="148" height="6" rx="3" fill="#bbf7d0" opacity="0.3" />
      <rect x="106" y="154" width="80" height="6" rx="3" fill="#bbf7d0" opacity="0.3" />
      <rect x="106" y="168" width="120" height="6" rx="3" fill="#bbf7d0" opacity="0.3" />
      {/* Signature line */}
      <rect x="106" y="210" width="148" height="1.5" fill="#86efac" />
      {/* Signature stroke */}
      <path d="M110 204 C118 196, 126 210, 134 202 C140 196, 148 208, 158 200 C164 196, 172 210, 180 200 C186 194, 192 206, 200 200" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Checkmark badge */}
      <circle cx="340" cy="120" r="64" fill="white" stroke="#86efac" strokeWidth="2" />
      <circle cx="340" cy="120" r="54" fill="#dcfce7" />
      <circle cx="340" cy="120" r="38" fill="#16a34a" />
      <path d="M320 120 L334 134 L362 108" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="296" y="205" fill="#16a34a" fontSize="11" fontWeight="700" fontFamily="system-ui">VERIFIED & SIGNED</text>
      {/* Dots */}
      {[[100,270],[140,280],[180,272],[220,278]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="4" fill="#86efac" opacity={0.4} />
      ))}
    </svg>
  );
}

function IlluAnnotate() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#eff6ff" />
      {/* PDF page */}
      <rect x="70" y="20" width="200" height="260" rx="10" fill="white" stroke="#93c5fd" strokeWidth="2" />
      <rect x="92" y="50" width="120" height="8" rx="4" fill="#93c5fd" opacity="0.6" />
      {/* Highlighted text rows */}
      <rect x="92" y="70" width="154" height="9" rx="3" fill="#fef08a" opacity="0.9" />
      <rect x="92" y="85" width="130" height="9" rx="3" fill="#fef08a" opacity="0.9" />
      <rect x="92" y="102" width="154" height="7" rx="3" fill="#bfdbfe" opacity="0.5" />
      <rect x="92" y="116" width="110" height="7" rx="3" fill="#bfdbfe" opacity="0.4" />
      <rect x="92" y="130" width="140" height="7" rx="3" fill="#bfdbfe" opacity="0.3" />
      {/* Underline */}
      <rect x="92" y="150" width="130" height="7" rx="3" fill="#e2e8f0" opacity="0.5" />
      <rect x="92" y="158" width="130" height="1.5" fill="#3b82f6" />
      {/* Comment pin */}
      <circle cx="252" cy="78" r="12" fill="#3b82f6" />
      <path d="M252 84 L248 92 L256 92 Z" fill="#3b82f6" />
      <text x="248" y="83" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui">!</text>
      {/* Pencil tool panel */}
      <rect x="310" y="30" width="140" height="240" rx="12" fill="white" stroke="#93c5fd" strokeWidth="1.5" />
      <rect x="310" y="30" width="140" height="44" rx="12" fill="#3b82f6" />
      <rect x="310" y="54" width="140" height="20" rx="0" fill="#3b82f6" />
      <text x="322" y="57" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Annotations</text>
      {[
        { y: 90,  icon: "✏️", label: "Draw" },
        { y: 124, icon: "🔍", label: "Highlight" },
        { y: 158, icon: "💬", label: "Comment" },
        { y: 192, icon: "⬛", label: "Rectangle" },
        { y: 226, icon: "T",  label: "Add Text" },
      ].map(({ y, icon, label }) => (
        <g key={label}>
          <rect x="322" y={y} width="116" height="28" rx="7" fill="#eff6ff" />
          <text x="334" y={y+18} fontSize="13" fontFamily="system-ui">{icon}</text>
          <text x="352" y={y+18} fill="#1d4ed8" fontSize="12" fontWeight="600" fontFamily="system-ui">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function IlluSecurity() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#faf5ff" />
      {/* Shield */}
      <path d="M240 20 L340 60 L340 160 Q340 220 240 260 Q140 220 140 160 L140 60 Z" fill="white" stroke="#c4b5fd" strokeWidth="2" />
      <path d="M240 40 L320 72 L320 158 Q320 208 240 244 Q160 208 160 158 L160 72 Z" fill="#f3e8ff" />
      {/* Lock */}
      <rect x="214" y="136" width="52" height="42" rx="8" fill="#7c3aed" />
      <path d="M222 136v-14a18 18 0 0 1 36 0v14" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="240" cy="154" r="6" fill="white" />
      <rect x="238" y="156" width="4" height="10" rx="2" fill="white" />
      {/* AES badge */}
      <rect x="360" y="50" width="90" height="34" rx="8" fill="#7c3aed" />
      <text x="372" y="71" fill="white" fontSize="13" fontWeight="800" fontFamily="system-ui">AES-256</text>
      {/* Redact strips */}
      <rect x="50" y="100" width="74" height="12" rx="4" fill="#1e1b4b" opacity="0.85" />
      <rect x="50" y="120" width="58" height="12" rx="4" fill="#1e1b4b" opacity="0.85" />
      <rect x="50" y="140" width="68" height="12" rx="4" fill="#1e1b4b" opacity="0.85" />
      {/* Stars / sparkles */}
      {[[380,140],[400,170],[370,190],[410,200]].map(([cx,cy],i)=>(
        <g key={i} transform={`translate(${cx},${cy})`}>
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#a78bfa" strokeWidth="2" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#a78bfa" strokeWidth="2" />
        </g>
      ))}
      <text x="362" y="248" fill="#7c3aed" fontSize="11" fontWeight="700" fontFamily="system-ui">Bank-grade Security</text>
    </svg>
  );
}

function IlluConvert() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#ecfdf5" />
      {/* Input file */}
      <rect x="40" y="80" width="140" height="140" rx="12" fill="white" stroke="#6ee7b7" strokeWidth="2" />
      <rect x="60" y="108" width="100" height="60" rx="6" fill="#d1fae5" />
      <text x="98" y="144" fill="#059669" fontSize="11" fontWeight="700" fontFamily="system-ui">JPG</text>
      <rect x="60" y="180" width="80" height="7" rx="3" fill="#a7f3d0" opacity="0.6" />
      <rect x="60" y="194" width="60" height="7" rx="3" fill="#a7f3d0" opacity="0.4" />
      {/* Arrow */}
      <g transform="translate(240,150)">
        <circle r="34" fill="#10b981" />
        <path d="M-14 0 L8 0 M2 -8 L14 0 L2 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M-14 -12 A18 18 0 0 1 14 -12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M-14 12 A18 18 0 0 0 14 12" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      {/* Output PDF */}
      <rect x="300" y="80" width="140" height="140" rx="12" fill="white" stroke="#6ee7b7" strokeWidth="2" />
      <rect x="320" y="108" width="100" height="60" rx="6" fill="#d1fae5" />
      <text x="356" y="140" fill="#059669" fontSize="11" fontWeight="700" fontFamily="system-ui">PDF</text>
      <rect x="320" y="108" width="100" height="60" rx="6" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="320" y="180" width="80" height="7" rx="3" fill="#a7f3d0" opacity="0.6" />
      <rect x="320" y="194" width="60" height="7" rx="3" fill="#a7f3d0" opacity="0.4" />
      {/* Format chips */}
      {[["JPG","#10b981",40],["PNG","#3b82f6",86],["WEBP","#a78bfa",136],["GIF","#f59e0b",186],["BMP","#ef4444",232]].map(([label,color,x])=>(
        <g key={label as string}>
          <rect x={x as number} y="248" width="38" height="22" rx="6" fill={color as string} opacity="0.15" />
          <rect x={x as number} y="248" width="38" height="22" rx="6" fill="none" stroke={color as string} strokeWidth="1.2" />
          <text x={(x as number)+6} y="263" fill={color as string} fontSize="10" fontWeight="700" fontFamily="system-ui">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function IlluCollaborate() {
  return (
    <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="480" height="300" fill="#f0f9ff" />
      {/* Central doc */}
      <rect x="180" y="50" width="120" height="160" rx="10" fill="white" stroke="#7dd3fc" strokeWidth="2" />
      <rect x="198" y="74" width="80" height="7" rx="3" fill="#7dd3fc" opacity="0.7" />
      <rect x="198" y="88" width="64" height="5" rx="2.5" fill="#bae6fd" opacity="0.5" />
      <rect x="198" y="100" width="76" height="5" rx="2.5" fill="#bae6fd" opacity="0.5" />
      <rect x="198" y="112" width="56" height="5" rx="2.5" fill="#bae6fd" opacity="0.4" />
      <rect x="198" y="130" width="80" height="5" rx="2.5" fill="#bae6fd" opacity="0.3" />
      <rect x="198" y="142" width="50" height="5" rx="2.5" fill="#bae6fd" opacity="0.3" />
      {/* User avatars */}
      {[
        { cx: 80,  cy: 80,  color: "#3b82f6", letter: "A" },
        { cx: 80,  cy: 180, color: "#10b981", letter: "B" },
        { cx: 400, cy: 80,  color: "#a78bfa", letter: "C" },
        { cx: 400, cy: 180, color: "#f59e0b", letter: "D" },
      ].map(({ cx, cy, color, letter }) => (
        <g key={letter}>
          <line x1={cx < 240 ? cx+24 : cx-24} y1={cy} x2={cx < 240 ? 180 : 300} y2={cy < 130 ? 90 : 170} stroke={color} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
          <circle cx={cx} cy={cy} r="24" fill={color} opacity="0.12" />
          <circle cx={cx} cy={cy} r="18" fill={color} />
          <text x={cx-5} y={cy+5} fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">{letter}</text>
        </g>
      ))}
      {/* Online badge */}
      <rect x="172" y="224" width="136" height="32" rx="10" fill="#0ea5e9" />
      <circle cx="190" cy="240" r="5" fill="#4ade80" />
      <text x="200" y="245" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui">4 collaborators</text>
    </svg>
  );
}

// ── Feature data ──────────────────────────────────────────────────────────────
const HERO_FEATURES = [
  {
    id: "expiry",
    tag: "Expiry & Access",
    title: "Documents that self-destruct on your terms",
    body: "Set a precise expiration date on any shared PDF. Once the deadline passes, the file becomes inaccessible — no retrieval, no workarounds. Revoke access instantly from your dashboard without re-sending.",
    color: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    icon: Clock,
    iconColor: "text-rose-600",
    bullets: ["Exact date + time expiry", "Instant remote revocation", "Download attempt logging", "Corrupted fallback protection"],
    Illustration: IlluExpiry,
    flip: false,
  },
  {
    id: "esign",
    tag: "eSignatures",
    title: "Legally binding signatures in seconds",
    body: "Send contracts, collect signatures and track every step with a full audit trail. Compliant with eIDAS, ESIGN Act and UETA. Signers don't need an account — just click and sign.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: FileSignature,
    iconColor: "text-emerald-600",
    bullets: ["Multi-party signing workflows", "Full timestamped audit trail", "eIDAS / ESIGN / UETA compliant", "No signer account required"],
    Illustration: IlluESign,
    flip: true,
  },
  {
    id: "annotate",
    tag: "PDF Reader & Annotations",
    title: "Read, mark up and comment like a pro",
    body: "A lightning-fast PDF viewer with professional annotation tools: highlight text, draw freehand, add sticky comments, insert text boxes, draw rectangles and use the eraser — with full undo history.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-neutral-100",
    border: "border-blue-100",
    icon: BookOpen,
    iconColor: "text-blue-600",
    bullets: ["Text highlight with colour picker", "Freehand drawing + eraser", "Comment pins & sticky notes", "Undo / redo history"],
    Illustration: IlluAnnotate,
    flip: false,
  },
  {
    id: "security",
    tag: "Security & Redaction",
    title: "Enterprise-grade protection built in",
    body: "Encrypt PDFs with AES-256, set owner passwords, restrict printing and copying. Permanently redact sensitive text and images — black-box redaction that can't be reversed.",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: ShieldCheck,
    iconColor: "text-violet-600",
    bullets: ["AES-256 encryption", "Permanent black-box redaction", "Print / copy restrictions", "Password protection"],
    Illustration: IlluSecurity,
    flip: true,
  },
  {
    id: "convert",
    tag: "Conversion Tools",
    title: "Convert anything to or from PDF",
    body: "Turn JPG, PNG, WEBP, GIF and BMP images into pristine PDFs in one click. Extract text and images back out. All processing happens locally in your browser — your files never leave your machine.",
    color: "from-teal-500 to-green-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
    icon: RefreshCw,
    iconColor: "text-teal-600",
    bullets: ["5 image formats supported", "Extract text from PDF", "100% local processing", "No uploads to any server"],
    Illustration: IlluConvert,
    flip: false,
  },
  {
    id: "collaborate",
    tag: "Team Collaboration",
    title: "Work together on documents, seamlessly",
    body: "Invite teammates, share documents with granular permissions, and track every action in a real-time activity feed. Comment threads, version history and role-based access keep teams aligned.",
    color: "from-sky-500 to-blue-500",
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: Users,
    iconColor: "text-sky-600",
    bullets: ["Granular permission levels", "Shared comment threads", "Activity feed + version history", "Real-time status tracking"],
    Illustration: IlluCollaborate,
    flip: true,
  },
];

const GRID_FEATURES = [
  { icon: Zap,         color: "text-amber-500",  bg: "bg-amber-50",  title: "Lightning Fast",       desc: "PDF.js rendering engine loads even 1000-page docs in under a second." },
  { icon: Globe,       color: "text-blue-500",   bg: "bg-neutral-100",   title: "Works Everywhere",     desc: "Browser-based — no install required on Windows, Mac, Linux or Chromebook." },
  { icon: Smartphone,  color: "text-violet-500", bg: "bg-violet-50", title: "Mobile Ready",         desc: "Fully responsive. Pinch-to-zoom, swipe-to-turn-page on any phone or tablet." },
  { icon: FileSearch,  color: "text-teal-500",   bg: "bg-teal-50",   title: "Full-Text Search",     desc: "Ctrl+F search across every page. Jump to results instantly." },
  { icon: Layers,      color: "text-indigo-500", bg: "bg-indigo-50", title: "Merge & Split",        desc: "Combine multiple PDFs or split a single doc into individual pages." },
  { icon: Download,    color: "text-green-500",  bg: "bg-green-50",  title: "Offline Access",       desc: "Download any document for offline use. Works without internet once loaded." },
  { icon: Eye,         color: "text-rose-500",   bg: "bg-rose-50",   title: "View-Only Mode",       desc: "Share a read-only preview link with no download option enabled." },
  { icon: Lock,        color: "text-orange-500", bg: "bg-orange-50", title: "Zero-Knowledge",       desc: "We never read your PDFs. All encryption happens in your browser." },
];

const STATS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "AES-256", label: "Encryption Standard" },
  { value: "<1s", label: "Average Load Time" },
  { value: "0", label: "Files Stored Server-Side" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-36 pb-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" custom={0} variants={FADE_UP}
            className="inline-flex items-center gap-2 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Zap className="w-3.5 h-3.5 text-[#2563EB]" /> Everything you need in one platform
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" custom={1} variants={FADE_UP}
            className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Powerful features.<br />
            <span className="text-neutral-400">Uncompromising security.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" custom={2} variants={FADE_UP}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Luxor PDF is a complete document platform — from secure sharing and eSignatures to professional annotation and enterprise encryption.
          </motion.p>
          <motion.div initial="hidden" animate="visible" custom={3} variants={FADE_UP}
            className="flex flex-wrap justify-center gap-4">
            <a href="#features-list" className="inline-flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#171717] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Explore features <ArrowRight className="w-4 h-4" />
            </a>
            <Link href="/pricing" className="inline-flex items-center gap-2 border border-neutral-200 hover:border-neutral-400 text-foreground px-6 py-3 rounded-lg font-semibold transition-colors">
              See pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-slate-900 py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <motion.div key={s.label}
                initial="hidden" whileInView="visible" custom={i} variants={SCALE_UP} viewport={{ once: true }}
                whileHover={{ scale: 1.07 }}
                className="text-center cursor-default">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold text-white mb-1"
                >{s.value}</motion.div>
                <div className="text-slate-400 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Highlights (alternating) ── */}
      <section id="features-list" className="py-24">
        <div className="container mx-auto px-6">
          <div className="space-y-28">
            {HERO_FEATURES.map((feat) => {
              const Icon = feat.icon;
              const Illu = feat.Illustration;
              const textVariant  = feat.flip ? SLIDE_RIGHT : SLIDE_LEFT;
              const illuVariant  = feat.flip ? SLIDE_LEFT  : SLIDE_RIGHT;
              return (
                <div
                  key={feat.id}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center`}
                >
                  {/* Text block */}
                  <motion.div
                    className={feat.flip ? "lg:order-2" : ""}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={textVariant}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${feat.iconColor}`} />
                      </motion.div>
                      <span className={`text-sm font-bold uppercase tracking-widest bg-gradient-to-r ${feat.color} bg-clip-text text-transparent`}>
                        {feat.tag}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
                      {feat.title}
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      {feat.body}
                    </p>
                    <motion.ul
                      className="space-y-3"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={STAGGER_LIST}
                    >
                      {feat.bullets.map(b => (
                        <motion.li key={b} variants={LIST_ITEM} className="flex items-center gap-3">
                          <motion.span whileHover={{ scale: 1.3 }} transition={{ type: "spring", stiffness: 400 }}>
                            <CheckCircle className={`w-5 h-5 flex-shrink-0 ${feat.iconColor}`} />
                          </motion.span>
                          <span className="text-foreground font-medium">{b}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>

                  {/* Illustration */}
                  <motion.div
                    className={feat.flip ? "lg:order-1" : ""}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={illuVariant}
                    whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(0,0,0,0.12)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className={`rounded-2xl border-2 ${feat.border} overflow-hidden shadow-lg aspect-[16/10]`}>
                      <Illu />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={FADE_UP}
            className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">And much more</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Dozens of thoughtful details that make every workflow faster and safer.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {GRID_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  custom={i}
                  variants={SCALE_UP}
                  whileHover={{ y: -8, scale: 1.03, boxShadow: "0 20px 40px rgba(0,0,0,0.10)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="bg-white rounded-2xl border border-slate-100 p-6 cursor-default"
                >
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.18 }}
                    transition={{ type: "spring", stiffness: 350 }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </motion.div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP}
            className="text-center mb-14">
            <h2 className="text-4xl font-bold text-foreground mb-4">How we compare</h2>
            <p className="text-muted-foreground text-lg">See why professionals choose Luxor PDF over the alternatives.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left py-4 px-6 font-semibold">Feature</th>
                  {["Luxor PDF","Adobe Acrobat","DocuSign","Others"].map(h=>(
                    <th key={h} className={`py-4 px-4 font-semibold text-center ${h==="Luxor PDF" ? "text-white" : "text-slate-400"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["PDF Expiry & Auto-revoke",     true,  false, false, false],
                  ["eSignatures",                  true,  false, true,  false],
                  ["Annotation Tools",             true,  true,  false, true ],
                  ["AES-256 Encryption",           true,  true,  false, false],
                  ["Local Processing (no upload)", true,  false, false, false],
                  ["Team Collaboration",           true,  true,  true,  false],
                  ["Free Tier Available",          true,  false, false, true ],
                  ["No Per-doc Fees",              true,  false, false, true ],
                ].map(([label,...vals], ri) => (
                  <motion.tr
                    key={String(label)}
                    custom={ri}
                    variants={TABLE_ROW}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    whileHover={{ backgroundColor: "#f1f5f9" }}
                    className={ri%2===0 ? "bg-white" : "bg-slate-50/70"}
                  >
                    <td className="py-3.5 px-6 text-foreground font-medium">{label}</td>
                    {vals.map((v, ci) => (
                      <td key={ci} className="py-3.5 px-4 text-center">
                        <motion.span
                          whileHover={{ scale: 1.3 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            v
                              ? ci===0 ? "bg-neutral-100 text-neutral-900" : "bg-emerald-50 text-emerald-500"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >{v ? "✓" : "✕"}</motion.span>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#0A0A0A] overflow-hidden relative">
        {/* Floating blobs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5 pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-40px] right-[-40px] w-80 h-80 rounded-full bg-white/5 pointer-events-none"
        />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={FADE_UP}
            className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to get started?
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={FADE_UP}
            className="text-neutral-300 text-xl mb-10 max-w-xl mx-auto">
            Join thousands of professionals who trust Luxor PDF to protect and manage their documents.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={FADE_UP}
            className="flex flex-wrap justify-center gap-4">
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link href="/pricing"
                className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] px-8 py-3.5 rounded-lg font-bold text-lg hover:bg-neutral-100 transition-colors shadow-md">
                View Pricing <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 300 }}>
              <a href="#"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors">
                Try for Free
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
