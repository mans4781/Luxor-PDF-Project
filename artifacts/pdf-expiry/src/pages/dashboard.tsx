import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench, FileOutput, FileInput, ShieldCheck,
  Calendar, Lock, Printer, ChevronLeft,
} from "lucide-react";
import { PdfUploadForm } from "@/components/pdf-upload-form";

const topCards = [
  {
    label: "PDF Tool",
    description: "Merge, split & extract pages",
    href: "/pdf-tool",
    icon: Wrench,
    bg: "bg-gradient-to-br from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100",
    border: "border-violet-200 hover:border-violet-400",
    iconBg: "bg-gradient-to-br from-violet-500 to-indigo-600",
    textColor: "text-violet-700",
    descColor: "text-violet-500",
  },
  {
    label: "Convert from PDF",
    description: "PDF to images or text",
    href: "/convert?tab=pdf-to-images",
    icon: FileOutput,
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100",
    border: "border-orange-200 hover:border-orange-400",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    textColor: "text-orange-700",
    descColor: "text-orange-500",
  },
  {
    label: "Convert to PDF",
    description: "Images & files to PDF",
    href: "/convert?tab=images-to-pdf",
    icon: FileInput,
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100",
    border: "border-emerald-200 hover:border-emerald-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    textColor: "text-emerald-700",
    descColor: "text-emerald-500",
  },
  {
    label: "Secure Your PDF",
    description: "Expiry, password & print controls",
    href: "#secure",
    icon: ShieldCheck,
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
  },
];

const secureSubCards = [
  {
    label: "Set Expiry Date",
    description: "Auto-lock after a chosen date",
    icon: Calendar,
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
  },
  {
    label: "Set Password",
    description: "Require a password to open",
    icon: Lock,
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
  },
  {
    label: "Print Control",
    description: "Restrict printing & copying",
    icon: Printer,
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
  },
];

function ToolCard({
  label, description, icon: Icon, bg, border, iconBg, textColor, descColor,
  onClick,
}: {
  label: string; description: string; icon: React.ElementType;
  bg: string; border: string; iconBg: string; textColor: string; descColor: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${bg} ${border}`}
      onClick={onClick}
      data-testid={`menu-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${iconBg}`}>
        <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
      </div>
      <div>
        <p className={`font-semibold text-sm leading-tight ${textColor}`}>{label}</p>
        <p className={`text-xs mt-0.5 leading-tight ${descColor}`}>{description}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [view, setView] = useState<"main" | "secure">("main");

  if (view === "secure") {
    return (
      <Layout>
        <div className="grid gap-6">
          {/* Back + header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("main")}
              className="flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-rose-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Secure Your PDF
            </span>
          </div>

          {/* Three sub-option cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {secureSubCards.map((card) => (
              <ToolCard key={card.label} {...card} />
            ))}
          </div>

          {/* Upload form */}
          <div className="max-w-md">
            <Card className="border-rose-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-rose-800">Secure & Upload</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <PdfUploadForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {topCards.map((item) => {
            const isSecure = item.label === "Secure Your PDF";
            if (isSecure) {
              return (
                <ToolCard key={item.label} {...item} onClick={() => setView("secure")} />
              );
            }
            return (
              <Link key={item.label} href={item.href} className="block no-underline">
                <ToolCard {...item} />
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
