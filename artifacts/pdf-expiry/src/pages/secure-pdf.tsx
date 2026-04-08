import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
  const c = dropColors[colorScheme];

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

function SuccessCard({ label, downloadId, fileName, onReset, accentBtn }: {
  label: string; downloadId: number; fileName: string;
  onReset: () => void; accentBtn: string;
}) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [expired, setExpired] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/pdfs/${downloadId}/download`);
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
        <Button
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md font-semibold"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <><span className="animate-spin mr-2">⏳</span>Downloading…</>
            : <><Download className="w-4 h-4 mr-2" />Download Secured PDF</>}
        </Button>
      )}
      <Button variant="outline" className={`w-full ${accentBtn}`} onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />Secure Another PDF
      </Button>
    </div>
  );
}

// ─── Expiry Tab ────────────────────────────────────────────────────────────────

function ExpiryTab() {
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => {
    setFile(null); setUploadedId(null); setUploadedName("");
    setExpiryDate(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  };

  const handleUpload = () => {
    if (!file) return;
    const name = file.name;
    uploadMutation.mutate({ data: { file, expiryDate } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedName(name); setFile(null);
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-rose-900">Set Expiry Date</h2>
          <p className="text-xs text-rose-600">The PDF auto-locks after this date — no views or downloads.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label={`Expires on ${format(new Date(expiryDate + "T00:00:00"), "MMMM d, yyyy")}`}
          downloadId={uploadedId} fileName={uploadedName} onReset={reset}
          accentBtn="border-rose-200 text-rose-600 hover:bg-rose-50"
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
              <Calendar className="w-3.5 h-3.5" /> Expiry Date
            </Label>
            <Input id="expiryDate" type="date" value={expiryDate}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20" />
            <p className="text-xs text-rose-400">Recipients will be unable to open or download the file after this date.</p>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
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
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => { setFile(null); setPassword(""); setShowPassword(false); setUploadedId(null); setUploadedName(""); };

  const handleUpload = async () => {
    if (!file) return;
    if (!password) {
      toast({ title: "Password required", description: "Please enter a password to protect this PDF.", variant: "destructive" });
      return;
    }
    const name = file.name;

    let encryptedFile: File;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      // Force PDF 1.7 so the security handler uses AES-128 (AESV2),
      // which all modern readers enforce. Without this the default
      // falls back to RC4-40 which Chrome and others silently bypass.
      (pdfDoc.context.header as unknown as { major: string; minor: string }).major = '1';
      (pdfDoc.context.header as unknown as { major: string; minor: string }).minor = '7';
      pdfDoc.encrypt({ userPassword: password, ownerPassword: password });
      const encryptedBytes = await pdfDoc.save();
      encryptedFile = new File([encryptedBytes], file.name, { type: "application/pdf" });
    } catch {
      toast({ title: "Encryption failed", description: "Could not encrypt this PDF. It may already be password-protected.", variant: "destructive" });
      return;
    }

    uploadMutation.mutate({ data: { file: encryptedFile, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedName(name); setFile(null); setPassword("");
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <Lock className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-indigo-900">Set Password</h2>
          <p className="text-xs text-indigo-600">Recipients must enter this password to open the document.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label="Password protection applied"
          downloadId={uploadedId} fileName={uploadedName} onReset={reset}
          accentBtn="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
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
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold"
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
  const [file, setFile] = useState<File | null>(null);
  const [restrictPrint, setRestrictPrint] = useState(false);
  const [restrictCopy, setRestrictCopy] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const reset = () => { setFile(null); setRestrictPrint(false); setRestrictCopy(false); setUploadedId(null); setUploadedName(""); };

  const handleUpload = async () => {
    if (!file) return;
    const name = file.name;
    setIsProcessing(true);

    let restrictedFile: File;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      // Force PDF 1.7 so the security handler uses AES-128 (AESV2)
      // which all modern readers enforce for permission restrictions.
      (pdfDoc.context.header as unknown as { major: string; minor: string }).major = '1';
      (pdfDoc.context.header as unknown as { major: string; minor: string }).minor = '7';
      // Empty userPassword = no open password required; random ownerPassword
      // ensures permissions cannot be overridden by the viewer.
      const ownerPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
      pdfDoc.encrypt({
        userPassword: "",
        ownerPassword,
        permissions: {
          printing: restrictPrint ? false : "highResolution",
          copying: !restrictCopy,
          modifying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      });
      const bytes = await pdfDoc.save();
      restrictedFile = new File([bytes], file.name, { type: "application/pdf" });
    } catch {
      toast({ title: "Restriction failed", description: "Could not apply print restrictions to this PDF.", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    uploadMutation.mutate({ data: { file: restrictedFile, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id); setUploadedName(name); setFile(null);
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
          <Printer className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-amber-900">Print Control</h2>
          <p className="text-xs text-amber-600">Restrict or allow printing and text copying for this document.</p>
        </div>
      </div>

      {uploadedId !== null ? (
        <SuccessCard
          label={`Printing ${restrictPrint ? "restricted" : "allowed"} · Copying ${restrictCopy ? "restricted" : "allowed"}`}
          downloadId={uploadedId} fileName={uploadedName} onReset={reset}
          accentBtn="border-amber-200 text-amber-600 hover:bg-amber-50"
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
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md font-semibold"
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export function SecurePdfContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header banner */}
      <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Secure Your PDF</h1>
            <p className="text-rose-200 text-sm mt-0.5">Choose one type of protection and apply it to your PDF</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Calendar className="w-3 h-3" />Expiry Date</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Lock className="w-3 h-3" />Password</span>
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Printer className="w-3 h-3" />Print Control</span>
        </div>
      </div>

      {/* Tabbed card */}
      <Card className="border-rose-100 shadow-sm">
        <CardContent className="pt-6">
          <Tabs defaultValue="expiry">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-rose-50 border border-rose-100 p-1 rounded-xl h-auto">
              <TabsTrigger
                value="expiry"
                data-testid="tab-expiry"
                className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4" />
                Expiry Date
              </TabsTrigger>
              <TabsTrigger
                value="password"
                data-testid="tab-password"
                className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <Lock className="w-4 h-4" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="print-control"
                data-testid="tab-print-control"
                className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Control
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SecurePdfPage() {
  return <Layout><SecurePdfContent /></Layout>;
}
