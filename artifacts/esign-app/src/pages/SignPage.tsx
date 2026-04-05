import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { store } from "@/lib/store";
import { PenLine, Type, RotateCcw, Check, Upload, FileText } from "lucide-react";

type Mode = "draw" | "type" | "upload";

export default function SignPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("draw");
  const [typedSig, setTypedSig] = useState("Your Name");
  const [typedFont, setTypedFont] = useState(0);
  const [signed, setSigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const FONTS = [
    { name: "Dancing Script", style: "cursive", size: 36 },
    { name: "Pacifico", style: "'Pacifico', cursive", size: 32 },
    { name: "Sacramento", style: "'Sacramento', cursive", size: 40 },
    { name: "Signature", style: "serif", size: 28 },
  ];

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawing(true);
  }

  function stopDraw() {
    setDrawing(false);
    lastPos.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  }

  async function applySignature() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSigned(true);
    setSaving(false);
  }

  if (signed) {
    return (
      <Layout title="Document Signed">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Signed successfully!</h2>
          <p className="text-muted-foreground mb-8">
            Your signature has been applied. All parties will be notified and a copy will be sent to your email.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </button>
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Download Copy
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Sign Document" subtitle="Create and apply your electronic signature">
      <div className="max-w-2xl">
        {/* Document placeholder */}
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-semibold text-foreground">Service Agreement.pdf</p>
            <span className="ml-auto text-xs text-muted-foreground">Page 1 of 4</span>
          </div>
          <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex flex-col items-center justify-center gap-3 relative">
            {/* Simulated document lines */}
            <div className="w-3/4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-2 bg-slate-200 rounded-full ${i === 4 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
            {/* Signature box */}
            <div className="absolute bottom-6 right-6 w-40 h-14 border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center bg-indigo-50/50">
              <div className="text-center">
                <PenLine className="w-4 h-4 text-indigo-400 mx-auto" />
                <p className="text-xs text-indigo-400 mt-1">Sign here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature creation */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex border-b border-border">
            {([
              { id: "draw", icon: PenLine, label: "Draw" },
              { id: "type", icon: Type, label: "Type" },
              { id: "upload", icon: Upload, label: "Upload" },
            ] as { id: Mode; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  mode === id ? "border-b-2 border-primary text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {mode === "draw" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">Draw your signature using mouse or touch</p>
                  <button onClick={clearCanvas} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                </div>
                <div className="border border-border rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={180}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">Sign above</p>
              </div>
            )}

            {mode === "type" && (
              <div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Your name</label>
                  <input
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    value={typedSig}
                    onChange={e => setTypedSig(e.target.value)}
                    placeholder="Type your full name"
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-3">Choose a style</p>
                <div className="grid grid-cols-2 gap-3">
                  {FONTS.map((font, i) => (
                    <button
                      key={i}
                      onClick={() => setTypedFont(i)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        typedFont === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span
                        className="block text-slate-800 text-center select-none"
                        style={{ fontFamily: font.style, fontSize: font.size * 0.7, lineHeight: 1.2 }}
                      >
                        {typedSig || "Your Name"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "upload" && (
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Upload signature image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG or JPG with transparent background</p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-5">
            <button
              onClick={applySignature}
              disabled={saving || (mode === "draw" && !hasDrawing)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Applying signature…" : "Apply Signature & Complete"}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              By signing, you agree that this is a legally binding electronic signature.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
