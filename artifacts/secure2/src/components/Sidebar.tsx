import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Lock, 
  FilePenLine,
  KeyRound, 
  Eraser, 
  ShieldCheck, 
  FileStack, 
  Layers, 
  Share2, 
  HardDrive, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import shieldLogo from '../assets/luxor-secure-shield.png';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Encrypt', path: '/encrypt', icon: Lock },
  { name: 'Edit', path: '/edit', icon: FilePenLine },
  { name: 'Password', path: '/password', icon: KeyRound },
  { name: 'Redact', path: '/redact', icon: Eraser },
  { name: 'Permissions', path: '/permissions', icon: ShieldCheck },
  { name: 'Merge & Split', path: '/merge-split', icon: FileStack },
  { name: 'Batch Process', path: '/batch', icon: Layers },
  { name: 'Secure Share', path: '/share', icon: Share2 },
  { name: 'Storage', path: '/storage', icon: HardDrive },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <div 
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-[#075BE8] to-[#071747] text-white border-r border-[#071747]/20 relative z-20",
        sidebarCollapsed ? "w-20" : "w-[270px]"
      )}
    >
      <div className="h-16 flex items-center px-6 pt-4 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <img
            src={shieldLogo}
            alt="Luxor PDF Secure"
            className="w-14 h-14 object-contain shrink-0"
          />
          {!sidebarCollapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="font-bold tracking-wide text-lg leading-tight">LUXOR</span>
              <span className="text-[10px] text-white/70 font-medium tracking-wider uppercase">PDF SECURE</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group",
                  isActive 
                    ? "bg-[#0878FF] shadow-[0_0_15px_rgba(8,120,255,0.5)]" 
                    : "hover:bg-white/10"
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-white/80 group-hover:text-white")} />
                {!sidebarCollapsed && (
                  <span className={cn("text-sm font-medium whitespace-nowrap", isActive ? "text-white" : "text-white/80 group-hover:text-white")}>
                    {item.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 shrink-0 border-t border-white/10">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}