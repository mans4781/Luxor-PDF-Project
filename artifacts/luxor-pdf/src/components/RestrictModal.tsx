import { useState } from "react";

interface Props {
  /** Source PDF (the user's currently-open file). */
  file: File;
  /** Premium gate, re-checked at the moment the protected copy is created
   *  (not just when the modal was opened) so a lapsed entitlement can't
   *  slip through a stale open modal. Returns true when allowed. */
  requirePremium: (featureLabel: string) => boolean;
  onClose: () => void;
}

/**
 * Restrict Printing & Copying. Produces a password-protected copy of the
 * open PDF with the chosen reader permissions, then offers it for download.
 * The permission password unlocks full access; readers without it get only
 * the allowances ticked below. The original file in the tab is untouched.
 */
export default function RestrictModal({ file, requirePremium, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [allowPrinting, setAllowPrinting] = useState(false);
  const [allowCopying, setAllowCopying] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);

  const runRestrict = async () => {
    if (running) return;
    setError(null);
    setResult(null);
    if (password.length < 4) {
      setError("Choose a permission password of at least 4 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two password fields don't match.");
      return;
    }
    if (!requirePremium("Restrict Printing & Copying")) return;
    setRunning(true);
    try {
      const { PDFDocument } = await import("@cantoo/pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      doc.encrypt({
        ownerPassword: password,
        permissions: {
          printing: allowPrinting ? "highResolution" : false,
          copying: allowCopying,
          contentAccessibility: allowCopying,
          modifying: false,
          annotating: false,
          fillingForms: false,
          documentAssembly: false,
        },
      });
      const bytes = await doc.save();
      setResult(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    } catch (err: any) {
      console.error("Restrict failed:", err);
      setError(err?.message ?? "Sorry — couldn't protect this PDF.");
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    const dot = file.name.lastIndexOf(".");
    const stem = dot >= 0 ? file.name.slice(0, dot) : file.name;
    a.download = `${stem}-protected.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const field = (
    label: string, value: string, set: (v: string) => void,
  ) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#555", flex: 1 }}>
      {label}
      <input
        type="password" value={value} autoComplete="new-password"
        onChange={(e) => { set(e.target.value); setResult(null); }}
        style={{
          padding: "8px 10px", fontSize: 13,
          border: "1px solid #d5d5d5", borderRadius: 7, color: "#1a1a1a",
        }}
      />
    </label>
  );

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 480, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 12, padding: "20px 22px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          fontFamily: "inherit",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Restrict printing &amp; copying</div>
          <button onClick={onClose} style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "#555", padding: 6, borderRadius: 6, display: "flex",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "#666", lineHeight: 1.5, margin: "0 0 14px" }}>
          Creates a protected copy of this document. Anyone can open it, but
          printing and copying are blocked unless they enter the permission
          password. Your original file is not changed.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {field("Permission password", password, setPassword)}
          {field("Confirm password", confirm, setConfirm)}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={allowPrinting}
              onChange={(e) => { setAllowPrinting(e.target.checked); setResult(null); }} />
            Still allow printing
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={allowCopying}
              onChange={(e) => { setAllowCopying(e.target.checked); setResult(null); }} />
            Still allow copying text
          </label>
        </div>

        {error && (
          <div style={{
            fontSize: 12.5, color: "#B3261E", background: "rgba(179,38,30,0.07)",
            borderRadius: 7, padding: "8px 10px", marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            fontSize: 12.5, color: "#14691B", background: "rgba(20,105,27,0.07)",
            borderRadius: 7, padding: "8px 10px", marginBottom: 12,
          }}>
            Protected copy is ready. Keep the password somewhere safe — it is
            the only way to lift these restrictions later.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={running} style={{
            padding: "8px 16px", fontSize: 13, borderRadius: 8, cursor: "pointer",
            border: "1px solid #d5d5d5", background: "#fff", color: "#333",
          }}>
            {result ? "Close" : "Cancel"}
          </button>
          {result ? (
            <button onClick={download} style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8,
              cursor: "pointer", border: "none", background: "#14691B", color: "#fff",
            }}>
              Download protected copy
            </button>
          ) : (
            <button onClick={runRestrict} disabled={running} style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8,
              cursor: running ? "default" : "pointer", border: "none",
              background: "#0D62F2", color: "#fff", opacity: running ? 0.6 : 1,
            }}>
              {running ? "Protecting\u2026" : "Create protected copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
