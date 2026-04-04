import { Layout } from "@/components/layout";
import { useListPdfs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PdfList } from "@/components/pdf-list";

export default function History() {
  const { data: pdfs, isLoading } = useListPdfs();

  return (
    <Layout>
      <Card>
        <CardHeader>
          <CardTitle>Document History</CardTitle>
        </CardHeader>
        <CardContent>
          <PdfList pdfs={pdfs || []} isLoading={isLoading} showFilters />
        </CardContent>
      </Card>
    </Layout>
  );
}
