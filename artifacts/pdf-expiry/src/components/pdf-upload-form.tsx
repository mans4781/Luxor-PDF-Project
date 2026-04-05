import { useState, useRef } from "react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, ShieldCheck, X, Lock } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";

export function PdfUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const uploadMutation = useUploadPdf();

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a PDF file.", variant: "destructive" });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expiryDate", expiryDate);
    uploadMutation.mutate({ data: formData as any }, {
      onSuccess: () => {
        toast({ title: "Document uploaded successfully", description: "The document has been securely stored." });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: () => {
        toast({ title: "Upload failed", description: "An error occurred while uploading the document.", variant: "destructive" });
      },
    });
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
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

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

      {/* ── Expiry date ── */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate" className="text-rose-700 font-medium flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />Expiry Date
        </Label>
        <Input
          id="expiryDate"
          type="date"
          value={expiryDate}
          min={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400/20"
        />
        <p className="text-xs text-rose-400">The document will become inaccessible after this date.</p>
      </div>

      {/* ── Upload button ── */}
      <Button
        className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white border-0 shadow-md font-semibold"
        disabled={!file || uploadMutation.isPending}
        onClick={handleUpload}
      >
        <ShieldCheck className="w-4 h-4 mr-2" />
        {uploadMutation.isPending ? "Uploading…" : "Secure & Upload"}
      </Button>
    </div>
  );
}
