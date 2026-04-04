import { useState } from "react";
import { format } from "date-fns";
import { Download, Trash2, ShieldAlert, ShieldCheck } from "lucide-react";
import { PdfRecord } from "@workspace/api-client-react";
import { useDeletePdf, getListPdfsQueryKey, getGetPdfStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PdfList({ pdfs, isLoading, showFilters = false }: { pdfs: PdfRecord[], isLoading: boolean, showFilters?: boolean }) {
  const [filter, setFilter] = useState("all");
  const deleteMutation = useDeletePdf();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredPdfs = pdfs.filter(pdf => {
    if (filter === "active") return !pdf.isExpired;
    if (filter === "expired") return pdf.isExpired;
    return true;
  });

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Document deleted" });
        queryClient.invalidateQueries({ queryKey: getListPdfsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPdfStatsQueryKey() });
      }
    });
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
              <TableHead>Expiry Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPdfs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 flex w-fit items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(pdf.expiryDate), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`/api/pdfs/${pdf.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(pdf.id)}
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
