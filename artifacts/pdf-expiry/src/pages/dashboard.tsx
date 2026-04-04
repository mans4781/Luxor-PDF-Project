import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetPdfStats, useListPdfs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, ShieldAlert, ShieldCheck, HardDrive,
  Wrench, FileOutput, FileInput, ShieldOff,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { PdfUploadForm } from "@/components/pdf-upload-form";
import { PdfList } from "@/components/pdf-list";

const menuItems = [
  {
    label: "PDF Tool",
    description: "Merge, split & extract pages",
    href: "/pdf-tool",
    icon: Wrench,
    gradient: "from-violet-500 to-indigo-600",
    bg: "bg-gradient-to-br from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100",
    border: "border-violet-200 hover:border-violet-400",
    iconBg: "bg-gradient-to-br from-violet-500 to-indigo-600",
    textColor: "text-violet-700",
    descColor: "text-violet-500",
  },
  {
    label: "Convert from PDF",
    description: "PDF to images or text",
    href: "/convert?tab=pdf-to-images",
    icon: FileOutput,
    gradient: "from-orange-400 to-amber-500",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100",
    border: "border-orange-200 hover:border-orange-400",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    textColor: "text-orange-700",
    descColor: "text-orange-500",
  },
  {
    label: "Convert to PDF",
    description: "Images & files to PDF",
    href: "/convert?tab=images-to-pdf",
    icon: FileInput,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100",
    border: "border-emerald-200 hover:border-emerald-400",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    textColor: "text-emerald-700",
    descColor: "text-emerald-500",
  },
  {
    label: "PDF Expiry",
    description: "Upload & set expiry dates",
    href: "#expiry",
    icon: ShieldOff,
    gradient: "from-rose-500 to-red-600",
    bg: "bg-gradient-to-br from-rose-50 to-red-50 hover:from-rose-100 hover:to-red-100",
    border: "border-rose-200 hover:border-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    textColor: "text-rose-700",
    descColor: "text-rose-500",
  },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetPdfStats();
  const { data: pdfs, isLoading: pdfsLoading } = useListPdfs();

  return (
    <Layout>
      <div className="grid gap-6">

        {/* ── Quick Access Menu ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isAnchor = item.href.startsWith("#");
            const inner = (
              <div
                className={`flex flex-col items-center text-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${item.bg} ${item.border}`}
                data-testid={`menu-card-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={
                  isAnchor
                    ? () => document.getElementById("expiry")?.scrollIntoView({ behavior: "smooth" })
                    : undefined
                }
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${item.iconBg}`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                </div>
                <div>
                  <p className={`font-semibold text-sm leading-tight ${item.textColor}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 leading-tight ${item.descColor}`}>{item.description}</p>
                </div>
              </div>
            );

            return isAnchor ? (
              <div key={item.label}>{inner}</div>
            ) : (
              <Link key={item.label} href={item.href} className="block no-underline">
                {inner}
              </Link>
            );
          })}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{statsLoading ? "-" : stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Links</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{statsLoading ? "-" : stats?.expired || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : formatBytes(stats?.totalSize || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* ── Upload + Recent ── */}
        <div id="expiry" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Secure Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <PdfUploadForm />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <PdfList pdfs={pdfs?.slice(0, 5) || []} isLoading={pdfsLoading} />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </Layout>
  );
}
