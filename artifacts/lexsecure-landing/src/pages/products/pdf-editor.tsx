import { ProductPageLayout } from "@/components/layout/ProductPageLayout";
import { PenTool, Type, Image, Layers, Scissors, RotateCcw, Table2, CheckCircle2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Type,       title: "Text Editing",          desc: "Click any text block and edit it in-place. Change font, size, colour, and alignment — no PDF re-creation needed." },
  { icon: Image,      title: "Image Management",       desc: "Insert, replace, resize, and reposition images anywhere on the page. Supports PNG, JPEG, and SVG." },
  { icon: Layers,     title: "Page Operations",        desc: "Reorder, rotate, delete, and duplicate pages with drag-and-drop. Merge multiple PDFs in seconds." },
  { icon: Scissors,   title: "Crop & Redact",          desc: "Crop page margins or permanently redact sensitive text and images before sharing documents." },
  { icon: Table2,     title: "Form Fields",            desc: "Create and edit interactive form fields — text boxes, checkboxes, dropdowns — then flatten or keep them live." },
  { icon: Wand2,      title: "Smart Formatting",       desc: "Auto-detect and match existing fonts and styles when inserting new content so edits look seamless." },
];

function EditorMockup() {
  return (
    <svg viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
      <rect width="520" height="340" rx="12" fill="#1e1b4b" />
      <rect x="0" y="0" width="520" height="36" rx="12" fill="#0f0c29" />
      <circle cx="18" cy="18" r="5" fill="#ef4444" />
      <circle cx="34" cy="18" r="5" fill="#f59e0b" />
      <circle cx="50" cy="18" r="5" fill="#22c55e" />
      {/* Toolbar ribbon */}
      <rect x="0" y="36" width="520" height="40" fill="#1e1b4b" />
      {["T","A","▣","✂","↗","⊞"].map((sym, i) => (
        <g key={sym}>
          <rect x={10 + i * 44} y="44" width="36" height="24" rx="5" fill={i === 0 ? "#7c3aed" : "#312e81"} />
          <text x={28 + i * 44} y="60" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">{sym}</text>
        </g>
      ))}
      {/* Properties panel */}
      <rect x="0" y="76" width="110" height="264" fill="#0f0c29" />
      <text x="10" y="94" fill="#a5b4fc" fontSize="8" fontWeight="bold">PROPERTIES</text>
      <rect x="10" y="100" width="90" height="16" rx="3" fill="#1e1b4b" />
      <text x="16" y="112" fill="#c4b5fd" fontSize="8">Helvetica Bold</text>
      <rect x="10" y="120" width="40" height="14" rx="3" fill="#7c3aed" opacity="0.5" />
      <text x="15" y="131" fill="#ede9fe" fontSize="8">24 pt</text>
      <rect x="54" y="120" width="46" height="14" rx="3" fill="#1e1b4b" />
      <text x="59" y="131" fill="#c4b5fd" fontSize="8">Colour</text>
      {["#1e1b4b","#7c3aed","#a78bfa","#ddd6fe"].map((c, i) => (
        <circle key={c} cx={18 + i * 18} cy="152" r="6" fill={c} stroke="#4c1d95" strokeWidth="1" />
      ))}
      <text x="10" y="176" fill="#a5b4fc" fontSize="8" fontWeight="bold">LAYERS</text>
      {["Text Block","Image 1","Header","Footer"].map((l, i) => (
        <g key={l}>
          <rect x="10" y={182 + i * 22} width="90" height="18" rx="3" fill={i === 0 ? "#4c1d95" : "#1e1b4b"} />
          <text x="18" y={195 + i * 22} fill={i === 0 ? "#ede9fe" : "#6d28d9"} fontSize="8">{l}</text>
        </g>
      ))}
      {/* Main canvas */}
      <rect x="110" y="76" width="300" height="264" fill="white" />
      <rect x="130" y="96" width="200" height="14" rx="2" fill="#3730a3" />
      {/* editable text block with cursor */}
      <rect x="130" y="118" width="258" height="26" rx="3" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="136" y="135" fill="#4c1d95" fontSize="10" fontWeight="bold">Click to edit this text block</text>
      <rect x="130" y="150" width="255" height="5" rx="1" fill="#e2e8f0" />
      <rect x="130" y="158" width="240" height="5" rx="1" fill="#e2e8f0" />
      <rect x="130" y="166" width="258" height="5" rx="1" fill="#e2e8f0" />
      {/* Image placeholder */}
      <rect x="130" y="180" width="120" height="80" rx="4" fill="#ede9fe" stroke="#a78bfa" strokeWidth="1" />
      <text x="190" y="224" textAnchor="middle" fill="#7c3aed" fontSize="10">[ Image ]</text>
      <rect x="260" y="180" width="128" height="5" rx="1" fill="#e2e8f0" />
      <rect x="260" y="189" width="115" height="5" rx="1" fill="#e2e8f0" />
      <rect x="260" y="198" width="122" height="5" rx="1" fill="#e2e8f0" />
      <rect x="260" y="207" width="100" height="5" rx="1" fill="#e2e8f0" />
      <rect x="130" y="270" width="255" height="5" rx="1" fill="#e2e8f0" />
      <rect x="130" y="278" width="230" height="5" rx="1" fill="#e2e8f0" />
      {/* Right side panel */}
      <rect x="410" y="76" width="110" height="264" fill="#0f0c29" />
      <text x="420" y="94" fill="#a5b4fc" fontSize="8" fontWeight="bold">PAGES</text>
      {[0,1,2].map(i => (
        <g key={i}>
          <rect x="420" y={100 + i * 72} width="90" height="64" rx="3" fill={i === 0 ? "#312e81" : "#1e1b4b"} stroke={i === 0 ? "#7c3aed" : "none"} strokeWidth="1.5" />
          <rect x="428" y={106 + i * 72} width="74" height="6" rx="1" fill="#4c1d95" />
          <rect x="428" y={114 + i * 72} width="68" height="3" rx="1" fill="#1e1b4b" />
          <rect x="428" y={119 + i * 72} width="72" height="3" rx="1" fill="#1e1b4b" />
          <text x="465" y={155 + i * 72} textAnchor="middle" fill="#6d28d9" fontSize="8">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export default function PdfEditorPage() {
  return (
    <ProductPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 text-white py-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-6">
                <PenTool className="w-4 h-4" strokeWidth={2} />
                Luxor PDF Editor
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6 text-white">
                Edit PDFs like a <span className="text-violet-300">word processor</span>
              </h1>
              <p className="text-purple-200 text-lg leading-relaxed mb-8">
                True PDF editing without the complexity. Modify text, swap images, rearrange pages, create forms, and redact sensitive content — all in one intuitive desktop app.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#download" className="px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-colors shadow-lg shadow-violet-500/30">
                  Download Editor
                </a>
                <a href="#features" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-colors">
                  View Features
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              <EditorMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-violet-600 py-6">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white text-center">
            {[["True Editing","Not just annotations"], ["50+ Fonts","Built-in typeface library"], ["Non-destructive","Original always preserved"], ["PDF/A Ready","Archival-compliant output"]].map(([val, lbl]) => (
              <div key={lbl}><p className="text-xl font-bold">{val}</p><p className="text-violet-200 text-sm">{lbl}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Powerful editing, zero complexity</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Everything you need to edit professional PDFs without a steep learning curve.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-600" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/after comparison */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">From outdated to polished in minutes</h2>
            <p className="text-slate-500">Luxor PDF Editor lets you correct errors, refresh branding, and update content without ever touching the source document.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-4">Before — original PDF</p>
              <div className="space-y-2">
                {["Old company logo placeholder","Wrong contact number","Outdated pricing table","Misaligned footer text"].map(t => (
                  <div key={t} className="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span className="text-sm text-rose-700 line-through">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-4">After — edited with Luxor PDF</p>
              <div className="space-y-2">
                {["New logo inserted & scaled","Correct contact updated","Pricing table refreshed","Footer perfectly aligned"].map(t => (
                  <div key={t} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm text-emerald-700">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-violet-900 to-purple-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Edit your first PDF for free</h2>
          <p className="text-violet-200 mb-8 max-w-md mx-auto">No subscription required to start. Upgrade when you need advanced features.</p>
          <a href="#download" className="inline-block px-8 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold transition-colors shadow-xl shadow-violet-500/30">
            Download Luxor PDF Editor
          </a>
        </div>
      </section>
    </ProductPageLayout>
  );
}
