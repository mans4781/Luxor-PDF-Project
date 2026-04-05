import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { store, Document, formatDate, STATUS_CONFIG } from "@/lib/store";
import {
  FileText, Clock, CheckCircle2, TrendingUp, Plus, ChevronRight,
  AlertCircle, Eye, Download, MoreHorizontal
} from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    setDocs(store.getAll());
  }, []);

  const pending = docs.filter(d => d.status === "pending");
  const completed = docs.filter(d => d.status === "completed");
  const drafts = docs.filter(d => d.status === "draft" && !d.isTemplate);
  const recent = docs.filter(d => !d.isTemplate).slice(0, 5);

  const awaitingYou = pending.filter(d =>
    d.recipients.some(r => r.status === "pending")
  );

  return (
    <Layout
      title="Dashboard"
      subtitle="Welcome back — here's what needs your attention"
      actions={
        <Link href="/upload">
          <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Document
          </a>
        </Link>
      }
    >
      {/* Attention Banner */}
      {awaitingYou.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {awaitingYou.length} document{awaitingYou.length > 1 ? "s" : ""} awaiting signatures
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Recipients are waiting — send a reminder or check status</p>
            </div>
          </div>
          <Link href="/pending">
            <a className="text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Documents" value={docs.filter(d => !d.isTemplate).length}
          sub="All time" color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Clock} label="Pending" value={pending.length}
          sub="Awaiting signature" color="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length}
          sub="Fully signed" color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Drafts" value={drafts.length}
          sub="Not sent yet" color="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Documents</h2>
            <Link href="/documents">
              <a className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </a>
            </Link>
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {recent.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No documents yet</p>
                <Link href="/upload">
                  <a className="text-xs text-primary mt-1 inline-block">Upload your first document →</a>
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Document</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Updated</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map(doc => {
                    const cfg = STATUS_CONFIG[doc.status];
                    return (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.recipients.length} recipient{doc.recipients.length !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            <Link href={`/documents/${doc.id}`}>
                              <a className="p-1.5 hover:bg-muted rounded-md transition-colors" title="View">
                                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                              </a>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions + Pending Activity */}
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/upload", icon: Plus, label: "Upload & Send Document", desc: "Start a new signing workflow" },
                { href: "/sign", icon: FileText, label: "Sign a Document", desc: "Sign something sent to you" },
                { href: "/templates", icon: FileText, label: "Use a Template", desc: "Reuse a saved document" },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href}>
                  <a className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-accent/50 transition-all cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 group-hover:text-primary transition-colors" />
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending signers */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Pending Signers</h2>
              <div className="bg-card rounded-xl border border-border divide-y divide-border">
                {pending.slice(0, 4).map(doc => {
                  const pendingRec = doc.recipients.filter(r => r.status === "pending");
                  return (
                    <div key={doc.id} className="p-4">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <div className="mt-2 space-y-1">
                        {pendingRec.slice(0, 2).map(r => (
                          <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                            <span className="truncate">{r.name}</span>
                            <span className="ml-auto text-amber-600 font-medium">Awaiting</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
