import { useEffect, useState } from "react";
import SidePanel, { InfoRow, StatusChip } from "./SidePanel";
import { extractMetadata, extractSecurity, DocMetadata, DocSecurity } from "../lib/docFeatures";
import { formatFileSize } from "../lib/recentFiles";

interface DocInfoPanelProps {
  pdfDoc: any;
  fileName: string;
  fileSize: number;
  totalPages: number;
  passwordProtected: boolean;
  onClose: () => void;
}

/**
 * Document Info + Security Status panel — metadata via getMetadata()
 * and permissions via getPermissions() (see lib/docFeatures.ts).
 */
export default function DocInfoPanel({ pdfDoc, fileName, fileSize, totalPages, passwordProtected, onClose }: DocInfoPanelProps) {
  const [meta, setMeta] = useState<DocMetadata | null>(null);
  const [sec, setSec] = useState<DocSecurity | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [m, s] = await Promise.all([
        extractMetadata(pdfDoc, passwordProtected),
        extractSecurity(pdfDoc, passwordProtected),
      ]);
      if (!cancelled) { setMeta(m); setSec(s); }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, passwordProtected]);

  return (
    <SidePanel title="Document Info" onClose={onClose}>
      {!meta || !sec ? (
        <div style={{ color: "#888", fontSize: 12.5 }}>Reading document properties…</div>
      ) : (
        <>
          <InfoRow label="File name" value={fileName} />
          <InfoRow label="Title" value={meta.title} />
          <InfoRow label="Author" value={meta.author} />
          {meta.subject && <InfoRow label="Subject" value={meta.subject} />}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 10 }}>
            <InfoRow label="Pages" value={totalPages} />
            <InfoRow label="File size" value={formatFileSize(fileSize)} />
            <InfoRow label="PDF version" value={meta.pdfVersion ? `PDF ${meta.pdfVersion}` : null} />
            <InfoRow label="Encrypted" value={meta.isEncrypted ? "Yes" : "No"} />
          </div>
          <InfoRow label="Creator" value={meta.creator} />
          <InfoRow label="Producer" value={meta.producer} />
          <InfoRow label="Created" value={meta.createdDate} />
          <InfoRow label="Modified" value={meta.modifiedDate} />

          <div style={{
            margin: "16px 0 10px", paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 11, fontWeight: 600, color: "#888",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Security Status
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <SecurityRow label="Password protection" chip={<StatusChip ok={!passwordProtected} okLabel="None" badLabel="Protected" />} invertColors={false} protectedState={passwordProtected} />
            <SecurityLine label="Printing" allowed={sec.printingAllowed} />
            <SecurityLine label="Copying text" allowed={sec.copyingAllowed} />
            <SecurityLine label="Editing content" allowed={sec.editingAllowed} />
            <SecurityLine label="Commenting" allowed={sec.annotatingAllowed} />
            <SecurityLine label="Embedded JavaScript" allowed={!sec.hasJavaScript} customOk="None detected" customBad="Present" warnOnBad />
            <SecurityLine label="File attachments" allowed={!sec.hasAttachments} customOk="None" customBad="Present" warnOnBad />
          </div>

          {!sec.hasPermissionRestrictions && !passwordProtected && (
            <div style={{ marginTop: 14, fontSize: 12, color: "#7fa8e8", background: "rgba(13,98,242,0.1)", borderRadius: 8, padding: "9px 11px", lineHeight: 1.5 }}>
              This document has no security restrictions — all reader features are available.
            </div>
          )}
        </>
      )}
    </SidePanel>
  );
}

function SecurityRow({ label, chip }: { label: string; chip: React.ReactNode; invertColors?: boolean; protectedState?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12.5, color: "#ccc" }}>{label}</span>
      {chip}
    </div>
  );
}

function SecurityLine({ label, allowed, customOk, customBad, warnOnBad }: {
  label: string; allowed: boolean; customOk?: string; customBad?: string; warnOnBad?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12.5, color: "#ccc" }}>{label}</span>
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11.5, fontWeight: 500,
          padding: "3px 9px", borderRadius: 999,
          background: allowed ? "rgba(46,164,79,0.15)" : warnOnBad ? "rgba(245,185,66,0.15)" : "rgba(231,76,60,0.15)",
          color: allowed ? "#4cc271" : warnOnBad ? "#f5b942" : "#e74c3c",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
        {allowed ? (customOk ?? "Allowed") : (customBad ?? "Restricted")}
      </span>
    </div>
  );
}
