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
  KeyRound,
  Crown,
  CalendarDays,
  CheckCircle2,
  Check,
  ArrowUpCircle,
  ChevronRight,
  Plus
} from "lucide-react";

const GiftBoxSVG = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" fill="#FDA4AF" opacity="0.3"/>
    <path d="M12 22V12M12 12L20.5 7M12 12L3.5 7" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CubeSVG = () => (
  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="#FDA4AF" opacity="0.4"/>
    <path d="M12 22V12M12 12L21 7M12 12L3 7" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-['Inter'] text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[265px] h-full bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ef233c] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg leading-none">L</span>
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
            <div className="absolute -right-6 -bottom-6 opacity-80 pointer-events-none">
              <GiftBoxSVG />
            </div>
            
            <h4 className="font-semibold text-slate-900 text-sm mb-1 relative z-10">Unlock more with Luxor PDF Suite – Pro</h4>
            <p className="text-xs text-slate-600 mb-4 relative z-10">Advanced tools. Maximum productivity.</p>
            <button className="w-full bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium py-2 rounded-lg transition-colors relative z-10 shadow-sm">
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
                className="w-[280px] pl-9 pr-16 py-2 bg-white border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef233c]/20 focus:border-[#ef233c]/50 transition-all shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">Ctrl + K</kbd>
              </div>
            </div>

            <button className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-1.5 w-3.5 h-3.5 bg-[#ef233c] text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white">3</span>
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
                AJ
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full ring-2 ring-white"></span>
            </div>
          </div>
        </header>

        <div className="p-8 pt-2 space-y-6">
          {/* SUBSCRIPTION BANNER */}
          <div className="w-full bg-white rounded-[20px] border border-[#e5e7eb] p-6 flex items-start justify-between shadow-sm relative overflow-hidden">
            <div className="absolute right-32 top-1/2 -translate-y-1/2 pointer-events-none z-0">
              <CubeSVG />
            </div>
            
            <div className="flex gap-6 relative z-10">
              <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#ef233c] to-[#b91c1c] flex items-center justify-center shrink-0 shadow-md">
                <Crown className="w-8 h-8 text-white fill-white/20" />
              </div>
              
              <div>
                <div className="text-[11px] font-bold text-[#ef233c] uppercase tracking-wider mb-1">Your Subscription</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Luxor PDF Suite – Pro</h2>
                
                <div className="h-px w-full bg-slate-100 mb-4"></div>
                
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Billing Plan</div>
                    <div className="text-sm font-semibold text-slate-900">Annual Plan</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Renewal Date</div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Jun 22, 2025</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    <div className="text-sm font-semibold text-[#22c55e] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> Active</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Included Products</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-[#fff1f2] flex items-center justify-center border border-[#ef233c]/20" title="PDF Reader">
                        <FileText className="w-3.5 h-3.5 text-[#ef233c]" />
                      </div>
                      <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center border border-[#2563eb]/20" title="PDF Secure">
                        <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                      </div>
                      <div className="w-6 h-6 rounded bg-green-50 flex items-center justify-center border border-[#16a34a]/20" title="eSign">
                        <Check className="w-3.5 h-3.5 text-[#16a34a]" strokeWidth={3} />
                      </div>
                      <div className="text-xs font-medium text-slate-500 ml-1">+ More</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 relative z-10 shrink-0 w-48">
              <button className="w-full px-4 py-2.5 bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
              </button>
              <button className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" /> Manage Billing
              </button>
            </div>
          </div>

          {/* PRODUCT ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Reader Card */}
            <div className="bg-[#fff1f2] rounded-[20px] border border-[#ef233c]/20 p-6 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-[#ef233c] flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#ef233c] mb-2">Luxor PDF Reader</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed">View, annotate and organize PDFs with ease.</p>
              
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-semibold text-slate-700">Full Access</span>
              </div>
              
              <button className="w-full py-2.5 bg-white border border-[#ef233c]/30 hover:border-[#ef233c] text-[#ef233c] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                Open App <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Secure Card */}
            <div className="bg-[#eff6ff] rounded-[20px] border border-[#2563eb]/20 p-6 flex flex-col relative overflow-hidden group">
              <div className="absolute right-2 top-10 opacity-5 pointer-events-none">
                <Lock className="w-32 h-32 text-[#2563eb]" />
              </div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="w-12 h-12 rounded-[14px] bg-[#2563eb] flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#2563eb] mb-2 relative z-10">Luxor PDF Secure</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed relative z-10">Protect your PDFs and sensitive documents.</p>
              
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-semibold text-slate-700">Full Access</span>
              </div>
              
              <button className="w-full py-2.5 bg-white border border-[#2563eb]/30 hover:border-[#2563eb] text-[#2563eb] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10">
                Open App <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* eSign Card */}
            <div className="bg-[#f0fdf4] rounded-[20px] border border-[#16a34a]/20 p-6 flex flex-col relative overflow-hidden group">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-[#16a34a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Coming Soon</span>
              </div>

              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="w-12 h-12 rounded-[14px] bg-[#16a34a] flex items-center justify-center shadow-md">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-bold text-[#16a34a] mb-2 relative z-10">Luxor PDF eSign</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed relative z-10">eSign documents anywhere, anytime.</p>
              
              <div className="mb-5 relative z-10">
                <span className="inline-flex items-center justify-center bg-[#16a34a]/10 text-[#16a34a] text-xs font-semibold px-2.5 py-1 rounded-md">
                  Early Access
                </span>
              </div>
              
              <button className="w-full py-2.5 bg-white border border-[#16a34a]/30 hover:border-[#16a34a] text-[#16a34a] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10">
                Join Waitlist <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <div className="flex flex-col items-center text-center mb-6 mt-2">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xl border border-slate-200 shadow-sm mb-3">
                  AJ
                </div>
                <div className="font-bold text-slate-900 text-base">Alex Johnson</div>
                <div className="text-sm text-slate-500 mb-1">alex.johnson@email.com</div>
                <div className="text-xs font-medium text-slate-400">Member since May 12, 2024</div>
              </div>
              
              <div className="mt-auto flex justify-between px-2">
                <div className="flex flex-col items-center gap-1.5">
                  <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                    <Camera className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Upload Photo</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                    <Smile className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Choose Avatar</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                    <Lock className="w-4 h-4" />
                  </button>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Change Password</span>
                </div>
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
                    <div className="text-sm font-medium text-slate-900">Opened PDF <span className="font-bold text-slate-900">"Project_Proposal.pdf"</span></div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Today 10:24 AM</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Secured File <span className="font-bold text-slate-900">"Financial_Report_2024.pdf"</span></div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Today 9:15 AM</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Updated Password</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> May 20, 2025</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCcw className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">Subscription Renewed</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Luxor PDF Suite – Pro (Annual) / May 18, 2025</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#ef233c]/30 hover:bg-[#fff1f2]/50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ef233c]/10 flex items-center justify-center">
                      <FileBox className="w-3.5 h-3.5 text-[#ef233c]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Open PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ef233c] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#2563eb]/30 hover:bg-blue-50/50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#2563eb]/10 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Secure PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563eb] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#8b5cf6]/30 hover:bg-purple-50/50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                      <Split className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Merge PDFs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#8b5cf6] transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#f97316]/30 hover:bg-orange-50/50 transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                      <FileStack className="w-3.5 h-3.5 text-[#f97316]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Convert PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#f97316] transition-colors" />
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 transition-colors group mt-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Manage Subscription</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600 transition-colors" />
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Active Sessions</h3>
                <a href="#" className="text-sm font-medium text-[#ef233c] hover:underline">View All</a>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 shadow-sm mt-1">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-sm font-bold text-slate-900 truncate pr-2">Windows • Chrome</div>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">This Device</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-0.5">New York, USA • <span className="text-[#22c55e] font-medium">Active now</span></div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 shadow-sm mt-1">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 mb-0.5">iPhone 14 • iOS</div>
                    <div className="text-xs text-slate-500 mb-0.5">New York, USA</div>
                    <div className="text-xs text-slate-400">May 20, 2025, 8:30 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="w-full py-2.5 border border-[#ef233c] text-[#ef233c] hover:bg-[#fff1f2] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
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
