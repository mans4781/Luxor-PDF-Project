import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Calendar, Lock, Printer,
  UploadCloud, Eye, EyeOff, Copy, ShieldOff, Download, CheckCircle2, RotateCcw,
} from "lucide-react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { format, addDays } from "date-fns";

function UploadZone({ file, onFile, onClear, accent }: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accent: { border: string; bg: string; icon: string; label: string; hint: string; iconBg: string; fileBg: string; fileBorder: string; fileText: string; fileSub: string; changeBtn: string };
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") onFile(f);
    else toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
  };

  if (file) {
    return (
      <div className={`flex items-center justify-between ${accent.fileBg} border ${accent.fileBorder} rounded-xl px-4 py-3`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 ${accent.iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${accent.fileText} truncate max-w-[180px]`}>{file.name}</p>
            <p className={`text-xs ${accent.fileSub}`}>{formatBytes(file.size)} · PDF</p>
          </div>
        </div>
        <button onClick={onClear} className={`${accent.changeBtn} text-xs font-medium transition-colors`}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
        dragging ? `${accent.border} ${accent.bg} scale-[1.01]` : `border-slate-200 hover:${accent.border} hover:${accent.bg}`
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      <div className={`w-10 h-10 ${accent.iconBg} rounded-xl flex items-center justify-center shadow-md mx-auto mb-2 opacity-80`}>
        <UploadCloud className="w-5 h-5 text-white" />
      </div>
      <p className={`text-sm font-semibold ${accent.label}`}>Click or drag a PDF here</p>
      <p className={`text-xs ${accent.hint} mt-0.5`}>Supports .pdf up to 50MB</p>
    </div>
  );
}

function SuccessCard({ label, downloadId, fileName, onReset, accentBtn }: {
  label: string;
  downloadId: number;
  fileName: string;
  onReset: () => void;
  accentBtn: string;
}) {
  return (
    <div className="space-y-3">
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
      <a href={`/api/pdfs/${downloadId}/download`} download>
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md font-semibold">
          <Download className="w-4 h-4 mr-2" />
          Download Secured PDF
        </Button>
      </a>
      <Button variant="outline" className={`w-full ${accentBtn}`} onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Secure Another PDF
      </Button>
    </div>
  );
}

const roseAccent = {
  border: "border-rose-400", bg: "bg-rose-50",
  icon: "text-white", iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
  label: "text-rose-700", hint: "text-rose-400",
  fileBg: "bg-rose-50", fileBorder: "border-rose-200",
  fileText: "text-rose-800", fileSub: "text-rose-500",
  changeBtn: "text-rose-400 hover:text-rose-600",
};

const indigoAccent = {
  border: "border-indigo-400", bg: "bg-indigo-50",
  icon: "text-white", iconBg: "bg-gradient-to-br from-indigo-500 to-violet-600",
  label: "text-indigo-700", hint: "text-indigo-400",
  fileBg: "bg-indigo-50", fileBorder: "border-indigo-200",
  fileText: "text-indigo-800", fileSub: "text-indigo-500",
  changeBtn: "text-indigo-400 hover:text-indigo-600",
};

const amberAccent = {
  border: "border-amber-400", bg: "bg-amber-50",
  icon: "text-white", iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
  label: "text-amber-700", hint: "text-amber-400",
  fileBg: "bg-amber-50", fileBorder: "border-amber-200",
  fileText: "text-amber-800", fileSub: "text-amber-500",
  changeBtn: "text-amber-400 hover:text-amber-600",
};

function ExpirySection() {
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const handleReset = () => {
    setFile(null);
    setUploadedId(null);
    setUploadedName("");
    setExpiryDate(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  };

  const handleUpload = () => {
    if (!file) return;
    const name = file.name;
    uploadMutation.mutate({ data: { file, expiryDate } }, {
      onSuccess: (data) => {
        setUploadedId(data.id);
        setUploadedName(name);
        setFile(null);
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <Card className="border-rose-100 shadow-sm">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-rose-800">Set Expiry Date</p>
            <p className="text-xs text-rose-400">PDF auto-locks after this date</p>
          </div>
        </div>

        {uploadedId !== null ? (
          <SuccessCard
            label={`Expires on ${format(new Date(expiryDate + "T00:00:00"), "MMMM d, yyyy")}`}
            downloadId={uploadedId}
            fileName={uploadedName}
            onReset={handleReset}
            accentBtn="border-rose-200 text-rose-600 hover:bg-rose-50"
          />
        ) : (
          <>
            <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} accent={roseAccent} />
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate" className="text-rose-700 font-semibold text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Expiry Date
              </Label>
              <Input
                id="expiryDate" type="date" value={expiryDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20"
              />
              <p className="text-xs text-rose-400">The PDF will be automatically locked after this date — no views or downloads.</p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
              disabled={!file || uploadMutation.isPending}
              onClick={handleUpload}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? "Securing…" : "Apply Expiry & Upload"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PasswordSection() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const handleReset = () => {
    setFile(null);
    setPassword("");
    setUploadedId(null);
    setUploadedName("");
  };

  const handleUpload = () => {
    if (!file) return;
    if (!password) {
      toast({ title: "Password required", description: "Please enter a password to protect this PDF.", variant: "destructive" });
      return;
    }
    const name = file.name;
    uploadMutation.mutate({ data: { file, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id);
        setUploadedName(name);
        setFile(null);
        setPassword("");
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-indigo-800">Set Password</p>
            <p className="text-xs text-indigo-400">Require a password to open the PDF</p>
          </div>
        </div>

        {uploadedId !== null ? (
          <SuccessCard
            label="Password protection applied"
            downloadId={uploadedId}
            fileName={uploadedName}
            onReset={handleReset}
            accentBtn="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          />
        ) : (
          <>
            <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} accent={indigoAccent} />
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-indigo-700 font-semibold text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password…"
                  className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-indigo-400">Recipients must enter this password before they can open the document.</p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold"
              disabled={!file || uploadMutation.isPending}
              onClick={handleUpload}
            >
              <Lock className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? "Securing…" : "Set Password & Upload"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PrintControlSection() {
  const [file, setFile] = useState<File | null>(null);
  const [allowPrint, setAllowPrint] = useState(false);
  const [allowCopy, setAllowCopy] = useState(false);
  const [uploadedId, setUploadedId] = useState<number | null>(null);
  const [uploadedName, setUploadedName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const handleReset = () => {
    setFile(null);
    setAllowPrint(false);
    setAllowCopy(false);
    setUploadedId(null);
    setUploadedName("");
  };

  const handleUpload = () => {
    if (!file) return;
    const name = file.name;
    uploadMutation.mutate({ data: { file, expiryDate: format(addDays(new Date(), 365), "yyyy-MM-dd") } }, {
      onSuccess: (data) => {
        setUploadedId(data.id);
        setUploadedName(name);
        setFile(null);
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => toast({ title: "Upload failed", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  const Toggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: React.ElementType; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-800">{label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${value ? "bg-amber-500" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <Card className="border-amber-100 shadow-sm">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-amber-800">Print Control</p>
            <p className="text-xs text-amber-400">Restrict printing and text copying</p>
          </div>
        </div>

        {uploadedId !== null ? (
          <SuccessCard
            label={`Printing ${allowPrint ? "allowed" : "restricted"} · Copying ${allowCopy ? "allowed" : "restricted"}`}
            downloadId={uploadedId}
            fileName={uploadedName}
            onReset={handleReset}
            accentBtn="border-amber-200 text-amber-600 hover:bg-amber-50"
          />
        ) : (
          <>
            <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} accent={amberAccent} />
            <div className="space-y-1.5">
              <Label className="text-amber-700 font-semibold text-sm flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Permissions
              </Label>
              <div className="space-y-2">
                <Toggle label="Allow Printing" icon={Printer} value={allowPrint} onChange={() => setAllowPrint(v => !v)} />
                <Toggle label="Allow Text Copying" icon={Copy} value={allowCopy} onChange={() => setAllowCopy(v => !v)} />
              </div>
              <p className="text-xs text-amber-400">Disabled options are restricted for all recipients of this document.</p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md font-semibold"
              disabled={!file || uploadMutation.isPending}
              onClick={handleUpload}
            >
              <ShieldOff className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? "Securing…" : "Apply Controls & Upload"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SecurePdfContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Secure Your PDF</h1>
            <p className="text-rose-200 text-sm mt-0.5">Each tool below applies one type of protection independently</p>
          </div>
        </div>
      </div>

      <ExpirySection />
      <PasswordSection />
      <PrintControlSection />
    </div>
  );
}

export default function SecurePdfPage() {
  return <Layout><SecurePdfContent /></Layout>;
}
