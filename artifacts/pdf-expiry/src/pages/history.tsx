import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfList, type LocalPdfEntry } from "@/components/pdf-list";

const STORAGE_KEY = "luxor_pdf_history";

function isExpired(expiryDate: string): boolean {
  // Support both new ISO 8601 datetime values and legacy YYYY-MM-DD strings.
  const expiry = /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
    ? new Date(expiryDate + "T23:59:59.999Z")
    : new Date(expiryDate);
  return new Date() > expiry;
}

export function loadLocalHistory(): LocalPdfEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: LocalPdfEntry[] = JSON.parse(raw);
    return entries.map((e) => ({ ...e, isExpired: isExpired(e.expiryDate) }));
  } catch {
    return [];
  }
}

export function saveToLocalHistory(entry: Omit<LocalPdfEntry, "isExpired">): void {
  const existing = loadLocalHistory();
  const updated = [{ ...entry, isExpired: isExpired(entry.expiryDate) }, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

function removeFromLocalHistory(id: number): void {
  const existing = loadLocalHistory();
  const updated = existing.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export default function History() {
  const [pdfs, setPdfs] = useState<LocalPdfEntry[]>([]);

  const refresh = useCallback(() => {
    setPdfs(loadLocalHistory());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDeleted = (id: number) => {
    removeFromLocalHistory(id);
    refresh();
  };

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Document History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Documents you have secured on this device. History is stored locally and is only visible to you.
          </p>
          <PdfList pdfs={pdfs} isLoading={false} showFilters onDeleted={handleDeleted} />
        </CardContent>
      </Card>
    </Layout>
  );
}
