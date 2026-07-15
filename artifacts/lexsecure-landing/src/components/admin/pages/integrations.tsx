import { CreditCard, Database, Github, KeyRound, Mail, ShieldCheck, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatusBadge } from "../shared";
import { SYSTEM_SERVICES } from "../mock-data";

const INTEGRATIONS = [
  {
    name: "Stripe",
    icon: CreditCard,
    desc: "Card payments, subscriptions and lifetime purchases.",
    status: "active",
    detail: "Webhook-driven plan activation",
  },
  {
    name: "Razorpay",
    icon: CreditCard,
    desc: "Payment links for INR/USD one-time purchases.",
    status: "active",
    detail: "Signed webhook verification",
  },
  {
    name: "Clerk",
    icon: ShieldCheck,
    desc: "Suite-wide single sign-on across all Luxor apps.",
    status: "active",
    detail: "One account, three products",
  },
  {
    name: "Resend",
    icon: Mail,
    desc: "Transactional email — license keys and receipts.",
    status: "active",
    detail: "License delivery emails",
  },
  {
    name: "PostgreSQL",
    icon: Database,
    desc: "Primary datastore for documents, licenses and billing.",
    status: "active",
    detail: "Managed database",
  },
  {
    name: "GitHub Releases",
    icon: Github,
    desc: "Desktop app auto-updates for Windows installers.",
    status: "active",
    detail: "Reader & Secure desktop",
  },
];

export function IntegrationsPage() {
  return (
    <div>
      <PageHeader title="Integrations" sub="Connected services powering the Luxor PDF suite" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name} className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <i.icon className="h-5 w-5" />
                </div>
                <StatusBadge status={i.status} />
              </div>
              <div className="mt-2.5 text-sm font-semibold text-slate-800">{i.name}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{i.desc}</div>
              <div className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">{i.detail}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-slate-400" /> API Keys
            </CardTitle>
            <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">managed via environment</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {["Stripe secret key", "Razorpay key pair", "Resend API key", "Admin console token"].map((k) => (
              <div key={k} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                <span className="text-xs text-slate-600">{k}</span>
                <span className="font-mono text-[11px] text-slate-400">••••••••</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-slate-400">
              Keys are stored as server-side secrets and never exposed to the browser. Rotate them
              from the hosting environment's secret manager.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Webhook className="h-4 w-4 text-slate-400" /> Webhooks & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Stripe webhook", path: "/api/billing/stripe/webhook" },
              { name: "Razorpay webhook", path: "/api/billing/razorpay/webhook" },
            ].map((w) => (
              <div key={w.name} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                <span className="text-xs text-slate-600">{w.name}</span>
                <code className="font-mono text-[11px] text-slate-400">{w.path}</code>
              </div>
            ))}
            <div className="pt-2">
              <div className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Service status</div>
              {SYSTEM_SERVICES.map((s) => (
                <div key={s.name} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-slate-600">{s.name}</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Operational
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
