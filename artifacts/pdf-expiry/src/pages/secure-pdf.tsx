import { useState, useRef, useCallback, useEffect } from "react";
import { PDFDocument } from "@cantoo/pdf-lib";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Calendar, Lock, Printer,
  Upload, X, Eye, EyeOff, Copy, ShieldOff, Download, CheckCircle2, RotateCcw,
  KeyRound, Send, Sparkles, FileText, Timer,
} from "lucide-react";
import { AccentProvider, useAccentBtn, useAccentInnerBanner, useAccentDrop } from "@/lib/accent";
import {
  useUploadPdf,
  useRequestRevokeOtp,
  useVerifyRevokeOtp,
  getGetPdfStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { scheduleAutoRefresh } from "@/lib/auto-refresh";
import { encryptPdfAes256 } from "@/lib/qpdf-encrypt";
import { saveToLocalHistory, loadLocalHistory } from "./history";
import type { LocalPdfEntry } from "@/components/pdf-list";
import { formatBytes } from "@/lib/utils";
import { format, addDays } from "date-fns";

// ─── Drop zone (matches PDF Tool style) ───────────────────────────────────────

type DropColorScheme = "rose" | "indigo" | "amber";

const dropColors: Record<DropColorScheme, {
  drag: string; idle: string; iconBg: string; label: string; hint: string;
}> = {
  rose: {
    drag: "border-rose-400 bg-rose-50 scale-[1.01]",
    idle: "border-rose-200 hover:border-rose-400 hover:bg-rose-50/60 bg-gradient-to-br from-rose-50/50 to-red-50/30",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    label: "text-rose-700", hint: "text-rose-400",
  },
  indigo: {
    drag: "border-indigo-400 bg-indigo-50 scale-[1.01]",
    idle: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60 bg-gradient-to-br from-indigo-50/50 to-blue-50/30",
    iconBg: "bg-gradient-to-br from-indigo-500 to-violet-600",
    label: "text-indigo-700", hint: "text-indigo-400",
  },
  amber: {
    drag: "border-amber-400 bg-amber-50 scale-[1.01]",
    idle: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    label: "text-amber-700", hint: "text-amber-400",
  },
};

function FileDropZone({
  onFiles, label, hint, colorScheme = "rose",
}: {
  onFiles: (files: File[]) => void;
  label: string;
  hint?: string;
  colorScheme?: DropColorScheme;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const accentDrop = useAccentDrop();
  const c = accentDrop ?? dropColors[colorScheme];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${dragging ? c.drag : c.idle}`}
    >
      <div className={`w-14 h-14 ${c.iconBg} rounded-2xl flex items-center justify-center shadow-md mx-auto mb-3 opacity-85`}>
        <Upload className="w-7 h-7 text-white" />
      </div>
      <p className={`text-sm font-semibold ${c.label}`}>{label}</p>
      {hint && <p className={`text-xs mt-1 ${c.hint}`}>{hint}</p>}
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }} />
    </div>
  );
}

function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
      <div>
        <p className="text-sm font-medium truncate max-w-[260px]">{name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(size)} · PDF</p>
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SuccessCard({ label, downloadId, shareToken, fileName, onReset, accentBtn }: {
  label: string; downloadId: number; shareToken: string; fileName: string;
  onReset: () => void; accentBtn: string;
}) {
  const downloadAccent = useAccentBtn("from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700");
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${import.meta.env.BASE_URL}v/${downloadId}?token=${encodeURIComponent(shareToken)}`;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Share link copied",
        description: "Anyone with this link can view the PDF until it expires.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy the link to your clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdfs/${downloadId}/download?shareToken=${encodeURIComponent(shareToken)}`);
      if (res.status === 410) {
        setExpired(true);
        toast({
          title: "PDF Expired",
          description: "This PDF has passed its expiry date and has been permanently deleted.",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        toast({ title: "Download failed", description: "Could not retrieve the file.", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dot = fileName.lastIndexOf(".");
      const secured = dot === -1 ? `${fileName} (secured)` : `${fileName.slice(0, dot)} (secured)${fileName.slice(dot)}`;
      a.download = secured;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Download failed", description: "A network error occurred.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {expired ? (
        <div className="flex flex-col items-center gap-3 py-5 px-4 bg-red-50 border border-red-200 rounded-2xl text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-md">
            <ShieldOff className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">PDF Expired</p>
            <p className="text-xs text-red-600 mt-0.5">This file has passed its expiry date and has been permanently removed.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-5 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Secured successfully!</p>
            <p className="text-xs text-emerald-600 mt-0.5 truncate max-w-[220px] mx-auto">{fileName}</p>
            <p className="text-xs text-emerald-500 mt-0.5">{label}</p>
          </div>
        </div>
      )}
      {!expired && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Shareable link (expiry-enforced)
            </Label>
            <div className="flex gap-1.5">
              <Input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="text-xs font-mono bg-slate-50 border-slate-200 truncate"
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-slate-200 hover:bg-slate-50"
                onClick={handleCopyShareLink}
                title="Copy share link"
              >
                {copied
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <Copy className="w-4 h-4 text-slate-600" />}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Recipients open this link in a viewer that locks itself the
              instant the PDF expires — even if the tab was already open.
            </p>
          </div>
          <Button
            className={`w-full bg-gradient-to-r ${downloadAccent} text-white border-0 shadow-md font-semibold`}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading
              ? <><span className="animate-spin mr-2">⏳</span>Downloading…</>
              : <><Download className="w-4 h-4 mr-2" />Download Secured PDF</>}
          </Button>
        </>
      )}
      <Button variant="outline" className={`w-full ${accentBtn}`} onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />Secure Another PDF
      </Button>
    </div>
  );
}

// ─── Expiry Tab ────────────────────────────────────────────────────────────────

function ExpiryTab() {
  const accentBtn = useAccentBtn("from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700");
  const ab = useAccentInnerBanner();
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedShareToken, setUploadedShareToken] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => {
    setFile(null); setUploadedId(null); setUploadedShareToken(""); setUploadedName("");
    setExpiryDate(format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  };

  const handleUpload = () => {
    if (!file) return;
    const name = file.name;
    uploadMutation.mutate({ data: { file, expiryDate: new Date(expiryDate).toISOString() } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedShareToken(data.shareToken); setUploadedName(name); setFile(null);
        saveToLocalHistory({ id: data.id, shareToken: data.shareToken, originalName: data.originalName, fileSize: data.fileSize, expiryDate: data.expiryDate, createdAt: data.createdAt, updatedAt: data.updatedAt });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
        scheduleAutoRefresh();
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className={`${ab?.wrap ?? "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
        <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-rose-500 to-red-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className={`font-semibold ${ab?.titleClass ?? "text-rose-900"}`}>Set Expiry Date</h2>
          <p className={`text-xs ${ab?.descClass ?? "text-rose-600"}`}>The PDF auto-locks after this date — no views or downloads.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label={`Expires on ${format(new Date(expiryDate), "MMMM d, yyyy 'at' h:mm a")}`}
          downloadId={uploadedId} shareToken={uploadedShareToken} fileName={uploadedName} onReset={reset}
          accentBtn="border-rose-200 text-[#C81934] hover:bg-rose-50"
        />
      ) : (
        <>
          {!file ? (
            <FileDropZone onFiles={(f) => setFile(f[0])} label="Click or drag a PDF here"
              hint="Upload the PDF you want to apply an expiry date to" colorScheme="rose" />
          ) : (
            <FileRow name={file.name} size={file.size} onRemove={() => setFile(null)} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="expiryDate" className="text-rose-700 font-semibold text-sm flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Expiry Date &amp; Time
            </Label>
            <Input id="expiryDate" type="datetime-local" value={expiryDate}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20" />
            <p className="text-xs text-rose-400">Recipients will be unable to open or download the file after this exact moment.</p>
          </div>

          <Button
            className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
            disabled={!file || uploadMutation.isPending} onClick={handleUpload}
          >
            {uploadMutation.isPending
              ? <><span className="animate-spin mr-2">⏳</span>Securing…</>
              : <><ShieldCheck className="w-4 h-4 mr-2" />Apply Expiry &amp; Download</>}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Password Tab ──────────────────────────────────────────────────────────────

function PasswordTab() {
  const accentBtn = useAccentBtn("from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700");
  const ab = useAccentInnerBanner();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedShareToken, setUploadedShareToken] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => { setFile(null); setPassword(""); setShowPassword(false); setUploadedId(null); setUploadedShareToken(""); setUploadedName(""); };

  const handleUpload = async () => {
    if (!file) return;
    if (!password) {
      toast({ title: "Password required", description: "Please enter a password to protect this PDF.", variant: "destructive" });
      return;
    }
    const name = file.name;

    let encryptedFile: File;
    try {
      const inputBytes = new Uint8Array(await file.arrayBuffer());
      // Real AES-256 (PDF 2.0 / R6 security handler) via qpdf-wasm.
      // Runs entirely in the browser — the file never leaves the device.
      const encryptedBytes = await encryptPdfAes256(inputBytes, password);
      encryptedFile = new File([new Uint8Array(encryptedBytes)], file.name, { type: "application/pdf" });
    } catch {
      toast({ title: "Encryption failed", description: "Could not encrypt this PDF. It may already be password-protected.", variant: "destructive" });
      return;
    }

    uploadMutation.mutate({ data: { file: encryptedFile, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedShareToken(data.shareToken); setUploadedName(name); setFile(null); setPassword("");
        saveToLocalHistory({ id: data.id, shareToken: data.shareToken, originalName: data.originalName, fileSize: data.fileSize, expiryDate: data.expiryDate, createdAt: data.createdAt, updatedAt: data.updatedAt });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
        scheduleAutoRefresh();
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className={`${ab?.wrap ?? "bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
        <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-indigo-500 to-violet-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
          <Lock className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className={`font-semibold ${ab?.titleClass ?? "text-indigo-900"}`}>Set Password</h2>
          <p className={`text-xs ${ab?.descClass ?? "text-indigo-600"}`}>Recipients must enter this password to open the document.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label="Password protection applied"
          downloadId={uploadedId} shareToken={uploadedShareToken} fileName={uploadedName} onReset={reset}
          accentBtn="border-rose-200 text-[#C81934] hover:bg-rose-50"
        />
      ) : (
        <>
          {!file ? (
            <FileDropZone onFiles={(f) => setFile(f[0])} label="Click or drag a PDF here"
              hint="Upload the PDF you want to password-protect" colorScheme="indigo" />
          ) : (
            <FileRow name={file.name} size={file.size} onRemove={() => setFile(null)} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-indigo-700 font-semibold text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password…"
                autoComplete="new-password"
                className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 pr-10" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-indigo-400">Use a mix of letters, numbers, and symbols for a strong password.</p>
          </div>

          <Button
            className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
            disabled={!file || uploadMutation.isPending} onClick={handleUpload}
          >
            {uploadMutation.isPending
              ? <><span className="animate-spin mr-2">⏳</span>Securing…</>
              : <><Lock className="w-4 h-4 mr-2" />Set Password &amp; Download</>}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Print Control Tab ─────────────────────────────────────────────────────────

function PrintControlTab() {
  const accentBtn = useAccentBtn("from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600");
  const ab = useAccentInnerBanner();
  const [file, setFile] = useState<File | null>(null);
  const [restrictPrint, setRestrictPrint] = useState(false);
  const [restrictCopy, setRestrictCopy] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedShareToken, setUploadedShareToken] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => { setFile(null); setRestrictPrint(false); setRestrictCopy(false); setUploadedId(null); setUploadedShareToken(""); setUploadedName(""); };

  const handleUpload = async () => {
    if (!file) return;
    const name = file.name;
    setIsProcessing(true);

    let restrictedFile: File;
    try {
      const inputBytes = new Uint8Array(await file.arrayBuffer());
      // AES-256 (PDF 2.0 / R6) via qpdf-wasm. Empty user password lets the
      // file open freely; the random owner password locks the permissions.
      const restrictedBytes = await encryptPdfAes256(inputBytes, "", undefined, {
        allowPrinting: !restrictPrint,
        allowCopying: !restrictCopy,
        // Matches prior pdf-lib behaviour: lock down modifications, annotations,
        // form filling and page assembly so the toggled permissions can't be
        // worked around inside a viewer.
        allowModifications: false,
      });
      restrictedFile = new File([new Uint8Array(restrictedBytes)], file.name, { type: "application/pdf" });
    } catch {
      toast({ title: "Restriction failed", description: "Could not apply print restrictions to this PDF.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    uploadMutation.mutate({ data: { file: restrictedFile, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedShareToken(data.shareToken); setUploadedName(name); setFile(null);
        saveToLocalHistory({ id: data.id, shareToken: data.shareToken, originalName: data.originalName, fileSize: data.fileSize, expiryDate: data.expiryDate, createdAt: data.createdAt, updatedAt: data.updatedAt });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
        scheduleAutoRefresh();
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
      onSettled: () => setIsProcessing(false),
    });
  };

  const Toggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: React.ElementType; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-800">{label}</span>
      </div>
      <button type="button" onClick={onChange}
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${value ? "bg-amber-500" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className={`${ab?.wrap ?? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
        <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-amber-500 to-orange-500"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
          <Printer className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className={`font-semibold ${ab?.titleClass ?? "text-amber-900"}`}>Print Control</h2>
          <p className={`text-xs ${ab?.descClass ?? "text-amber-600"}`}>Restrict or allow printing and text copying for this document.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label={`Printing ${restrictPrint ? "restricted" : "allowed"} · Copying ${restrictCopy ? "restricted" : "allowed"}`}
          downloadId={uploadedId} shareToken={uploadedShareToken} fileName={uploadedName} onReset={reset}
          accentBtn="border-rose-200 text-[#C81934] hover:bg-rose-50"
        />
      ) : (
        <>
          {!file ? (
            <FileDropZone onFiles={(f) => setFile(f[0])} label="Click or drag a PDF here"
              hint="Upload the PDF you want to restrict printing on" colorScheme="amber" />
          ) : (
            <FileRow name={file.name} size={file.size} onRemove={() => setFile(null)} />
          )}

          <div className="space-y-1.5">
            <Label className="text-amber-700 font-semibold text-sm flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Permissions
            </Label>
            <div className="space-y-2">
              <Toggle label={restrictPrint ? "Restrict Printing" : "Allow Printing"} icon={Printer} value={restrictPrint} onChange={() => setRestrictPrint(v => !v)} />
              <Toggle label={restrictCopy ? "Restrict Text Copying" : "Allow Text Copying"} icon={Copy} value={restrictCopy} onChange={() => setRestrictCopy(v => !v)} />
            </div>
            <p className="text-xs text-amber-400">Disabled permissions are enforced for all recipients of this document.</p>
          </div>

          <Button
            className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
            disabled={!file || isProcessing || uploadMutation.isPending} onClick={handleUpload}
          >
            {isProcessing
              ? <><span className="animate-spin mr-2">⏳</span>Applying Restrictions…</>
              : uploadMutation.isPending
              ? <><span className="animate-spin mr-2">⏳</span>Uploading…</>
              : <><ShieldOff className="w-4 h-4 mr-2" />Apply Controls &amp; Download</>}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Revoke Expiry Tab ─────────────────────────────────────────────────────────

function RevokeExpiryTab() {
  const accentBtn = useAccentBtn("from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700");
  const ab = useAccentInnerBanner();
  const [history, setHistory] = useState<LocalPdfEntry[]>([]);
  const [pdfId, setPdfId] = useState("");
  const [shareToken, setShareToken] = useState("");
  const [selectedFromHistory, setSelectedFromHistory] = useState<number | null>(null);

  // Step-2 state (after OTP requested)
  const [otpId, setOtpId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));

  // Step-3 state (after verify)
  const [restoredId, setRestoredId] = useState<number | null>(null);
  const [restoredToken, setRestoredToken] = useState("");
  const [restoredName, setRestoredName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const requestMutation = useRequestRevokeOtp();
  const verifyMutation = useVerifyRevokeOtp();

  // Live countdown for the OTP TTL
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  useEffect(() => {
    if (!otpExpiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(otpExpiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [otpExpiresAt]);

  useEffect(() => {
    setHistory(loadLocalHistory());
  }, []);

  const reset = () => {
    setPdfId(""); setShareToken(""); setSelectedFromHistory(null);
    setOtpId(null); setOtpCode(""); setOtpExpiresAt(null); setEnteredCode("");
    setNewExpiryDate(format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"));
    setRestoredId(null); setRestoredToken(""); setRestoredName("");
  };

  const pickFromHistory = (entry: LocalPdfEntry) => {
    setPdfId(String(entry.id));
    setShareToken(entry.shareToken);
    setSelectedFromHistory(entry.id);
    setRestoredName(entry.originalName);
  };

  const handleRequestOtp = () => {
    const id = parseInt(pdfId, 10);
    if (isNaN(id) || !shareToken) {
      toast({
        title: "Missing details",
        description: "Pick a document from history or enter the PDF ID and share token.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate(
      { id, data: { shareToken } },
      {
        onSuccess: (data) => {
          setOtpId(data.otpId);
          setOtpCode(data.code);
          setOtpExpiresAt(data.expiresAt);
          toast({ title: "OTP generated", description: "Share the 6-digit code with the recipient." });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Could not generate OTP.";
          toast({ title: "Request failed", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const handleVerifyOtp = () => {
    const id = parseInt(pdfId, 10);
    if (otpId === null || !enteredCode || !newExpiryDate) {
      toast({ title: "Fill all fields", description: "Enter the OTP and a new expiry date.", variant: "destructive" });
      return;
    }
    verifyMutation.mutate(
      { id, data: { shareToken, otpId, code: enteredCode, newExpiryDate: new Date(newExpiryDate).toISOString() } },
      {
        onSuccess: (data) => {
          setRestoredId(data.id);
          setRestoredToken(shareToken);
          setRestoredName(restoredName || data.originalName);
          // Update local history with the new expiry
          saveToLocalHistory({
            id: data.id, shareToken,
            originalName: data.originalName, fileSize: data.fileSize,
            expiryDate: data.expiryDate,
            createdAt: data.createdAt, updatedAt: data.updatedAt,
          });
          queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
          toast({ title: "Access restored", description: "The PDF is available again." });
          scheduleAutoRefresh();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Verification failed.";
          toast({ title: "Could not revoke expiry", description: msg, variant: "destructive" });
        },
      },
    );
  };

  const copyOtp = async () => {
    try {
      await navigator.clipboard.writeText(otpCode);
      toast({ title: "Copied", description: "OTP copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the code manually.", variant: "destructive" });
    }
  };

  const formattedTimer = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(1, "0")}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  // ─── Final success screen ─────────────────────────────────
  if (restoredId !== null) {
    return (
      <div className="space-y-4">
        <div className={`${ab?.wrap ?? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"} rounded-xl px-4 py-3 flex items-center gap-3`}>
          <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-emerald-500 to-teal-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className={`font-semibold ${ab?.titleClass ?? "text-emerald-900"}`}>Expiry revoked</h2>
            <p className={`text-xs ${ab?.descClass ?? "text-emerald-600"}`}>The recipient can access this PDF until {format(new Date(newExpiryDate), "MMMM d, yyyy 'at' h:mm a")}.</p>
          </div>
        </div>
        <SuccessCard
          label={`New expiry: ${format(new Date(newExpiryDate), "MMMM d, yyyy 'at' h:mm a")}`}
          downloadId={restoredId}
          shareToken={restoredToken}
          fileName={restoredName || `pdf-${restoredId}.pdf`}
          onReset={reset}
          accentBtn="border-rose-200 text-[#C81934] hover:bg-rose-50"
        />
      </div>
    );
  }

  // ─── Step 2: enter OTP ─────────────────────────────────────
  if (otpId !== null) {
    const isExpired = secondsLeft === 0;
    return (
      <div className="space-y-4">
        <div className={`${ab?.wrap ?? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"} rounded-xl px-4 py-3 flex items-center gap-3`}>
          <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-emerald-500 to-teal-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className={`font-semibold ${ab?.titleClass ?? "text-emerald-900"}`}>Share this code with the recipient</h2>
            <p className={`text-xs ${ab?.descClass ?? "text-emerald-600"}`}>In production this is emailed to your team. For this demo it is shown here.</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-emerald-700 font-semibold text-xs uppercase tracking-wide">One-Time Code</Label>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${isExpired ? "text-red-600" : "text-emerald-600"}`}>
              <Timer className="w-3 h-3" /> {isExpired ? "Expired" : `Expires in ${formattedTimer}`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-3xl font-bold tracking-[0.4em] text-emerald-700 select-all">{otpCode}</p>
            <Button
              type="button" variant="outline" size="sm"
              onClick={copyOtp}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="enterOtp" className="text-emerald-700 font-semibold text-sm flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Enter OTP
          </Label>
          <Input
            id="enterOtp"
            value={enteredCode}
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 font-mono tracking-widest text-center text-lg"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newExpiry" className="text-emerald-700 font-semibold text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> New Expiry Date &amp; Time
          </Label>
          <Input
            id="newExpiry" type="datetime-local" value={newExpiryDate}
            min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => setNewExpiryDate(e.target.value)}
            className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
          />
          <p className="text-xs text-emerald-500">Recipient regains access until this exact moment.</p>
        </div>

        <Button
          className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
          disabled={!enteredCode || enteredCode.length < 6 || verifyMutation.isPending || isExpired}
          onClick={handleVerifyOtp}
          data-testid="button-verify-otp"
        >
          {verifyMutation.isPending
            ? <><span className="animate-spin mr-2">⏳</span>Restoring access…</>
            : <><ShieldCheck className="w-4 h-4 mr-2" />Verify &amp; Restore Access</>}
        </Button>

        <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={reset}>
          <RotateCcw className="w-4 h-4 mr-2" /> Start Over
        </Button>
      </div>
    );
  }

  // ─── Step 1: identify the PDF ─────────────────────────────
  return (
    <div className="space-y-4">
      <div className={`${ab?.wrap ?? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
        <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-emerald-500 to-teal-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className={`font-semibold ${ab?.titleClass ?? "text-emerald-900"}`}>Revoke Expiry</h2>
          <p className={`text-xs ${ab?.descClass ?? "text-emerald-600"}`}>Generate a one-time code to reopen access to an expired or active PDF.</p>
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-emerald-700 font-semibold text-sm flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Pick from your documents
          </Label>
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {history.map((entry) => {
              const isSelected = selectedFromHistory === entry.id;
              return (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => pickFromHistory(entry)}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.originalName}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(entry.fileSize)} · expires {format(new Date(entry.expiryDate + "T00:00:00"), "MMM d, yyyy")}
                      {entry.isExpired && <span className="ml-1.5 text-red-600 font-medium">· Expired</span>}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pdfId" className="text-emerald-700 font-semibold text-sm">PDF ID</Label>
          <Input
            id="pdfId" type="number" value={pdfId} placeholder="e.g. 42"
            onChange={(e) => { setPdfId(e.target.value); setSelectedFromHistory(null); }}
            className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shareToken" className="text-emerald-700 font-semibold text-sm">Share Token</Label>
          <Input
            id="shareToken" value={shareToken} placeholder="Token from upload"
            onChange={(e) => { setShareToken(e.target.value); setSelectedFromHistory(null); }}
            className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400/20 font-mono text-xs"
          />
        </div>
      </div>
      <p className="text-xs text-emerald-500/90">
        Both values are returned when you upload a PDF and stored in your local history.
      </p>

      <Button
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
        disabled={!pdfId || !shareToken || requestMutation.isPending}
        onClick={handleRequestOtp}
        data-testid="button-request-otp"
      >
        {requestMutation.isPending
          ? <><span className="animate-spin mr-2">⏳</span>Generating…</>
          : <><Send className="w-4 h-4 mr-2" />Generate OTP</>}
      </Button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SecurePdfContent() {
  return (
    <AccentProvider value="red">
      <SecurePdfContentInner />
    </AccentProvider>
  );
}

function SecurePdfContentInner() {
  const ab = useAccentInnerBanner();
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header banner */}
      <div className="bg-gradient-to-br from-[#E61E3C] via-[#D71B37] to-[#C81934] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Secure Your PDF</h1>
            <p className="text-white/85 text-sm mt-0.5">Choose one type of protection and apply it to your PDF</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Calendar className="w-3 h-3" />Expiry Date</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Lock className="w-3 h-3" />Password</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Printer className="w-3 h-3" />Print Control</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><KeyRound className="w-3 h-3" />Revoke Expiry</span>
        </div>
      </div>

      {/* Tabbed card */}
      <Card className="border-rose-100 shadow-sm">
        <CardContent className="pt-6">
          <Tabs defaultValue="expiry">
            <TabsList className={`grid w-full grid-cols-2 sm:grid-cols-4 gap-1 mb-6 ${ab?.tabsListBg ?? "bg-rose-50 border border-rose-100"} p-1 rounded-xl h-auto`}>
              <TabsTrigger
                value="expiry"
                data-testid="tab-expiry"
                className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-rose-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
              >
                <Calendar className="w-4 h-4" />
                Expiry Date
              </TabsTrigger>
              <TabsTrigger
                value="password"
                data-testid="tab-password"
                className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-indigo-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
              >
                <Lock className="w-4 h-4" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="print-control"
                data-testid="tab-print-control"
                className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-amber-500"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
              >
                <Printer className="w-4 h-4" />
                Print Control
              </TabsTrigger>
              <TabsTrigger
                value="revoke-expiry"
                data-testid="tab-revoke-expiry"
                className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-emerald-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
              >
                <KeyRound className="w-4 h-4" />
                Revoke Expiry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expiry">
              <ExpiryTab />
            </TabsContent>

            <TabsContent value="password">
              <PasswordTab />
            </TabsContent>

            <TabsContent value="print-control">
              <PrintControlTab />
            </TabsContent>

            <TabsContent value="revoke-expiry">
              <RevokeExpiryTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SecurePdfPage() {
  return <Layout><SecurePdfContent /></Layout>;
}
