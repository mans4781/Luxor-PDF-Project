import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { store } from "@/lib/store";
import { Upload, FileText, X, Plus, ChevronRight, Trash2 } from "lucide-react";

const COLORS = store.COLORS;

interface NewRecipient {
  name: string;
  email: string;
  role: "signer" | "viewer" | "approver";
}

export default function UploadPage() {
  const [, navigate] = useLocation();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipients, setRecipients] = useState<NewRecipient[]>([
    { name: "", email: "", role: "signer" }
  ]);
  const [message, setMessage] = useState("Please review and sign the attached document at your earliest convenience.");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf" || f?.name.endsWith(".pdf")) setFile(f);
  }, []);

  function addRecipient() {
    setRecipients(r => [...r, { name: "", email: "", role: "signer" }]);
  }

  function removeRecipient(i: number) {
    setRecipients(r => r.filter((_, idx) => idx !== i));
  }

  function updateRecipient(i: number, field: keyof NewRecipient, val: string) {
    setRecipients(r => r.map((rec, idx) => idx === i ? { ...rec, [field]: val } : rec));
  }

  async function handleSubmit() {
    setUploading(true);
    await new Promise(r => setTimeout(r, 900));

    const validRecipients = recipients.filter(r => r.name && r.email);
    const doc = store.create({
      name: file?.name || "Untitled Document.pdf",
      status: validRecipients.length > 0 ? "pending" : "draft",
      pageCount: Math.floor(Math.random() * 5) + 1,
      fileSize: file?.size || 150000,
      message,
      recipients: validRecipients.map((r, i) => ({
        id: store.generateId(),
        ...r,
        order: i + 1,
        status: "pending" as const,
        color: COLORS[i % COLORS.length],
      })),
    });

    if (validRecipients.length > 0) {
      store.addAuditEvent(doc.id, { action: "Sent for signature", actor: "You", detail: `Sent to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""}` });
    }

    navigate(`/documents/${doc.id}`);
  }

  return (
    <Layout title="New Document" subtitle="Upload a document and configure signing">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Upload" },
          { n: 2, label: "Recipients" },
          { n: 3, label: "Settings" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <button
              onClick={() => file && setStep(n as 1 | 2 | 3)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                step === n ? "text-primary" : step > n ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n ? "bg-primary text-white" :
                step > n ? "bg-emerald-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>{step > n ? "✓" : n}</div>
              {label}
            </button>
            {n < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Step 1: Upload */}
        {step === 1 && (
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-16 text-center ${
                dragging ? "border-primary bg-primary/5" : file ? "border-emerald-400 bg-emerald-50" : "border-border hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
              />
              {file ? (
                <div>
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-base font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="mt-4 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-indigo-500" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Drop your PDF here</p>
                  <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
                  <p className="text-xs text-muted-foreground mt-4 opacity-60">PDF files only · Up to 25 MB</p>
                </div>
              )}
            </div>
            <button
              disabled={!file}
              onClick={() => setStep(2)}
              className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Recipients
            </button>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <div>
            <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
              {recipients.map((r, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-foreground">Recipient {i + 1}</p>
                    {recipients.length > 1 && (
                      <button onClick={() => removeRecipient(i)} className="ml-auto p-1 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Name *</label>
                      <input
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Full name"
                        value={r.name}
                        onChange={e => updateRecipient(i, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Email *</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="email@example.com"
                        value={r.email}
                        onChange={e => updateRecipient(i, "email", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      value={r.role}
                      onChange={e => updateRecipient(i, "role", e.target.value as any)}
                    >
                      <option value="signer">Signer — must sign the document</option>
                      <option value="approver">Approver — must approve before signing</option>
                      <option value="viewer">Viewer — receives a copy only</option>
                    </select>
                  </div>
                </div>
              ))}
              <div className="p-4">
                <button onClick={addRecipient}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium">
                  <Plus className="w-4 h-4" /> Add another recipient
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Continue to Settings
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settings / Message */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Message to recipients</h3>
              <textarea
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Optional message to signers…"
              />
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document</span>
                  <span className="font-medium text-foreground truncate max-w-[250px]">{file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipients</span>
                  <span className="font-medium text-foreground">
                    {recipients.filter(r => r.name && r.email).length} signer{recipients.filter(r => r.name && r.email).length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Back</button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {uploading ? "Sending…" : recipients.filter(r => r.name && r.email).length > 0 ? "Send for Signature" : "Save as Draft"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
