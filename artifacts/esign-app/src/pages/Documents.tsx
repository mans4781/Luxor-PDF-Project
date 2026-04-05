import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { store, Document, formatDate, formatFileSize, STATUS_CONFIG, DocumentStatus } from "@/lib/store";
import { FileText, Plus, Search, Filter, Trash2, Eye, Download, Send, MoreHorizontal } from "lucide-react";

const FILTERS: { label: string; value: DocumentStatus | "all" | "templates" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Drafts", value: "draft" },
  { label: "Templates", value: "templates" },
];

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filter, setFilter] = useState<"all" | DocumentStatus | "templates">("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    setDocs(store.getAll());
  }, []);

  const filtered = docs.filter(doc => {
    if (filter === "templates") return doc.isTemplate;
    if (filter === "all") return !doc.isTemplate;
    return !doc.isTemplate && doc.status === filter;
  }).filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    store.delete(id);
    setDocs(store.getAll());
    setMenuOpen(null);
  }

  return (
    <Layout
      title="Documents"
      subtitle={`${filtered.length} document${filtered.length !== 1 ? "s" : ""}`}
      actions={
        <Link href="/upload">
          <a className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            New Document
          </a>
        </Link>
      }
    >
      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No documents found</p>
            <Link href="/upload">
              <a className="mt-2 text-sm text-primary hover:underline inline-block">Upload a document →</a>
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Recipients</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Size</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Date</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(doc => {
                const cfg = STATUS_CONFIG[doc.status];
                return (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {doc.isTemplate ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium text-violet-700 bg-violet-50">Template</span>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1">
                        {doc.recipients.slice(0, 4).map((r, i) => (
                          <div
                            key={r.id}
                            title={r.name}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-card"
                            style={{ backgroundColor: r.color, marginLeft: i > 0 ? -6 : 0 }}
                          >
                            {r.name[0]}
                          </div>
                        ))}
                        {doc.recipients.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/documents/${doc.id}`}>
                          <a className="p-1.5 hover:bg-muted rounded-md transition-colors" title="View">
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>
                        </Link>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
