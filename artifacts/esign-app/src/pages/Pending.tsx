import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { store, Document, formatDate } from "@/lib/store";
import { Clock, Send, Eye, CheckCircle2, AlertCircle, Users } from "lucide-react";

export default function Pending() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [reminding, setReminding] = useState<string | null>(null);

  useEffect(() => {
    setDocs(store.getAll().filter(d => d.status === "pending" && !d.isTemplate));
  }, []);

  async function sendReminder(id: string) {
    setReminding(id);
    await new Promise(r => setTimeout(r, 700));
    store.addAuditEvent(id, { action: "Reminder sent", actor: "You", detail: "Email reminder sent to pending signers" });
    setReminding(null);
  }

  return (
    <Layout
      title="Pending Documents"
      subtitle={`${docs.length} document${docs.length !== 1 ? "s" : ""} awaiting signature`}
    >
      {docs.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No documents are waiting for signatures.</p>
          <Link href="/upload">
            <a className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Send a new document
            </a>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => {
            const pending = doc.recipients.filter(r => r.status === "pending");
            const signed = doc.recipients.filter(r => r.status === "signed");
            const progress = doc.recipients.length > 0 ? (signed.length / doc.recipients.length) * 100 : 0;

            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Sent {formatDate(doc.createdAt)}</p>

                      {/* Signers */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {doc.recipients.map(r => (
                          <div key={r.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.status === "signed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                            {r.name}
                            {r.status === "signed" ? " ✓" : ""}
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{signed.length} of {doc.recipients.length} signed</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => sendReminder(doc.id)}
                      disabled={reminding === doc.id}
                      className="flex items-center gap-2 px-3.5 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {reminding === doc.id ? "Sending…" : "Remind"}
                    </button>
                    <Link href={`/documents/${doc.id}`}>
                      <a className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </a>
                    </Link>
                  </div>
                </div>

                {pending.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Waiting on: {pending.map(r => r.name).join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
