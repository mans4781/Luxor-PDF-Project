import { Minus, Square, X, Search, ZoomIn, ZoomOut, RotateCw, Bookmark, FileText, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReaderMockup() {
  return (
    <div className="w-full max-w-[640px] bg-slate-50 rounded-xl overflow-hidden shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 select-none text-left">
      {/* Title Bar */}
      <div className="h-9 bg-[#B8000B] text-white flex items-center justify-between px-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-4 h-4 brightness-0 invert" />
          Luxor PDF Reader
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <Minus className="w-3.5 h-3.5" />
          <Square className="w-3.5 h-3.5" />
          <X className="w-4 h-4" />
        </div>
      </div>

      {/* Menu Bar */}
      <div className="h-7 bg-white border-b border-slate-200 flex items-center px-2 text-xs text-slate-700">
        {["File", "Home", "View", "Annotate", "Tools", "Help"].map((item) => (
          <div key={item} className="px-2.5 py-1 hover:bg-slate-100 cursor-default rounded-sm">{item}</div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><FileText className="w-4 h-4" /></div>
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><Download className="w-4 h-4" /></div>
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><Printer className="w-4 h-4" /></div>
          <div className="w-px h-5 bg-slate-300 mx-2" />
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><ZoomOut className="w-4 h-4" /></div>
          <div className="text-xs font-medium text-slate-600 w-12 text-center">100%</div>
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><ZoomIn className="w-4 h-4" /></div>
          <div className="w-px h-5 bg-slate-300 mx-2" />
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><RotateCw className="w-4 h-4" /></div>
          <div className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><Bookmark className="w-4 h-4" /></div>
        </div>
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md bg-white w-40 outline-none" disabled />
        </div>
      </div>

      <div className="flex h-[320px]">
        {/* Thumbnails */}
        <div className="w-20 bg-slate-100 border-r border-slate-200 flex flex-col items-center gap-3 py-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("w-14 h-[20px] bg-white border shadow-sm p-1", i === 1 ? "border-[#E50914]" : "border-slate-200")}>
              <div className="w-full h-1 bg-slate-200 mb-1" />
              <div className="w-3/4 h-0.5 bg-slate-200 mb-1" />
              <div className="w-5/6 h-0.5 bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Main PDF View */}
        <div className="flex-1 bg-slate-200 relative overflow-hidden flex items-center justify-center p-4">
          {/* Subtle red dotted wave background in the viewer */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#E50914 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          
          <div className="bg-white w-full max-w-[340px] h-full shadow-md relative p-8">
            {/* PDF Content */}
            <div className="absolute top-8 right-8">
              <img src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`} alt="" className="w-10 h-10 opacity-10" />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 mb-3 font-serif">About Luxor PDF Reader</h1>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-4 pr-6">
              Luxor PDF Reader is designed to deliver a fast, secure, and delightful PDF reading experience.
            </p>
            
            <ul className="space-y-2.5">
              {[
                "Lightning-fast performance",
                "Lightweight and easy to use",
                "Advanced viewing and search",
                "Secure and private by design"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-slate-700">
                  <div className="w-1 h-1 bg-[#E50914] rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="h-6 bg-slate-100 border-t border-slate-200 flex items-center px-3 text-[10px] text-slate-500 justify-between">
        <span>Page 1 of 3</span>
        <span>Standard Page Size</span>
      </div>
    </div>
  );
}
