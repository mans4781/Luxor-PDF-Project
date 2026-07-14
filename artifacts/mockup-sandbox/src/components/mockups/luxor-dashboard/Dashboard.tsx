import React from "react";
import {
  Search,
  Bell,
  CircleHelp,
  ChevronDown,
  Box,
  CreditCard,
  UserRound,
  ShieldCheck,
  MonitorSmartphone,
  LogOut,
  FileText,
  Shield,
  PenTool,
  ExternalLink,
  Camera,
  Smile,
  Lock,
  Layers,
  ArrowRight,
  RefreshCcw,
  Clock,
  Laptop,
  Smartphone,
  MoreVertical,
  Activity,
  FileBox,
  Split,
  FileStack,
  KeyRound
} from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-['Inter'] text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[265px] h-full bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ef233c] flex items-center justify-center shrink-0 shadow-sm">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Luxor PDF</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#fff1f2] text-[#ef233c] font-medium transition-colors">
            <Box className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <Layers className="w-5 h-5" />
            My Products
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <UserRound className="w-5 h-5" />
            Profile
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <ShieldCheck className="w-5 h-5" />
            Security
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <MonitorSmartphone className="w-5 h-5" />
            Devices & Sessions
          </a>
          <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              Notifications
            </div>
            <span className="bg-[#ef233c] text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <CircleHelp className="w-5 h-5" />
            Help & Support
          </a>
          
          <div className="my-4 border-t border-slate-100"></div>
          
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            Sign Out
          </a>
        </nav>

        <div className="p-4">
          <div className="bg-[#fff1f2] rounded-2xl p-5 border border-[#ef233c]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ef233c]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ef233c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            
            <h4 className="font-semibold text-slate-900 text-sm mb-1 relative z-10">Unlock more with Luxor PDF Suite – Pro</h4>
            <p className="text-xs text-slate-600 mb-4 relative z-10">Advanced tools. Maximum productivity.</p>
            <button className="w-full bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium py-2 rounded-lg transition-colors relative z-10">
              Upgrade Plan
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER */}
        <header className="h-[88px] px-8 flex items-center justify-between shrink-0 bg-[#f8fafc]/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Welcome back, Alex 👋</h1>
            <p className="text-sm text-slate-500">Here's what's happening with your account today.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search tools, files, help..." 
                className="w-64 pl-9 pr-14 py-2 bg-white border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef233c]/20 focus:border-[#ef233c]/50 transition-all shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">Ctrl + K</kbd>
              </div>
            </div>

            <button className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ef233c] rounded-full ring-2 ring-white"></span>
            </button>
            
            <button className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <CircleHelp className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-full hover:bg-slate-50 transition-colors shadow-sm">
              <span className="text-sm font-medium text-slate-700">Luxor PDF Suite</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
                AM
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full ring-2 ring-white"></span>
            </div>
          </div>
        </header>

        <div className="p-8 pt-2 space-y-6">
          {/* SUBSCRIPTION BANNER */}
          <div className="w-full bg-gradient-to-r from-white to-[#fff1f2]/60 rounded-[20px] border border-[#ef233c]/20 p-6 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
              <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#ef233c" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M12 12l7 7"/><path d="M12 12L5 5"/><path d="M12 12l7-7"/><path d="M12 12l-7 7"/></svg>
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#ef233c]/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-7 h-7 text-[#ef233c]" />
              </div>
              
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Subscription</div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-slate-900">Luxor PDF Suite – Pro</h2>
                  <span className="bg-[#22c55e]/10 text-[#22c55e] text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                    Active
                  </span>
                </div>
                
                <div className="flex items-center gap-6 mt-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Billing Plan</div>
                    <div className="text-sm font-medium text-slate-900">Annual Plan</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">Renewal Date</div>
                    <div className="text-sm font-medium text-slate-900">Jun 22, 2027</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Included Products</div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                        <FileText className="w-3 h-3 text-[#ef233c]" /> Reader
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                        <Shield className="w-3 h-3 text-[#2563eb]" /> Secure
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm opacity-70">
                        <PenTool className="w-3 h-3 text-[#16a34a]" /> eSign
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <button className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors shadow-sm">
                Manage Billing
              </button>
              <button className="px-5 py-2.5 bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* PRODUCT ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Reader Card */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-[#ef233c] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span> Full Access
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Luxor PDF Reader</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">View, annotate and organize PDFs with ease.</p>
              <button className="w-full py-2.5 bg-[#fff1f2] border border-[#ef233c]/20 hover:border-[#ef233c]/40 text-[#ef233c] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:bg-[#ef233c] group-hover:text-white">
                Open App <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Secure Card */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-x-1/4 translate-y-1/4 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-40 h-40" />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-[14px] bg-[#2563eb] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span> Full Access
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 relative z-10">Luxor PDF Secure</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed relative z-10">Protect your PDFs and sensitive documents.</p>
              <button className="w-full py-2.5 bg-white border border-[#2563eb]/30 hover:bg-[#2563eb]/5 text-[#2563eb] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 relative z-10">
                Open App <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* eSign Card */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] pointer-events-none z-10"></div>
              
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
                <span className="bg-[#16a34a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Coming Soon</span>
                <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">In Development</span>
              </div>

              <div className="flex justify-between items-start mb-4 relative z-0">
                <div className="w-12 h-12 rounded-[14px] bg-[#16a34a]/80 flex items-center justify-center shadow-inner grayscale-[0.2]">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 relative z-0">Luxor PDF eSign</h3>
              <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed relative z-0">Send, sign and manage documents digitally from anywhere.</p>
              
              <button className="w-full py-2.5 bg-[#f0fdf4] border border-[#16a34a]/20 text-[#16a34a] text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 relative z-20 hover:bg-[#dcfce7]">
                Notify Me <Bell className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-1">Your Profile</h3>
              <p className="text-xs text-slate-500 mb-5">View and manage your account details.</p>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200 shadow-sm shrink-0">
                  AM
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">Alex Morgan</div>
                  <div className="text-xs text-slate-500 truncate">alex.morgan@example.com</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Member since Mar 2025</div>
                </div>
              </div>
              
              <div className="mt-auto flex justify-between">
                <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" title="Upload Photo">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" title="Choose Avatar">
                  <Smile className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" title="Change Password">
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Activity */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                <a href="#" className="text-sm font-medium text-[#ef233c] hover:underline">View All</a>
              </div>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#fff1f2] flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-[#ef233c]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Opened PDF <span className="font-semibold">"Project_Proposal.pdf"</span></div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Today 10:24 AM</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Secured File <span className="font-semibold">"Financial_Report_2026.pdf"</span></div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Today 9:15 AM</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Updated Password</div>
                    <div className="text-xs text-slate-500 mt-0.5">Password was changed successfully</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCcw className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Subscription Renewed</div>
                    <div className="text-xs text-slate-500 mt-0.5">Luxor PDF Suite – Pro (Annual)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-6">Quick Actions</h3>
              
              <div className="space-y-3 flex-1">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#ef233c]/30 hover:bg-[#fff1f2]/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ef233c]/10 flex items-center justify-center">
                      <FileBox className="w-4 h-4 text-[#ef233c]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Open PDF</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#ef233c] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#2563eb]/30 hover:bg-blue-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2563eb]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#2563eb]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Secure PDF</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563eb] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#8b5cf6]/30 hover:bg-purple-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                      <Split className="w-4 h-4 text-[#8b5cf6]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Merge PDFs</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8b5cf6] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#f97316]/30 hover:bg-orange-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                      <FileStack className="w-4 h-4 text-[#f97316]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Convert PDF</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#f97316] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-pink-300 hover:bg-pink-50/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-pink-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Manage Subscription</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                 <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                      <PenTool className="w-4 h-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">eSign Documents <span className="text-[10px] ml-1 uppercase tracking-wider text-slate-400 font-bold">— Coming Soon</span></span>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Active Sessions</h3>
                <a href="#" className="text-sm font-medium text-[#ef233c] hover:underline">View All</a>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-[#22c55e]/20 bg-[#f0fdf4]/50 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                    <span className="text-xs font-medium text-[#22c55e]">Active now</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border border-[#22c55e]/20 flex items-center justify-center shrink-0 text-[#22c55e] shadow-sm">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="pr-16">
                    <div className="text-sm font-bold text-slate-900">Windows • Chrome</div>
                    <div className="text-xs text-slate-500 mt-1">This Device</div>
                    <div className="text-xs text-slate-400 mt-1">Kolkata, India</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-semibold text-slate-900">Android • Luxor Mobile</div>
                      <span className="text-xs text-slate-500">2 hrs ago</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Kolkata, India</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <button className="text-sm font-medium text-[#ef233c] hover:text-[#dc1f36] transition-colors flex items-center justify-center w-full gap-2 py-2">
                  <LogOut className="w-4 h-4" /> Sign out all devices
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
