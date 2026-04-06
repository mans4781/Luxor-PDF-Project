import { useState, useRef } from "react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  UploadCloud, ShieldCheck, X, Lock, Calendar,
  Eye, EyeOff, Printer, ChevronDown, ChevronUp, Copy,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      enabled ? `${color} shadow-sm` : "border-slate-100 bg-slate-50/50"
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            enabled ? "bg-white/60" : "bg-slate-100"
          }`}>
            <Icon className={`w-4 h-4 ${enabled ? "text-rose-600" : "text-slate-400"}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${enabled ? "text-rose-800" : "text-slate-500"}`}>{title}</p>
            <p className={`text-xs ${enabled ? "text-rose-500" : "text-slate-400"}`}>{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-300 ${
            enabled ? "bg-rose-500" : "bg-slate-200"
          }`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`} />
          </div>
          {enabled
            ? <ChevronUp className="w-4 h-4 text-rose-400" />
            : <ChevronDown className="w-4 h-4 text-slate-300" />
          }
        </div>
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${
        enabled ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-rose-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PdfUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expiryEnabled, setExpiryEnabled] = useState(true);
  const [expiryDate, setExpiryDate] = useState<string>(format(addDays(new Date(), 7), "yyyy-MM-dd"));

  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [printEnabled, setPrintEnabled] = useState(false);
  const [allowPrint, setAllowPrint] = useState(false);
  const [allowCopy, setAllowCopy] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    if (passwordEnabled && !password) {
      toast({ title: "Password required", description: "Please enter a password or disable password protection.", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(
      { data: { file, expiryDate: expiryEnabled ? expiryDate : undefined } },
      {
        onSuccess: () => {
          toast({ title: "Document secured & uploaded", description: "Your PDF has been protected and stored." });
          setFile(null);
          setPassword("");
          if (fileInputRef.current) fileInputRef.current.value = "";
          queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Upload failed", description: "An error occurred while uploading.", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Drop zone ── */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? "border-rose-500 bg-rose-50 scale-[1.01]"
            : "border-rose-200 hover:border-rose-400 hover:bg-rose-50/60 bg-gradient-to-br from-rose-50/50 to-red-50/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md mx-auto">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="text-sm font-semibold text-rose-800 truncate max-w-[200px]">{file.name}</div>
            <div className="text-xs text-rose-500 font-medium">{formatBytes(file.size)} · PDF</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-7 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="w-3 h-3 mr-1" />Change file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md mx-auto opacity-80">
              <UploadCloud className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-semibold text-rose-700 mt-1">Click or drag a PDF here</p>
            <p className="text-xs text-rose-400">Supports .pdf up to 50MB</p>
          </div>
        )}
      </div>

      {/* ── Feature 1: Set Expiry Date ── */}
      <FeatureCard
        icon={Calendar}
        title="Set Expiry Date"
        description="Document becomes inaccessible after the set date"
        color="border-rose-200 bg-rose-50/60"
        enabled={expiryEnabled}
        onToggle={() => setExpiryEnabled(v => !v)}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="expiryDate" className="text-rose-700 text-xs font-semibold">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={expiryDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 text-sm"
          />
          <p className="text-xs text-rose-400">The PDF will be locked after this date — no downloads or views.</p>
        </div>
      </FeatureCard>

      {/* ── Feature 2: Set Password ── */}
      <FeatureCard
        icon={Lock}
        title="Set Password"
        description="Require a password to open this document"
        color="border-rose-200 bg-rose-50/60"
        enabled={passwordEnabled}
        onToggle={() => setPasswordEnabled(v => !v)}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="password" className="text-rose-700 text-xs font-semibold">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password…"
              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-rose-400">Recipients must enter this password before they can open the file.</p>
        </div>
      </FeatureCard>

      {/* ── Feature 3: Set Print Control ── */}
      <FeatureCard
        icon={Printer}
        title="Set Print Control"
        description="Control whether recipients can print or copy content"
        color="border-rose-200 bg-rose-50/60"
        enabled={printEnabled}
        onToggle={() => setPrintEnabled(v => !v)}
      >
        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between gap-3 cursor-pointer group">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-800">Allow Printing</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowPrint(v => !v)}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${
                allowPrint ? "bg-rose-500" : "bg-slate-200"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                allowPrint ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between gap-3 cursor-pointer group">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-800">Allow Text Copy</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowCopy(v => !v)}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 ${
                allowCopy ? "bg-rose-500" : "bg-slate-200"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                allowCopy ? "translate-x-4" : "translate-x-0"
              }`} />
            </button>
          </label>
          <p className="text-xs text-rose-400">When disabled, printing and copying are restricted for all recipients.</p>
        </div>
      </FeatureCard>

      {/* ── Upload button ── */}
      <Button
        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
        disabled={!file || uploadMutation.isPending}
        onClick={handleUpload}
      >
        <ShieldCheck className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? "Securing…" : "Secure & Upload"}
      </Button>
    </div>
  );
}
