import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TitleBar } from '../components/TitleBar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 flex items-center justify-center">
      {/* Desktop App Window Shell */}
      <div className="w-full max-w-[1440px] min-w-[1024px] h-[90vh] min-h-[700px] bg-[#F3F7FF] rounded-[24px] shadow-[0_25px_50px_-12px_rgba(7,91,232,0.25)] flex flex-col overflow-hidden border border-[#DCE7FA] relative">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-[#F3F7FF] p-8 custom-scrollbar relative">
            <div className="max-w-[1000px] mx-auto flex flex-col min-h-full">
              <div className="flex-1">
                {children}
              </div>
              <footer className="pt-8 pb-2 text-center text-xs text-[#071747]/50">
                Copyright &copy; 2026 Luxor PDF Secure. Part of the Luxor PDF Suite.
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}