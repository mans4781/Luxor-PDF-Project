import { useEffect, useRef, useState } from "react";

interface PasswordModalProps {
  fileName: string;
  /** True when a previous attempt was rejected. */
  wrongPassword: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

/**
 * Shown when pdf.js reports the document needs a password
 * (getDocument onPassword callback). Wrong attempts re-open the
 * modal with an inline error instead of failing silently.
 */
export default function PasswordModal({ fileName, wrongPassword, onSubmit, onCancel }: PasswordModalProps) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [wrongPassword]);

  const submit = () => {
    if (!value) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 9300, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 420, maxWidth: "92vw",
          borderRadius: 12, padding: "22px 22px 18px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: "rgba(13,98,242,0.12)", color: "#0D62F2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>Password required</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>{fileName}</div>
          </div>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#444", marginBottom: 12 }}>
          This PDF is protected. Enter the document password to open it.
        </div>

        {wrongPassword && (
          <div style={{
            fontSize: 12.5, color: "#c0392b", background: "rgba(192,57,43,0.08)",
            border: "1px solid rgba(192,57,43,0.25)", borderRadius: 6,
            padding: "7px 10px", marginBottom: 10,
          }}>
            Incorrect password. Please try again.
          </div>
        )}

        <div style={{ position: "relative", marginBottom: 16 }}>
          <input
            ref={inputRef}
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
            placeholder="Document password"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 38px 9px 12px",
              border: "1px solid rgba(0,0,0,0.2)", borderRadius: 7,
              fontSize: 14, outline: "none",
            }}
          />
          <button
            onClick={() => setShow(s => !s)}
            title={show ? "Hide password" : "Show password"}
            style={{
              position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "none", cursor: "pointer",
              color: "#888", padding: 4, display: "flex",
            }}
          >
            {show ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              background: "#fff", color: "#1a1a1a",
              border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
              padding: "8px 14px", fontSize: 13, cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={submit}
            disabled={!value}
            style={{
              background: value ? "#0D62F2" : "rgba(13,98,242,0.4)", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "8px 18px", fontSize: 13, fontWeight: 500,
              cursor: value ? "pointer" : "not-allowed",
            }}
          >Open</button>
        </div>
      </div>
    </div>
  );
}
