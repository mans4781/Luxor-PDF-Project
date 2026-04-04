import { useState, useRef } from "react";
import { useUploadPdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryDate', expiryDate);

    uploadMutation.mutate({ data: formData as any }, {
      onSuccess: () => {
        toast({
          title: "Document uploaded successfully",
          description: "The document has been securely stored.",
        });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      },
      onError: (error) => {
        toast({
          title: "Upload failed",
          description: "An error occurred while uploading the document.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
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
            <div className="bg-primary/10 p-3 rounded-full">
              <FileIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="text-sm font-medium truncate max-w-[200px]">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 h-8"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="w-10 h-10 mb-2" />
            <div className="text-sm font-medium">Click or drag a PDF here</div>
            <div className="text-xs">Supports .pdf up to 50MB</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date</Label>
        <Input 
          id="expiryDate" 
          type="date" 
          value={expiryDate}
          min={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The document will become inaccessible after this date.
        </p>
      </div>

      <Button 
        className="w-full" 
        disabled={!file || uploadMutation.isPending}
        onClick={handleUpload}
      >
        {uploadMutation.isPending ? "Uploading..." : "Secure & Upload"}
      </Button>
    </div>
  );
}
