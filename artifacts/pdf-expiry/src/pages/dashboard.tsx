import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileOutput, FileInput, ShieldCheck, Calendar, Lock, Printer } from "lucide-react";
import { PdfUploadForm } from "@/components/pdf-upload-form";

const menuItems = [
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

export default function Dashboard() {
  const [secureOpen, setSecureOpen] = useState(false);

  return (
    <Layout>
      <div className="grid gap-6">

        {/* ── Quick Access Menu ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSecure = item.label === "Secure Your PDF";

            const cardContent = (
              <div
                className={`flex flex-col items-center text-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${item.bg} ${item.border} ${
                  isSecure && secureOpen ? "ring-2 ring-rose-400 ring-offset-1" : ""
                }`}
                data-testid={`menu-card-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${item.iconBg}`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <p className={`font-semibold text-sm leading-tight ${item.textColor}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 leading-tight ${item.descColor}`}>{item.description}</p>
                </div>
              </div>
            );

            if (isSecure) {
              return (
                <div key={item.label} onClick={() => setSecureOpen(v => !v)}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link key={item.label} href={item.href} className="block no-underline">
                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* ── Secure Your PDF panel (shown on click) ── */}
        <div
          id="secure"
          className={`grid transition-all duration-300 ease-in-out ${
            secureOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <Card className="border-rose-200 max-w-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-rose-800">Secure Your PDF</CardTitle>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { icon: Calendar, label: "Expiry Date" },
                    { icon: Lock,     label: "Password" },
                    { icon: Printer,  label: "Print Control" },
                  ].map(({ icon: FIcon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <FIcon className="w-3 h-3" />{label}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <PdfUploadForm />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Layout>
  );
}
