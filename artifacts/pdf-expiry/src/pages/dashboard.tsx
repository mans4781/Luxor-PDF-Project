import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Wrench, FileOutput, FileInput, ShieldCheck, ArrowRight } from "lucide-react";

const menuItems = [
  {
    label: "PDF Tool",
    description: "Merge, split & extract pages",
    href: "/pdf-tool",
    icon: Wrench,
    iconBg: "bg-gradient-to-br from-violet-500 to-indigo-600",
    bg: "bg-gradient-to-br from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100",
    border: "border-violet-200 hover:border-violet-400",
    textColor: "text-violet-700",
    descColor: "text-violet-500",
    arrowColor: "text-violet-400",
  },
  {
    label: "Convert from PDF",
    description: "PDF to images or text",
    href: "/convert?tab=pdf-to-images",
    icon: FileOutput,
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100",
    border: "border-orange-200 hover:border-orange-400",
    textColor: "text-orange-700",
    descColor: "text-orange-500",
    arrowColor: "text-orange-400",
  },
  {
    label: "Convert to PDF",
    description: "Images & files to PDF",
    href: "/convert?tab=images-to-pdf",
    icon: FileInput,
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100",
    border: "border-emerald-200 hover:border-emerald-400",
    textColor: "text-emerald-700",
    descColor: "text-emerald-500",
    arrowColor: "text-emerald-400",
  },
  {
    label: "Secure Your PDF",
    description: "Expiry, password & print controls",
    href: "/secure-pdf",
    icon: ShieldCheck,
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
    arrowColor: "text-rose-400",
  },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="flex gap-8">

        {/* ── Left side: vertical tool cards ── */}
        <div className="flex flex-col gap-3 w-72 shrink-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="block no-underline">
                <div
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${item.bg} ${item.border}`}
                  data-testid={`menu-card-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 ${item.iconBg}`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-tight ${item.textColor}`}>{item.label}</p>
                    <p className={`text-xs mt-0.5 leading-tight ${item.descColor}`}>{item.description}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 ${item.arrowColor}`} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Right side: placeholder / welcome ── */}
        <div className="flex-1 flex items-center justify-center min-h-[320px]">
          <div className="text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">Select a tool to get started</p>
            <p className="text-xs mt-1 text-slate-400">Choose from the tools on the left</p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
