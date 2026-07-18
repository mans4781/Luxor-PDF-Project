import { Minus, Square, X, Edit3, MessageSquare, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductivityMockup() {
  return (
    <div className="w-full max-w-[640px] bg-white rounded-xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(229,9,20,0.15)] border border-[#E50914]/10 select-none text-left relative">
      {/* Abstract red background for the whole section */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF3F3] to-white -z-10" />

      {/* Title Bar */}
      <div className="h-9 bg-[#E50914] text-white flex items-center justify-between px-3">
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

      {/* Toolbar (Simplified Annotation Mode) */}
      <div className="h-11 bg-white border-b border-slate-200 flex items-center justify-center gap-4 px-3 shadow-sm z-10 relative">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <div className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-semibold text-[#E50914] flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Highlight
          </div>
          <div className="px-3 py-1 text-xs font-medium text-slate-600 flex items-center gap-1.5 hover:bg-slate-200 rounded-md cursor-default">
            <MessageSquare className="w-3.5 h-3.5" /> Note
          </div>
        </div>
      </div>

      <div className="flex h-[360px] bg-slate-100/50 p-6 items-start justify-center relative overflow-hidden">
        
        {/* Main Document */}
        <div className="bg-white w-full max-w-[380px] h-full shadow-lg relative p-6 border border-slate-200 flex flex-col">
          <h2 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">The Future of Productivity</h2>
          
          {/* Architectural Image Placeholder */}
          <div className="w-full h-32 bg-slate-100 rounded-lg mb-4 overflow-hidden relative border border-slate-200">
             <img src={`${import.meta.env.BASE_URL}brand/reader-business-image.png`} alt="Architecture" className="w-full h-full object-cover" />
             {/* Highlight overlay */}
             <div className="absolute bottom-4 left-4 right-4 h-4 bg-[#FFEB3B]/40 mix-blend-multiply rounded" />
          </div>

          <p className="text-xs text-slate-800 font-medium leading-relaxed mb-2">
            Work smarter with tools that help you read, review, and act faster.
          </p>
          
          <div className="space-y-1.5 mt-2">
            <div className="w-full h-2 bg-slate-100 rounded-full" />
            <div className="w-5/6 h-2 bg-slate-100 rounded-full" />
            <div className="w-4/6 h-2 bg-slate-100 rounded-full" />
          </div>

          {/* Sticky Note Pop-up inside document */}
          <div className="absolute top-1/2 left-3/4 -translate-x-4 bg-[#FFF9C4] w-40 p-3 rounded-br-xl shadow-md border border-[#FBC02D]/30 -rotate-2">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] text-white font-bold">U</div>
              <span className="text-[9px] font-bold text-slate-800">You</span>
              <span className="text-[8px] text-slate-500 ml-auto">Just now</span>
            </div>
            <p className="text-[10px] text-slate-800 leading-tight">Great point! Let's discuss this.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
