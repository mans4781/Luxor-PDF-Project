import React from "react";
import { Badge } from "@/components/ui/badge";

export function Minimal() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4 font-sans text-slate-800">
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .font-geist { font-family: 'Geist', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .bg-indigo-900 { background-color: #312E81; }
        .text-indigo-900 { color: #312E81; }
        .text-royal-blue { color: #2563EB; }
        .border-royal-blue { border-color: #2563EB; }
        .bg-royal-blue { background-color: #2563EB; }
        .text-coral { color: #FB7185; }
        .text-luxor-red { color: #DC2626; }
      `}} />
      
      <div className="bg-white w-full max-w-[760px] shadow-sm border border-slate-200 rounded-sm font-geist text-[13px] leading-relaxed relative">
        {/* Top Header */}
        <div className="flex justify-between items-start pt-12 px-12 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-sm">
              <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-indigo-900 tracking-tight">Luxor PDF Suite</h1>
              <p className="text-slate-500 mt-0.5">luxorpdf.com</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium tracking-widest text-slate-400 uppercase mb-1">Invoice</div>
            <div className="text-2xl font-medium text-slate-900">Paid</div>
          </div>
        </div>

        {/* Invoice Details & Addresses */}
        <div className="px-12 pb-10 flex justify-between">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-2">Billed To</div>
              <div className="text-slate-900 font-medium text-sm">Aarav Mehta</div>
              <div className="text-slate-600">Mehta Design Studio</div>
              <div className="text-slate-600">14 Linking Road, Bandra West</div>
              <div className="text-slate-600">Mumbai 400050, India</div>
              <div className="text-royal-blue mt-1">aarav@mehtadesign.in</div>
            </div>
          </div>

          <div className="space-y-6 text-right">
            <div>
              <div className="text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-2">Invoice Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-500">Invoice No</span>
                <span className="text-slate-900 font-medium">LXR-INV-2026-00428</span>
                
                <span className="text-slate-500">Date</span>
                <span className="text-slate-900">01 Jun 2026</span>
                
                <span className="text-slate-500">Due Date</span>
                <span className="text-slate-900">01 Jun 2026</span>
                
                <span className="text-slate-500">Payment</span>
                <span className="text-slate-900">Razorpay (UPI)</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px] mb-1 uppercase tracking-wider">Seller Details</div>
              <div className="text-slate-600">billing@luxorpdf.com</div>
              <div className="text-slate-600">GSTIN: 29ABCDE1234F1Z5</div>
            </div>
          </div>
        </div>

        {/* License Block - Prominent but minimal */}
        <div className="px-12 pb-10">
          <div className="border border-slate-200 rounded-md p-6 bg-slate-50/50">
            <div className="flex justify-between items-center mb-4">
              <div className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">License Key Activation</div>
              <Badge variant="outline" className="bg-white text-indigo-900 border-slate-200 font-normal">Active</Badge>
            </div>
            
            <div className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between shadow-sm mb-4">
              <code className="font-mono text-lg text-indigo-900 font-medium tracking-wider">LXR-PRO-7F3K-9QW2-XM4P-A1B8</code>
              <button className="text-royal-blue text-xs font-medium hover:underline">Copy Key</button>
            </div>
            
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-slate-500 mr-2">Plan:</span>
                <span className="font-medium text-slate-900">Pro</span>
              </div>
              <div>
                <span className="text-slate-500 mr-2">Seats:</span>
                <span className="font-medium text-slate-900">1 device</span>
              </div>
              <div>
                <span className="text-slate-500 mr-2">Valid:</span>
                <span className="font-medium text-slate-900">01 Jun 2026 to 01 Jun 2027</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-12 pb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-medium w-3/5">Description</th>
                <th className="pb-3 font-medium text-center w-1/5">Qty</th>
                <th className="pb-3 font-medium text-right w-1/5">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900 font-medium">Luxor PDF Pro — Annual License (1 Year)</td>
                <td className="py-4 text-center text-slate-600">1</td>
                <td className="py-4 text-right text-slate-900">₹2,499.00</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-slate-900">Priority Email Support (12 months)</td>
                <td className="py-4 text-center text-slate-600">1</td>
                <td className="py-4 text-right text-slate-500 italic">Included</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-12 pb-12 flex justify-end">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-slate-600">
              <span>Subtotal</span>
              <span>₹2,499.00</span>
            </div>
            <div className="flex justify-between py-2 text-slate-600 border-b border-slate-200">
              <span>GST (18%)</span>
              <span>₹449.82</span>
            </div>
            <div className="flex justify-between py-4 text-base font-medium text-slate-900">
              <span>Total Paid</span>
              <span>₹2,948.82</span>
            </div>
            <div className="text-right text-xs text-slate-500 mt-1">
              Txn ID: pay_Qk29Lx8sR4mZ
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-12 py-8 rounded-b-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-slate-500 max-w-md">
              <p className="mb-1">Thank you for your purchase. Your license key has also been sent to your email.</p>
              <p>This is a computer-generated invoice.</p>
            </div>
            <div className="text-right flex flex-col gap-1">
              <a href="https://luxorpdf.com/account" className="text-royal-blue hover:underline font-medium">Manage Subscription</a>
              <a href="mailto:support@luxorpdf.com" className="text-slate-500 hover:text-slate-800">support@luxorpdf.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
