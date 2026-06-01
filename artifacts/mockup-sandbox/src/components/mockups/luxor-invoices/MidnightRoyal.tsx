import React from "react";
import { CheckCircle2, Download, ShieldCheck, Mail, Globe, MapPin } from "lucide-react";

export function MidnightRoyal() {
  return (
    <div className="midnight-royal-wrapper min-h-screen bg-[#0B0F19] p-8 md:p-16 flex justify-center font-sans antialiased text-slate-800">
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        .midnight-royal-wrapper {
          font-family: 'Space Grotesk', sans-serif;
          background-image: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0B0F19 60%);
        }
        .mr-mono {
          font-family: 'Space Mono', monospace;
        }
        .ticket-cutout-left {
          position: absolute;
          left: -12px;
          top: -12px;
          width: 24px;
          height: 24px;
          background-color: #0B0F19;
          border-radius: 50%;
        }
        .ticket-cutout-right {
          position: absolute;
          right: -12px;
          top: -12px;
          width: 24px;
          height: 24px;
          background-color: #0B0F19;
          border-radius: 50%;
        }
        .ticket-dash {
          border-top: 2px dashed #CBD5E1;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
      `}} />

      <div className="w-full max-w-[850px] shadow-2xl flex flex-col">
        {/* Ticket Header (Receipt) */}
        <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2563EB] to-[#312E81] text-white p-12 rounded-t-3xl relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">LUXOR PDF SUITE</h1>
                <p className="text-blue-200 text-sm font-medium tracking-widest mt-1 uppercase">Tax Invoice / Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-bold uppercase tracking-wider mb-4">
                <CheckCircle2 size={16} /> Paid
              </div>
              <div className="mr-mono text-sm text-blue-200">INV: LXR-INV-2026-00428</div>
              <div className="mr-mono text-sm text-blue-200 mt-1">Date: 01 Jun 2026</div>
            </div>
          </div>
        </div>

        {/* Ticket Body (Receipt) */}
        <div className="bg-white p-12 relative z-10">
          <div className="grid grid-cols-2 gap-12 mb-12">
            {/* Bill To */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Billed To</h3>
              <p className="font-bold text-lg text-slate-900">Aarav Mehta</p>
              <p className="text-slate-600">Mehta Design Studio</p>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                14 Linking Road, Bandra West<br/>
                Mumbai 400050, India
              </p>
              <p className="text-slate-500 text-sm mt-2">aarav@mehtadesign.in</p>
            </div>

            {/* Seller */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">From</h3>
              <p className="font-bold text-lg text-slate-900">Luxor PDF Suite</p>
              <p className="text-slate-500 text-sm mt-2">luxorpdf.com</p>
              <p className="text-slate-500 text-sm">billing@luxorpdf.com</p>
              <p className="text-slate-500 text-sm mt-2 font-medium">GSTIN: <span className="mr-mono">29ABCDE1234F1Z5</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-4 text-sm font-bold uppercase tracking-widest text-slate-900">Description</th>
                  <th className="py-4 text-sm font-bold uppercase tracking-widest text-slate-900 text-center">Qty</th>
                  <th className="py-4 text-sm font-bold uppercase tracking-widest text-slate-900 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-200">
                <tr>
                  <td className="py-6">
                    <p className="font-bold text-slate-900 text-lg">Luxor PDF Pro</p>
                    <p className="text-sm text-slate-500 mt-1">Annual License (1 Year)</p>
                  </td>
                  <td className="py-6 text-center text-slate-600 font-medium">1</td>
                  <td className="py-6 text-right mr-mono font-medium text-lg">₹2,499.00</td>
                </tr>
                <tr>
                  <td className="py-6">
                    <p className="font-bold text-slate-900 text-lg">Priority Email Support</p>
                    <p className="text-sm text-slate-500 mt-1">12 months</p>
                  </td>
                  <td className="py-6 text-center text-slate-600 font-medium">1</td>
                  <td className="py-6 text-right text-emerald-600 font-bold uppercase text-sm tracking-wide">Included</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-1/2">
              <div className="flex justify-between py-2 text-slate-600">
                <span>Subtotal</span>
                <span className="mr-mono font-medium">₹2,499.00</span>
              </div>
              <div className="flex justify-between py-2 text-slate-600">
                <span>GST (18%)</span>
                <span className="mr-mono font-medium">₹449.82</span>
              </div>
              <div className="flex justify-between py-4 mt-2 border-t-2 border-slate-900 text-xl font-bold text-slate-900">
                <span>Total Paid</span>
                <span className="mr-mono text-2xl">₹2,948.82</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-slate-500">
                <span>Payment Method</span>
                <span className="font-medium text-slate-700">Razorpay (UPI)</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-slate-500">
                <span>Transaction ID</span>
                <span className="mr-mono text-slate-700">pay_Qk29Lx8sR4mZ</span>
              </div>
            </div>
          </div>
        </div>

        {/* License Stub (Perforated Section) */}
        <div className="bg-[#F8FAFC] p-12 rounded-b-3xl relative">
          <div className="ticket-dash"></div>
          <div className="ticket-cutout-left"></div>
          <div className="ticket-cutout-right"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-[#2563EB]" size={24} />
            <h2 className="text-xl font-bold text-[#1E1B4B] tracking-tight uppercase">Your Pro License Key</h2>
          </div>

          <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-3">Activation Code</p>
            <div className="mr-mono text-3xl md:text-4xl font-bold text-[#1E1B4B] tracking-widest bg-blue-50 py-4 px-6 rounded-xl inline-block border border-blue-100">
              LXR-PRO-7F3K-9QW2-XM4P-A1B8
            </div>
            <div className="flex justify-center gap-8 mt-6 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Plan</span>
                <span className="font-bold text-slate-800 mt-1">Pro</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Seats</span>
                <span className="font-bold text-slate-800 mt-1">1 Device</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Valid</span>
                <span className="font-bold text-slate-800 mt-1 mr-mono text-xs">01 Jun '26 &rarr; 01 Jun '27</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-400 text-xs leading-relaxed max-w-2xl mx-auto">
            <p className="mb-2">Thank you for your purchase. Your license key has also been sent to your email.</p>
            <p>Manage your subscription at <a href="#" className="text-blue-500 hover:underline">luxorpdf.com/account</a>. This is a computer-generated invoice.</p>
            <p className="mt-4 font-medium">support@luxorpdf.com</p>
          </div>
        </div>

      </div>
    </div>
  );
}
