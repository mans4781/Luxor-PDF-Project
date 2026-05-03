import { useState } from "react";
import {
  COMPRESS_PRESETS, type CompressPreset, compressPdf, formatBytes,
} from "@/lib/pdfCompress";

interface Props {
  /** Source PDF to compress (the user's currently-open file). */
  file: File;
  onClose: () => void;
}

/**
 * Compress-PDF UI. Shows the three quality presets, runs the
 * rasterize+JPEG pipeline on demand, then surfaces before/after sizes
 * and a Download button. The user explicitly chooses to download — we
 * never overwrite the original file in memory.
 */
export default function CompressModal({ file, onClose }: Props) {
  const [preset, setPreset] = useState<CompressPreset>("medium");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const originalSize = file.size;

  const reset = () => { setResult(null); setError(null); setProgress(0); };

  const runCompress = async () => {
    if (running) return;
    reset();
    setRunning(true);
    try {
      const cfg = COMPRESS_PRESETS[preset];
      const blob = await compressPdf(file, {
        dpi: cfg.dpi,
        jpegQuality: cfg.jpegQuality,
        onProgress: (frac) => setProgress(frac),
      });
      setResult({ blob, size: blob.size });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Compression failed.");
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    const dot = file.name.lastIndexOf(".");
    const stem = dot >= 0 ? file.name.slice(0, dot) : file.name;
    a.download = `${stem}-compressed.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const savings = result ? Math.round((1 - result.size / originalSize) * 100) : 0;
  const grew = result && result.size >= originalSize;

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 520, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 12, padding: "20px 22px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          fontFamily: "inherit",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Compress this PDF</div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", fontSize: 20, lineHeight: 1, cursor: "pointer", color: "#888", padding: 4,
          }}>×</button>
        </div>

        <div style={{
          background: "#f6f8fb", border: "1px solid #e5eaf2", borderRadius: 8,
          padding: "10px 12px", marginBottom: 14, fontSize: 13, color: "#3a4a66",
        }}>
          <div><strong>{file.name}</strong></div>
          <div style={{ marginTop: 2, color: "#5a6a86" }}>Original size: {formatBytes(originalSize)}</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
          Quality preset
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {(Object.keys(COMPRESS_PRESETS) as CompressPreset[]).map((k) => {
            const p = COMPRESS_PRESETS[k];
            const active = preset === k;
            return (
              <label key={k}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  border: active ? "1px solid #0D62F2" : "1px solid #d8dde6",
                  background: active ? "rgba(13,98,242,0.06)" : "#fff",
                  borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                }}>
                <input
                  type="radio" name="compress-preset"
                  checked={active}
                  onChange={() => { setPreset(k); reset(); }}
                  disabled={running}
                  style={{ marginTop: 2, accentColor: "#0D62F2" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? "#0D62F2" : "#1a1a1a" }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "#5a6a86", marginTop: 2 }}>{p.desc}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{
          fontSize: 12, color: "#7a6a3a",
          background: "#fff8e6", border: "1px solid #f0e2b4",
          borderRadius: 6, padding: "8px 10px", marginBottom: 14,
        }}>
          <strong>Heads up:</strong> compression flattens every page to a JPEG image.
          Searchable text, links, and form fields are removed. Annotations made in
          this viewer (highlights, redactions, etc.) are not included — apply
          those first via Download, then compress the saved file.
        </div>

        {running && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#3a4a66", marginBottom: 6 }}>
              Compressing… {Math.round(progress * 100)}%
            </div>
            <div style={{
              height: 8, background: "#e9ecf1", borderRadius: 4, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${Math.round(progress * 100)}%`,
                background: "#0D62F2", transition: "width 120ms linear",
              }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 13, color: "#a01b1b",
            background: "#fdecec", border: "1px solid #f1c0c0",
            borderRadius: 6, padding: "8px 10px", marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {result && !running && (
          <div style={{
            background: grew ? "#fdecec" : "#e6f5ec",
            border: `1px solid ${grew ? "#f1c0c0" : "#bfe2c9"}`,
            borderRadius: 8, padding: "10px 12px", marginBottom: 14,
            fontSize: 13, color: grew ? "#a01b1b" : "#16633a",
          }}>
            <div><strong>Compressed size:</strong> {formatBytes(result.size)}</div>
            {grew ? (
              <div style={{ marginTop: 4 }}>
                Result is larger than the original — try the High preset, or this
                PDF may already be well-compressed.
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                Saved {formatBytes(originalSize - result.size)} ({savings}% smaller).
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 14 }}>
          <button onClick={onClose} disabled={running} style={{
            background: "#f1f1f1", color: "#333",
            border: "1px solid #ddd", borderRadius: 6,
            padding: "8px 14px", fontSize: 13, fontWeight: 500,
            cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.6 : 1,
          }}>Close</button>
          {!result ? (
            <button onClick={runCompress} disabled={running} style={{
              background: "#0D62F2", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              cursor: running ? "wait" : "pointer", opacity: running ? 0.7 : 1,
            }}>{running ? "Compressing…" : "Compress"}</button>
          ) : (
            <>
              <button onClick={runCompress} disabled={running} style={{
                background: "#fff", color: "#0D62F2",
                border: "1px solid #0D62F2", borderRadius: 6,
                padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Try another preset</button>
              <button onClick={download} style={{
                background: "#0D62F2", color: "#fff",
                border: "none", borderRadius: 6,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Download compressed PDF</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
