import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { store, Document, formatDate, formatDateTime, formatFileSize, STATUS_CONFIG } from "@/lib/store";
import {
  FileText, Clock, CheckCircle2, XCircle, Send, Download, Trash2,
  RotateCcw, Users, Activity, Shield, Copy, ChevronDown
} from "lucide-react";

function AvatarIcon({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {name[0]}
    </div>
  );
}

const STATUS_ICON: Record<string, any> = {
  pending: Clock,
  signed: CheckCircle2,
  declined: XCircle,
  viewed: Clock,
};

export default function DocumentDetail() {
  const [, params] = useRoute("/documents/:id");
  const [, navigate] = useLocation();
  const [doc, setDoc] = useState<Document | undefined>();
  const [tab, setTab] = useState<"recipients" | "audit" | "details">("recipients");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (params?.id) setDoc(store.getById(params.id));
  }, [params?.id]);

  if (!doc) return (
    <Layout title="Document Not Found">
      <div className="py-24 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">This document doesn't exist.</p>
      </div>
    </Layout>
  );

  const cfg = STATUS_CONFIG[doc.status];
  const signedCount = doc.recipients.filter(r => r.status === "signed").length;
  const progress = doc.recipients.length > 0 ? (signedCount / doc.recipients.length) * 100 : 0;

  async function sendReminder() {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    store.addAuditEvent(doc!.id, { action: "Reminder sent", actor: "You", detail: "Email reminder sent to pending signers" });
    setDoc(store.getById(doc!.id));
    setSending(false);
  }

  function voidDocument() {
    store.update(doc!.id, { status: "voided" });
    store.addAuditEvent(doc!.id, { action: "Document voided", actor: "You" });
    setDoc(store.getById(doc!.id));
  }

  return (
    <Layout title={doc.name} subtitle={`${doc.pageCount} pages · ${formatFileSize(doc.fileSize)} · Created ${formatDate(doc.createdAt)}`}
      actions={
        <div className="flex items-center gap-2">
          {doc.status === "pending" && (
            <button onClick={sendReminder} disabled={sending}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60">
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : "Send Reminder"}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: doc preview placeholder + signing progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Preview placeholder */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-foreground">{doc.name}</span>
              <span className={`ml-auto inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                {cfg.label}
              </span>
            </div>
            <div className="h-80 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-24 bg-white rounded-lg shadow-md flex items-center justify-center border border-slate-200">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">{doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}</p>
                <p className="text-xs text-slate-400 mt-1">PDF Document</p>
              </div>
              <button className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                Preview Document
              </button>
            </div>
          </div>

          {/* Signing progress */}
          {doc.recipients.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Signing Progress</h3>
                <span className="text-xs text-muted-foreground">{signedCount} of {doc.recipients.length} signed</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 space-y-2">
                {doc.recipients.map((r, i) => {
                  const StatusIcon = STATUS_ICON[r.status] || Clock;
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <AvatarIcon name={r.name} color={r.color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${
                        r.status === "signed" ? "text-emerald-600" :
                        r.status === "declined" ? "text-red-600" :
                        "text-amber-600"
                      }`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {r.status === "signed" ? "Signed" : r.status === "declined" ? "Declined" : "Pending"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Details tabs */}
        <div className="space-y-5">
          {/* Tabs */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex border-b border-border">
              {[
                { id: "recipients", label: "Signers", icon: Users },
                { id: "audit", label: "Audit", icon: Activity },
                { id: "details", label: "Details", icon: Shield },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
                    tab === id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === "recipients" && (
                <div className="space-y-3">
                  {doc.recipients.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No recipients added</p>
                  ) : (
                    doc.recipients.map(r => (
                      <div key={r.id} className="flex items-start gap-3">
                        <AvatarIcon name={r.name} color={r.color} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{r.role}</p>
                          {r.signedAt && (
                            <p className="text-xs text-emerald-600 mt-1">Signed {formatDateTime(r.signedAt)}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          r.status === "signed" ? "text-emerald-600" :
                          r.status === "declined" ? "text-red-600" :
                          "text-amber-600"
                        }`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "audit" && (
                <div className="space-y-3">
                  {doc.auditTrail.slice().reverse().map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-2" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{event.action}</p>
                        <p className="text-xs text-muted-foreground">{event.actor}</p>
                        {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "details" && (
                <div className="space-y-3 text-xs">
                  {[
                    { label: "Created", value: formatDateTime(doc.createdAt) },
                    { label: "Last updated", value: formatDateTime(doc.updatedAt) },
                    { label: "Page count", value: `${doc.pageCount} pages` },
                    { label: "File size", value: formatFileSize(doc.fileSize) },
                    { label: "Document ID", value: doc.id },
                    { label: "Status", value: STATUS_CONFIG[doc.status].label },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground text-right max-w-[160px] break-all">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {doc.status !== "voided" && doc.status !== "completed" && (
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actions</h3>
              <button
                onClick={voidDocument}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Void Document
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
