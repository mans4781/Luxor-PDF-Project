export type FieldType = "signature" | "initials" | "date" | "text" | "checkbox";
export type DocumentStatus = "draft" | "pending" | "completed" | "declined" | "voided";

export interface SignatureField {
  id: string;
  type: FieldType;
  page: number;
  x: number; // percentage
  y: number; // percentage
  w: number;
  h: number;
  recipientId: string;
  value?: string;
  signed?: boolean;
  required: boolean;
  label?: string;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: "signer" | "viewer" | "approver";
  order: number;
  status: "pending" | "signed" | "declined" | "viewed";
  signedAt?: string;
  color: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  detail?: string;
}

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  recipients: Recipient[];
  fields: SignatureField[];
  auditTrail: AuditEvent[];
  pageCount: number;
  fileSize: number;
  isTemplate: boolean;
  expiresAt?: string;
  message?: string;
  fileData?: string; // base64
}

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

const SAMPLE_DOCS: Document[] = [
  {
    id: "doc1",
    name: "Service Agreement — Acme Corp.pdf",
    status: "pending",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    pageCount: 4,
    fileSize: 245000,
    isTemplate: false,
    message: "Please review and sign the attached service agreement.",
    recipients: [
      { id: "r1", name: "John Carter", email: "john@acme.com", role: "signer", order: 1, status: "signed", signedAt: new Date(Date.now() - 3600000).toISOString(), color: COLORS[0] },
      { id: "r2", name: "Sarah Mitchell", email: "sarah@acme.com", role: "signer", order: 2, status: "pending", color: COLORS[1] },
    ],
    fields: [],
    auditTrail: [
      { id: "a1", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), action: "Document created", actor: "You" },
      { id: "a2", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), action: "Sent for signature", actor: "You", detail: "Sent to 2 recipients" },
      { id: "a3", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Signed", actor: "John Carter", detail: "Signed via web" },
    ],
  },
  {
    id: "doc2",
    name: "NDA — Partnership Agreement.pdf",
    status: "completed",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    pageCount: 2,
    fileSize: 128000,
    isTemplate: false,
    recipients: [
      { id: "r3", name: "Emily Zhang", email: "emily@partner.io", role: "signer", order: 1, status: "signed", signedAt: new Date(Date.now() - 86400000 * 5).toISOString(), color: COLORS[2] },
    ],
    fields: [],
    auditTrail: [
      { id: "a4", timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), action: "Document created", actor: "You" },
      { id: "a5", timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), action: "Signed", actor: "Emily Zhang" },
      { id: "a6", timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), action: "Document completed", actor: "System" },
    ],
  },
  {
    id: "doc3",
    name: "Employment Contract — New Hire.pdf",
    status: "draft",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    pageCount: 8,
    fileSize: 512000,
    isTemplate: false,
    recipients: [],
    fields: [],
    auditTrail: [
      { id: "a7", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), action: "Document created", actor: "You" },
    ],
  },
  {
    id: "doc4",
    name: "Consulting Agreement Template",
    status: "draft",
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    pageCount: 3,
    fileSize: 180000,
    isTemplate: true,
    recipients: [],
    fields: [],
    auditTrail: [],
  },
];

function loadStore(): Document[] {
  try {
    const raw = localStorage.getItem("lexsign_docs");
    return raw ? JSON.parse(raw) : SAMPLE_DOCS;
  } catch {
    return SAMPLE_DOCS;
  }
}

function saveStore(docs: Document[]) {
  try {
    localStorage.setItem("lexsign_docs", JSON.stringify(docs));
  } catch {}
}

export const store = {
  getAll(): Document[] { return loadStore(); },
  getById(id: string): Document | undefined { return loadStore().find(d => d.id === id); },

  create(partial: Partial<Document>): Document {
    const doc: Document = {
      id: generateId(),
      name: "Untitled Document",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recipients: [],
      fields: [],
      auditTrail: [{ id: generateId(), timestamp: new Date().toISOString(), action: "Document created", actor: "You" }],
      pageCount: 1,
      fileSize: 0,
      isTemplate: false,
      ...partial,
    };
    const docs = loadStore();
    docs.unshift(doc);
    saveStore(docs);
    return doc;
  },

  update(id: string, updates: Partial<Document>): Document | undefined {
    const docs = loadStore();
    const idx = docs.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() };
    saveStore(docs);
    return docs[idx];
  },

  delete(id: string): void {
    const docs = loadStore().filter(d => d.id !== id);
    saveStore(docs);
  },

  addAuditEvent(id: string, event: Omit<AuditEvent, "id" | "timestamp">) {
    const docs = loadStore();
    const doc = docs.find(d => d.id === id);
    if (!doc) return;
    doc.auditTrail = [
      ...doc.auditTrail,
      { id: generateId(), timestamp: new Date().toISOString(), ...event },
    ];
    doc.updatedAt = new Date().toISOString();
    saveStore(docs);
  },

  generateId,
  COLORS,
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50" },
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50" },
  declined: { label: "Declined", color: "text-red-700", bg: "bg-red-50" },
  voided: { label: "Voided", color: "text-slate-500", bg: "bg-slate-100" },
};
