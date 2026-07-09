import { useEffect, useState } from "react";
import SidePanel from "./SidePanel";
import { ToolType } from "../lib/annotationTypes";

interface FormsPanelProps {
  pdfDoc: any;
  onClose: () => void;
  /** Switch the active annotation tool (already sign-in gated upstream). */
  onSelectTool: (tool: ToolType) => void;
  onAddImage: () => void;
}

interface FieldSummary {
  name: string;
  type: string;
  page: number | null;
}

/**
 * Forms & Signature panel.
 *
 * Form DETECTION is real: pdf.js getFieldObjects() lists AcroForm fields.
 * Form FILLING is a mock — INTEGRATION POINT: render pdf.js
 * AnnotationLayer with `renderForms: true` on each page, then export
 * filled values via pdf-lib's PDFForm (form.getTextField(...).setText(...)).
 *
 * Signatures reuse existing live tools: "Draw signature" activates the
 * freehand pen; "Upload signature image" opens the Add Image flow (both
 * are burned into the PDF on save by the existing export pipeline).
 */
export default function FormsPanel({ pdfDoc, onClose, onSelectTool, onAddImage }: FormsPanelProps) {
  const [fields, setFields] = useState<FieldSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const objs = await pdfDoc.getFieldObjects();
        if (cancelled) return;
        if (!objs) { setFields([]); return; }
        const list: FieldSummary[] = [];
        for (const [name, arr] of Object.entries(objs) as [string, any[]][]) {
          const first = arr?.[0];
          list.push({
            name,
            type: first?.type ?? "field",
            page: typeof first?.page === "number" ? first.page + 1 : null,
          });
        }
        setFields(list);
      } catch {
        if (!cancelled) setFields([]);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc]);

  const TYPE_LABELS: Record<string, string> = {
    text: "Text field", checkbox: "Checkbox", radiobutton: "Radio button",
    combobox: "Dropdown", listbox: "List", button: "Button", signature: "Signature field",
  };

  return (
    <SidePanel title="Forms & Signature" onClose={onClose}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
        Form fields
      </div>

      {fields === null ? (
        <div style={{ color: "#888", fontSize: 12.5 }}>Scanning for form fields…</div>
      ) : fields.length === 0 ? (
        <div style={{ color: "#888", fontSize: 12.5, lineHeight: 1.6, marginBottom: 14 }}>
          No fillable form fields detected in this document.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "#bbb", marginBottom: 8 }}>
            {fields.length} {fields.length === 1 ? "field" : "fields"} detected:
          </div>
          <div style={{ marginBottom: 10, maxHeight: 200, overflowY: "auto" }}>
            {fields.slice(0, 40).map(f => (
              <div key={f.name} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 8px", marginBottom: 3,
                background: "rgba(255,255,255,0.04)", borderRadius: 6,
              }}>
                <span style={{ fontSize: 11.5, color: "#ccc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={f.name}>{f.name}</span>
                <span style={{ fontSize: 10.5, color: "#7fa8e8", flexShrink: 0 }}>{TYPE_LABELS[f.type] ?? f.type}</span>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: 12, color: "#f5b942", lineHeight: 1.55,
            background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.25)",
            borderRadius: 8, padding: "9px 11px", marginBottom: 14,
          }}>
            <strong>Preview mode:</strong> interactive form filling is coming soon. Meanwhile, use the Text Box tool to type over any field.
          </div>
        </>
      )}

      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", margin: "6px 0 8px", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        Add your signature
      </div>
      <div style={{ fontSize: 12, color: "#999", lineHeight: 1.55, marginBottom: 10 }}>
        Signatures are saved into the PDF when you export (Save As).
      </div>

      <button
        onClick={() => { onSelectTool("freehand"); onClose(); }}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 11px", marginBottom: 6,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: "#ddd", fontSize: 12.5, cursor: "pointer", textAlign: "left",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 17c3-4 6-12 9-12s3 8 6 8 3-4 3-4"/></svg>
        <span style={{ flex: 1 }}>Draw signature <span style={{ color: "#888" }}>(pen tool)</span></span>
      </button>
      <button
        onClick={() => { onAddImage(); onClose(); }}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 11px",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: "#ddd", fontSize: 12.5, cursor: "pointer", textAlign: "left",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
        <span style={{ flex: 1 }}>Upload signature image</span>
      </button>

      <div style={{ marginTop: 14, fontSize: 11.5, color: "#777", lineHeight: 1.6 }}>
        Need legally binding e-signatures with audit trails? Use LexSign, part of the Luxor PDF Suite.
      </div>
    </SidePanel>
  );
}
