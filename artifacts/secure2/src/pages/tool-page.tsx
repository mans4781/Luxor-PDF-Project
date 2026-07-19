import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import { getToolBySlug, TOOL_CATEGORIES } from "@/lib/tools-registry";

export default function ToolPage() {
  const [, params] = useRoute("/tools/:slug");
  const slug = params?.slug ?? "";
  const tool = getToolBySlug(slug);

  useEffect(() => {
    if (tool) document.title = `${tool.title} — Luxor PDF Secure`;
  }, [tool]);

  if (!tool) return <NotFound />;

  const category = TOOL_CATEGORIES.find((c) => c.key === tool.category);
  const Icon = tool.icon;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb + back */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/online-tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            data-testid="link-back-to-tools"
          >
            <ArrowLeft className="w-4 h-4" />
            All tools
          </Link>
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Online Tools</span>
            <ChevronRight className="w-3 h-3" />
            <span>{category?.label}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 font-medium">{tool.title}</span>
          </nav>
        </div>

        {/* Hero banner */}
        <div
          className={`bg-gradient-to-br ${tool.accent} rounded-2xl p-6 text-white shadow-lg`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm shrink-0">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tool.title}</h1>
              <p className="text-white/85 text-sm mt-0.5">{tool.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Tool body */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            }
          >
            {tool.render()}
          </Suspense>
        </div>
      </div>
    </Layout>
  );
}
