import { FileText, PenLine, ShieldCheck, Monitor, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminStats } from "../types";
import { PageHeader, StatusBadge, fmtBytes, fmtNum } from "../shared";

export function ProductsPage({ stats }: { stats: AdminStats }) {
  const { overview } = stats;

  const products = [
    {
      name: "Luxor PDF Secure",
      icon: ShieldCheck,
      color: "from-[#2563EB] to-[#6D5DFB]",
      desc: "Password protection, expiry control and secure sharing for PDFs.",
      status: "active",
      metrics: [
        { k: "Documents", v: fmtNum(overview.totalPdfs) },
        { k: "Active", v: fmtNum(overview.activePdfs) },
        { k: "Expired", v: fmtNum(overview.expiredPdfs) },
        { k: "Storage", v: fmtBytes(overview.totalStorageBytes) },
      ],
      href: "/",
    },
    {
      name: "Luxor PDF Reader",
      icon: FileText,
      color: "from-red-500 to-rose-400",
      desc: "High-performance reader with annotations, themes and premium tools.",
      status: "active",
      metrics: [
        { k: "Platform", v: "Web + Windows" },
        { k: "Reading", v: "Free" },
        { k: "Premium", v: "Sign-in gated" },
        { k: "Desktop", v: "v0.1.x" },
      ],
      href: "/luxor-pdf/",
    },
    {
      name: "LexSign eSign",
      icon: PenLine,
      color: "from-emerald-500 to-teal-400",
      desc: "Document e-signing workflows for individuals and teams.",
      status: "active",
      metrics: [
        { k: "Platform", v: "Web" },
        { k: "Waitlist", v: "Open" },
        { k: "Suite SSO", v: "Yes" },
        { k: "Stage", v: "Early access" },
      ],
      href: "/esign-app/",
    },
    {
      name: "Desktop Apps",
      icon: Monitor,
      color: "from-slate-600 to-slate-400",
      desc: "Windows desktop wrappers with auto-update via GitHub Releases.",
      status: "active",
      metrics: [
        { k: "Reader", v: "Windows" },
        { k: "Secure", v: "Windows" },
        { k: "Updates", v: "Automatic" },
        { k: "Installer", v: "Web stub" },
      ],
      href: null,
    },
  ];

  return (
    <div>
      <PageHeader title="Products" sub="Health and reach of every product in the Luxor PDF suite" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {products.map((p) => (
          <Card key={p.name} className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.color} text-white`}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.desc}</div>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {p.metrics.map((m) => (
                  <div key={m.k} className="rounded-md bg-slate-50 px-2 py-2 text-center">
                    <div className="truncate text-xs font-bold text-slate-800">{m.v}</div>
                    <div className="text-[10px] text-slate-400">{m.k}</div>
                  </div>
                ))}
              </div>
              {p.href && (
                <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-xs">
                  <a href={p.href} target="_blank" rel="noreferrer">
                    Open app <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            Plan distribution <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">live</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(stats.plans).length === 0 ? (
              <p className="col-span-4 text-xs text-slate-400">No paid plans yet.</p>
            ) : (
              Object.entries(stats.plans).map(([plan, count]) => (
                <div key={plan} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-center">
                  <div className="text-lg font-bold text-slate-900">{count}</div>
                  <div className="text-[11px] capitalize text-slate-500">{plan}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
