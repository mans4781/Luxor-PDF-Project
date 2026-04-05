import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { store, Document, formatDate } from "@/lib/store";
import { FolderOpen, Plus, FileText, Copy, Trash2, ArrowRight } from "lucide-react";

export default function Templates() {
  const [, navigate] = useLocation();
  const [templates, setTemplates] = useState<Document[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(store.getAll().filter(d => d.isTemplate));
  }, []);

  async function useTemplate(id: string) {
    setCreating(id);
    await new Promise(r => setTimeout(r, 600));
    const tpl = store.getById(id);
    if (!tpl) return;
    const doc = store.create({
      name: tpl.name.replace(" Template", "") + " — Copy",
      pageCount: tpl.pageCount,
      fileSize: tpl.fileSize,
      isTemplate: false,
      status: "draft",
    });
    navigate(`/documents/${doc.id}`);
  }

  function deleteTemplate(id: string) {
    store.delete(id);
    setTemplates(store.getAll().filter(d => d.isTemplate));
  }

  function saveAsTemplate() {
    const doc = store.create({
      name: "New Template",
      pageCount: 2,
      fileSize: 100000,
      isTemplate: true,
      status: "draft",
    });
    setTemplates(store.getAll().filter(d => d.isTemplate));
  }

  return (
    <Layout
      title="Templates"
      subtitle="Reusable document templates"
      actions={
        <button
          onClick={saveAsTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      }
    >
      {templates.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No templates yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Save frequently used documents as templates to reuse them quickly.</p>
          <button
            onClick={saveAsTemplate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-500" />
                </div>
                <button
                  onClick={() => deleteTemplate(tpl.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{tpl.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tpl.pageCount} pages · Created {formatDate(tpl.createdAt)}</p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => useTemplate(tpl.id)}
                  disabled={creating === tpl.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {creating === tpl.id ? "Creating…" : (
                    <><Copy className="w-3.5 h-3.5" /> Use Template</>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Add template card */}
          <button
            onClick={saveAsTemplate}
            className="bg-muted/40 rounded-xl border-2 border-dashed border-border p-5 hover:border-primary/40 hover:bg-muted/60 transition-all flex flex-col items-center justify-center min-h-[160px] gap-3 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-8 h-8 opacity-40" />
            <span className="text-sm font-medium">New Template</span>
          </button>
        </div>
      )}
    </Layout>
  );
}
