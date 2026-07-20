import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  return (
    <div className="h-10 bg-[#F3F7FF] flex items-center justify-between px-4 border-b border-[#DCE7FA] select-none rounded-t-[20px] shrink-0 z-30" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="text-xs font-medium text-[#071747]/60 flex items-center gap-2">
        <span>LUXOR PDF Secure</span>
      </div>
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 text-[#071747]/60 transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 text-[#071747]/60 transition-colors">
          <Square className="w-3.5 h-3.5" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-500 hover:text-white text-[#071747]/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}