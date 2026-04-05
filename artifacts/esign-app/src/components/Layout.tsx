import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, subtitle, actions }: Props) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-[230px] min-h-screen">
        {(title || actions) && (
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 sticky top-0 z-20">
            <div>
              {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
