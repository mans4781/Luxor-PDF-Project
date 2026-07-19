import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { TOOL_CATEGORIES } from "@/lib/tools-registry";

export default function OnlineTools() {
  useEffect(() => {
    document.title = "Online PDF Tools — Luxor PDF Secure";
  }, []);

  return (
    <MarketingLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Online PDF Tools
          </h1>
          <p className="mt-2 text-slate-500">
            Everything you need to organise, convert, and shrink your PDFs — each
            tool runs right in your browser, no upload required.
          </p>
        </header>

        {TOOL_CATEGORIES.map((cat) => (
          <section key={cat.key}>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-400 mb-4">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    data-testid={`tool-card-${tool.slug}`}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                  >
                    <div
                      className={`flex w-11 h-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900">
                          {tool.title}
                        </h3>
                        <ArrowRight className="w-4 h-4 text-slate-300 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-slate-500" />
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 leading-snug">
                        {tool.subtitle}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </MarketingLayout>
  );
}
