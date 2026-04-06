import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Calendar, Lock, Printer,
  UploadCloud, Eye, EyeOff, Copy, ShieldOff, Download, CheckCircle2, RotateCcw,
} from "lucide-react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";
import { format, addDays } from "date-fns";

function UploadZone({ file, onFile, onClear }: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
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
      <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800 truncate max-w-[180px]">{file.name}</p>
            <p className="text-xs text-rose-500">{formatBytes(file.size)} · PDF</p>
          </div>
        </div>
        <button onClick={onClear} className="text-rose-400 hover:text-rose-600 text-xs font-medium transition-colors">
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
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
        dragging
          ? "border-rose-500 bg-rose-50 scale-[1.01]"
          : "border-rose-200 hover:border-rose-400 hover:bg-rose-50/60 bg-gradient-to-br from-rose-50/40 to-red-50/20"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md mx-auto mb-3 opacity-80">
        <UploadCloud className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm font-semibold text-rose-700">Click or drag a PDF here</p>
      <p className="text-xs text-rose-400 mt-1">Supports .pdf up to 50MB</p>
    </div>
  );
}

function SuccessCard({ label, downloadId, fileName, onReset }: {
  label: string;
  downloadId: number;
  fileName: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-6 px-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-emerald-800">Secured successfully!</p>
          <p className="text-xs text-emerald-600 mt-0.5 truncate max-w-[240px] mx-auto">{fileName}</p>
          <p className="text-xs text-emerald-500 mt-1">{label}</p>
        </div>
      </div>

      <a href={`/api/pdfs/${downloadId}/download`} download>
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md font-semibold">
          <Download className="w-4 h-4 mr-2" />
          Download Secured PDF
        </Button>
      </a>

      <Button
        variant="outline"
        className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
        onClick={onReset}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Secure Another PDF
      </Button>
    </div>
  );
}

function ExpiryTab() {
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

  if (uploadedId !== null) {
    return (
      <SuccessCard
        label={`Expires on ${format(new Date(expiryDate + "T00:00:00"), "MMMM d, yyyy")}`}
        downloadId={uploadedId}
        fileName={uploadedName}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} />
      <div className="space-y-2">
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
    </div>
  );
}

function PasswordTab() {
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

  if (uploadedId !== null) {
    return (
      <SuccessCard
        label="Password protection applied"
        downloadId={uploadedId}
        fileName={uploadedName}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-4">
      <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} />
      <div className="space-y-2">
        <Label htmlFor="password" className="text-rose-700 font-semibold text-sm flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password…"
            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-rose-400">Recipients must enter this password before they can open the document.</p>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
        disabled={!file || uploadMutation.isPending}
        onClick={handleUpload}
      >
        <Lock className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? "Securing…" : "Set Password & Upload"}
      </Button>
    </div>
  );
}

function PrintControlTab() {
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

  if (uploadedId !== null) {
    return (
      <SuccessCard
        label={`Printing ${allowPrint ? "allowed" : "restricted"} · Copying ${allowCopy ? "allowed" : "restricted"}`}
        downloadId={uploadedId}
        fileName={uploadedName}
        onReset={handleReset}
      />
    );
  }

  const Toggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: React.ElementType; value: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-rose-500" />
        <span className="text-sm font-medium text-rose-800">{label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${value ? "bg-rose-500" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} />
      <div className="space-y-2">
        <Label className="text-rose-700 font-semibold text-sm flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> Permissions
        </Label>
        <div className="space-y-2">
          <Toggle label="Allow Printing" icon={Printer} value={allowPrint} onChange={() => setAllowPrint(v => !v)} />
          <Toggle label="Allow Text Copying" icon={Copy} value={allowCopy} onChange={() => setAllowCopy(v => !v)} />
        </div>
        <p className="text-xs text-rose-400">Disabled options are restricted for all recipients of this document.</p>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
        disabled={!file || uploadMutation.isPending}
        onClick={handleUpload}
      >
        <ShieldOff className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? "Securing…" : "Apply Controls & Upload"}
      </Button>
    </div>
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
              <p className="text-rose-200 text-sm mt-0.5">Protect with expiry dates, passwords &amp; print controls</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              <Calendar className="w-3 h-3" />Set Expiry Date
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              <Lock className="w-3 h-3" />Set Password
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              <Printer className="w-3 h-3" />Print Control
            </span>
          </div>
        </div>

        <Card className="border-rose-100 shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="expiry">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-rose-50 border border-rose-100 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="expiry"
                  className="flex items-center gap-1.5 rounded-lg py-2 text-rose-600 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm font-medium text-sm"
                >
                  <Calendar className="w-4 h-4" /> Expiry Date
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="flex items-center gap-1.5 rounded-lg py-2 text-rose-600 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm font-medium text-sm"
                >
                  <Lock className="w-4 h-4" /> Password
                </TabsTrigger>
                <TabsTrigger
                  value="print"
                  className="flex items-center gap-1.5 rounded-lg py-2 text-rose-600 data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm font-medium text-sm"
                >
                  <Printer className="w-4 h-4" /> Print Control
                </TabsTrigger>
              </TabsList>

              <TabsContent value="expiry"><ExpiryTab /></TabsContent>
              <TabsContent value="password"><PasswordTab /></TabsContent>
              <TabsContent value="print"><PrintControlTab /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
  );
}

export default function SecurePdfPage() {
  return <Layout><SecurePdfContent /></Layout>;
}
