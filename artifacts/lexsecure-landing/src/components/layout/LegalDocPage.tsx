import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";

interface LegalDocPageProps {
  badge: string;
  titleLead: string;
  titleAccent: string;
  subtitle: ReactNode;
  effectiveDate: string;
  lastUpdated: string;
  markdown: string;
  footNote?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Flatten React children coming from a markdown heading into a plain string. */
function childrenToText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (
    children &&
    typeof children === "object" &&
    "props" in (children as { props?: { children?: ReactNode } }) &&
    (children as { props?: { children?: ReactNode } }).props
  ) {
    return childrenToText(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

export function LegalDocPage({
  badge,
  titleLead,
  titleAccent,
  subtitle,
  effectiveDate,
  lastUpdated,
  markdown,
  footNote,
}: LegalDocPageProps) {
  const toc = useMemo(() => {
    const entries: { title: string; id: string }[] = [];
    for (const line of markdown.split("\n")) {
      const match = /^##\s+(.+?)\s*$/.exec(line);
      if (match && !line.startsWith("###")) {
        const title = match[1].replace(/\*\*/g, "");
        entries.push({ title, id: slugify(title) });
      }
    }
    return entries;
  }, [markdown]);

  return (
    <ProductPageLayout>
      <div className="min-h-screen bg-white text-slate-900 selection:bg-rose-100 selection:text-rose-900 font-sans">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-6 pt-14 pb-16 lg:pt-20 lg:pb-20">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[760px] h-[520px] bg-indigo-100/60 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] bg-rose-50/70 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto max-w-4xl relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 border border-indigo-200 bg-indigo-50 px-4 py-2 rounded-full mb-7 text-sm font-medium text-indigo-700 tracking-wide">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                {badge}
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-950 mb-6 leading-[1.1]">
                {titleLead}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-600">
                  {titleAccent}
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
                <span>
                  Effective&nbsp;
                  <span className="text-slate-800">{effectiveDate}</span>
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
                <span>
                  Last updated&nbsp;
                  <span className="text-slate-800">{lastUpdated}</span>
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── BODY ── */}
        <section className="px-6 pb-28">
          <div className="container mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
              {/* Table of contents */}
              <aside className="hidden lg:block">
                <nav
                  aria-label="Sections"
                  className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-3"
                >
                  <p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-[#312E81]">
                    On this page
                  </p>
                  <ul className="space-y-1.5">
                    {toc.map(({ title, id }) => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          className="group flex items-start gap-1.5 rounded-md px-2 py-1.5 text-sm leading-snug text-slate-600 transition-colors hover:bg-indigo-50 hover:text-[#312E81]"
                        >
                          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-rose-500" />
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>

              {/* Article */}
              <article className="min-w-0">
                <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:p-10">
                  <div
                    className="prose prose-slate max-w-none
                      prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:tracking-tight
                      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-slate-950
                      prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100
                      prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-slate-900
                      prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-slate-800
                      prose-p:text-slate-600 prose-p:leading-relaxed
                      prose-li:text-slate-600 prose-li:my-1 prose-li:marker:text-rose-400
                      prose-strong:text-slate-900 prose-strong:font-semibold
                      prose-a:text-[#2563EB] prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                      prose-hr:my-12 prose-hr:border-slate-200"
                  >
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => (
                          <h2 id={slugify(childrenToText(children))}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 id={slugify(childrenToText(children))}>
                            {children}
                          </h3>
                        ),
                      }}
                    >
                      {markdown}
                    </ReactMarkdown>
                  </div>
                </div>

                {footNote && (
                  <p className="mt-6 text-center text-sm text-slate-400">
                    {footNote}
                  </p>
                )}
              </article>
            </div>
          </div>
        </section>
      </div>
    </ProductPageLayout>
  );
}
