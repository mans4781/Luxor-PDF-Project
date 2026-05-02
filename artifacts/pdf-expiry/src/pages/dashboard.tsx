import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  Wrench,
  FileOutput,
  FileInput,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PdfToolContent } from "./pdf-tool";
import { ConvertToolContent } from "./convert-tool";
import { SecurePdfContent } from "./secure-pdf";

type ToolKey = "pdf-tool" | "convert-from" | "convert-to" | "secure-pdf";

type ToolItem = {
  key: ToolKey;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconText: string;
  activeRing: string;
  badge?: string;
};

const TOOLS: ToolItem[] = [
  {
    key: "pdf-tool",
    label: "Edit Your PDF",
    description: "Merge, split & extract pages",
    icon: Wrench,
    accent: "#312E81",
    iconBg: "bg-indigo-50 group-hover:bg-indigo-100",
    iconText: "text-indigo-700",
    activeRing: "ring-indigo-500/40 border-indigo-500",
  },
  {
    key: "convert-from",
    label: "Convert from PDF",
    description: "PDF to images or text",
    icon: FileOutput,
    accent: "#2563EB",
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
    iconText: "text-blue-700",
    activeRing: "ring-blue-500/40 border-blue-500",
  },
  {
    key: "convert-to",
    label: "Convert to PDF",
    description: "Images & files to PDF",
    icon: FileInput,
    accent: "#059669",
    iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
    iconText: "text-emerald-700",
    activeRing: "ring-emerald-500/40 border-emerald-500",
  },
  {
    key: "secure-pdf",
    label: "Secure your PDF",
    description: "Expiry, password & print controls",
    icon: ShieldCheck,
    accent: "#DC2626",
    iconBg: "bg-rose-50 group-hover:bg-rose-100",
    iconText: "text-rose-700",
    activeRing: "ring-rose-500/40 border-rose-500",
    badge: "Signature",
  },
];

function WelcomePanel() {
  return (
    <div className="h-full flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-12">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-rose-50 border border-slate-200 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-8 h-8 text-[#DC2626]" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Choose a tool to get started
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Every action is processed locally in your browser. Your files never
          leave your device.
        </p>
      </div>
    </div>
  );
}

function RightPanel({ active }: { active: ToolKey | null }) {
  if (!active) return <WelcomePanel />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 overflow-y-auto">
      {active === "pdf-tool" && <PdfToolContent />}
      {active === "convert-from" && (
        <ConvertToolContent
          defaultTab="pdf-to-images"
          tabs={["pdf-to-images", "pdf-to-word", "pdf-to-excel"]}
        />
      )}
      {active === "convert-to" && (
        <ConvertToolContent
          defaultTab="images-to-pdf"
          tabs={["images-to-pdf", "word-to-pdf", "excel-to-pdf"]}
        />
      )}
      {active === "secure-pdf" && <SecurePdfContent />}
    </div>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState<ToolKey | null>("pdf-tool");

  return (
    <Layout>
      {/* Hero / page title — echoes landing page hero */}
      <div className="mb-7 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e3a8a] bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3 text-[#DC2626]" strokeWidth={2.5} />
            Luxor PDF · Workspace
          </div>
          <h1 className="text-[34px] leading-tight font-extrabold tracking-tight text-slate-900">
            Your{" "}
            <span className="bg-gradient-to-r from-[#1e3a8a] to-[#DC2626] bg-clip-text text-transparent">
              secure
            </span>{" "}
            PDF toolkit.
          </h1>
          <p className="text-[15px] text-slate-500 mt-2 max-w-xl leading-relaxed">
            Edit, convert and secure documents — everything runs locally in
            your browser for complete privacy.
          </p>
        </div>
      </div>

      {/* Two-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left: tool list ── */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-2.5">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(isActive ? null : item.key)}
                className={`group text-left bg-white rounded-xl border transition-all duration-200 px-4 py-4 ${
                  isActive
                    ? `border-2 ring-4 shadow-md ${item.activeRing}`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
                data-testid={`menu-card-${item.label
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.iconBg}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${item.iconText}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[15px] text-slate-900 leading-tight whitespace-nowrap">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-all ${
                      isActive
                        ? "rotate-90 text-slate-700"
                        : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {/* Footer note in sidebar */}
          <div className="mt-2 px-4 py-3 rounded-xl bg-slate-100/70 border border-slate-200">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Tip:</span> Click an
              active tool again to collapse it back to this overview.
            </p>
          </div>
        </aside>

        {/* ── Right: active tool ── */}
        <section className="lg:col-span-8 xl:col-span-9 min-h-[560px]">
          <RightPanel active={active} />
        </section>
      </div>
    </Layout>
  );
}
