import { useState } from "react";
import { format } from "date-fns";
import { Download, Trash2, ShieldAlert, ShieldCheck, FileX2, Ban } from "lucide-react";
import { useDeletePdf, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface LocalPdfEntry {
  id: number;
  shareToken: string;
  originalName: string;
  fileSize: number;
  expiryDate: string;
  expiryAction?: "corrupt" | "revoke";
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatExpiry(expiryDate: string): string {
  // Legacy date-only entries: show date only and avoid TZ wrap-around
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return format(new Date(expiryDate + "T12:00:00"), "MMM d, yyyy");
  }
  return format(new Date(expiryDate), "MMM d, yyyy 'at' h:mm a");
}

export function PdfList({
  pdfs,
  isLoading,
  showFilters = false,
  onDeleted,
}: {
  pdfs: LocalPdfEntry[];
  isLoading: boolean;
  showFilters?: boolean;
  onDeleted?: (id: number) => void;
}) {
  const [filter, setFilter] = useState("all");
  const deleteMutation = useDeletePdf();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredPdfs = pdfs.filter((pdf) => {
    if (filter === "active") return !pdf.isExpired;
    if (filter === "expired") return pdf.isExpired;
    return true;
  });

  const handleDelete = (id: number, shareToken: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    deleteMutation.mutate(
      { id, params: { shareToken } },
      {
        onSuccess: () => {
          toast({ title: "Document deleted" });
          queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
          onDeleted?.(id);
        },
        onError: () => {
          toast({ title: "Delete failed", description: "Could not delete this document.", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex justify-end">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="expired">Expired Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>After Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPdfs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPdfs.map((pdf) => (
                <TableRow key={pdf.id}>
                  <TableCell>
                    <div className="font-medium">{pdf.originalName}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(pdf.fileSize)}</div>
                  </TableCell>
                  <TableCell>
                    {pdf.isExpired ? (
                      <Badge variant="destructive" className="flex w-fit items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Expired
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-100 flex w-fit items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatExpiry(pdf.expiryDate)}</div>
                  </TableCell>
                  <TableCell>
                    {pdf.expiryAction === "corrupt" ? (
                      <Badge
                        variant="secondary"
                        className="bg-rose-100 text-rose-800 hover:bg-rose-100 flex w-fit items-center gap-1"
                      >
                        <FileX2 className="w-3 h-3" /> Corrupt
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-800 hover:bg-slate-100 flex w-fit items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> Revoke
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/pdfs/${pdf.id}/download?shareToken=${encodeURIComponent(pdf.shareToken)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(pdf.id, pdf.shareToken)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
