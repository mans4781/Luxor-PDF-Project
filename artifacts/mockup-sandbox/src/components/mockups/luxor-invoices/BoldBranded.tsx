import React from "react";
import { Badge } from "@/components/ui/badge";

export function BoldBranded() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex justify-center antialiased">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
        `
      }} />
      
      <div className="w-full max-w-[760px] bg-white shadow-xl overflow-hidden font-inter border border-slate-200">
        
        {/* HEADER BAND */}
        <div className="bg-gradient-to-r from-indigo-900 to-blue-600 text-white p-10 flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-14 h-14 bg-white rounded-xl shadow flex items-center justify-center p-2 flex-shrink-0">
              <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Luxor PDF Suite</h1>
              <p className="text-blue-200 text-sm">luxorpdf.com</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-blue-200 text-sm font-medium tracking-widest uppercase mb-1">INVOICE</div>
            <div className="text-white text-lg font-semibold">LXR-INV-2026-00428</div>
          </div>
        </div>

        {/* BILLING INFO */}
        <div className="p-10 pb-6 grid grid-cols-2 gap-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
            <div className="text-slate-800 leading-relaxed text-sm">
              <p className="font-bold text-base mb-1">Aarav Mehta</p>
              <p>Mehta Design Studio</p>
              <p>14 Linking Road, Bandra West</p>
              <p>Mumbai 400050, India</p>
              <p className="text-blue-600 mt-1">aarav@mehtadesign.in</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-slate-500">Invoice Date</div>
              <div className="text-slate-800 font-medium text-right">01 Jun 2026</div>
              
              <div className="text-slate-500">Due Date</div>
              <div className="text-slate-800 font-medium text-right">01 Jun 2026</div>
              
              <div className="text-slate-500">GSTIN</div>
              <div className="text-slate-800 font-medium text-right">29ABCDE1234F1Z5</div>
            </div>
          </div>
        </div>

        {/* LICENSE KEY HERO PANEL */}
        <div className="px-10 mb-8">
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-indigo-900 font-bold text-base flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Your License Key
                </h3>
                <p className="text-indigo-600/80 text-sm mt-1">Use this key to activate your software.</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-semibold">Pro Plan</Badge>
            </div>
            
            <div className="relative bg-white border border-indigo-100 rounded-lg p-4 pr-14 flex items-center justify-center mb-4 shadow-inner">
              <code className="font-mono text-xl md:text-2xl font-bold text-slate-800 tracking-[0.2em] text-center">
                LXR-PRO-7F3K-9QW2-XM4P-A1B8
              </code>
              <button
                type="button"
                aria-label="Copy license key"
                title="Copy license key"
                onClick={() => navigator.clipboard?.writeText("LXR-PRO-7F3K-9QW2-XM4P-A1B8")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-400 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-between text-sm text-slate-600 font-medium">
              <div><span className="text-slate-400">Seats:</span> 1 device</div>
              <div><span className="text-slate-400">Valid:</span> 01 Jun 2026 — 01 Jun 2027</div>
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div className="px-10 mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-[60%]">Description</th>
                <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Qty</th>
                <th className="py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <div className="font-semibold text-slate-800">Luxor PDF Pro — Annual License (1 Year)</div>
                </td>
                <td className="py-4 text-center text-slate-600">1</td>
                <td className="py-4 text-right text-slate-800 font-medium">₹2,499.00</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <div className="font-semibold text-slate-800">Priority Email Support (12 months)</div>
                </td>
                <td className="py-4 text-center text-slate-600">1</td>
                <td className="py-4 text-right text-slate-500 font-medium italic">Included</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTALS & PAYMENT */}
        <div className="px-10 pb-10 flex justify-between items-end">
          <div className="w-1/2">
            <div className="mb-5 inline-block px-4 py-1 border-2 border-[#DC2626] text-[#DC2626] font-bold text-lg rounded transform rotate-[-5deg] tracking-widest shadow-sm font-serif">
              PAID
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Details</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium text-slate-800">Method:</span> Razorpay (UPI)</p>
              <p><span className="font-medium text-slate-800">Transaction ID:</span> pay_Qk29Lx8sR4mZ</p>
              <p><span className="font-medium text-slate-800">Amount Paid:</span> ₹2,948.82</p>
            </div>
          </div>
          
          <div className="w-1/2 max-w-[280px]">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800 font-medium">₹2,499.00</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-slate-500">GST (18%)</span>
                <span className="text-slate-800 font-medium">₹449.82</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-bold text-indigo-700 text-lg">₹2,948.82</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 p-10 border-t border-slate-200 text-xs text-slate-500 leading-relaxed text-center">
          <p className="mb-2">Thank you for your purchase. Your license key has also been sent to your email.</p>
          <p>Manage your subscription at <a href="#" className="text-blue-600 hover:underline">luxorpdf.com/account</a>. This is a computer-generated invoice.</p>
          <p className="mt-4 text-slate-400">Questions? Contact <a href="mailto:support@luxorpdf.com" className="text-blue-500 hover:underline">support@luxorpdf.com</a></p>
        </div>
        
      </div>
    </div>
  );
}
