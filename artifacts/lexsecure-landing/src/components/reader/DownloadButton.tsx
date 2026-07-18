import React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface DownloadButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "white";
}

export function DownloadButton({ className, variant = "primary", ...props }: DownloadButtonProps) {
  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Placeholder for download tracking
    console.log("Track download clicked");
    if (props.onClick) props.onClick(e);
  };

  const isWhite = variant === "white";

  return (
    <a
      href="/api/downloads/luxor-pdf-reader-latest"
      onClick={handleDownloadClick}
      className={cn(
        "inline-flex items-center gap-3 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 group text-left",
        isWhite
          ? "bg-white text-[#E50914] hover:bg-slate-50 shadow-lg shadow-black/5 hover:-translate-y-[1px]"
          : "bg-[#E50914] hover:bg-[#FF1A1A] text-white shadow-lg shadow-[#E50914]/25 hover:-translate-y-[1px]",
        className
      )}
      {...props}
      data-testid="download-reader-button"
    >
      <div className={cn(
        "flex items-center justify-center shrink-0 w-8 h-8 rounded-lg",
        isWhite ? "bg-[#E50914]/10" : "bg-white/20"
      )}>
        <svg
          className={cn("w-4 h-4", isWhite ? "text-[#E50914]" : "text-white")}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] mb-0.5">Download for Windows</span>
        <span className={cn("text-[11px]", isWhite ? "text-[#E50914]/70" : "text-white/80")}>
          Windows 10/11 (64-bit)
        </span>
      </div>
    </a>
  );
}
