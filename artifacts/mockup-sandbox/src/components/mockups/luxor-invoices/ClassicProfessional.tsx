import React from "react";

export function ClassicProfessional() {
  return (
    <div className="min-h-screen bg-slate-100 p-8 flex justify-center font-sans antialiased text-slate-800">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{__html: `
        .font-serif-classic { font-family: 'Merriweather', serif; }
        .font-sans-classic { font-family: 'Inter', sans-serif; }
        .font-mono-classic { font-family: 'JetBrains Mono', monospace; }
        .indigo-border { border-color: #312E81; }
        .indigo-bg { background-color: #312E81; }
        .indigo-text { color: #312E81; }
      `}} />

      {/* A4 Paper Card */}
      <div className="w-full max-w-[760px] bg-white shadow-lg border border-slate-200 p-12 font-sans-classic relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 indigo-border pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1 shadow-sm">
              <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF Shield" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="font-serif-classic text-2xl font-bold indigo-text tracking-tight uppercase">Luxor PDF Suite</h1>
              <p className="text-xs text-slate-500 mt-1">luxorpdf.com &bull; billing@luxorpdf.com</p>
              <p className="text-xs text-slate-500">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-serif-classic text-3xl font-black indigo-text uppercase tracking-widest">Tax Invoice</h2>
            <div className="mt-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Invoice No:</span> LXR-INV-2026-00428</p>
              <p><span className="font-semibold text-slate-800">Date:</span> 01 Jun 2026</p>
              <p><span className="font-semibold text-slate-800">Due Date:</span> 01 Jun 2026</p>
            </div>
            <div className="mt-3 inline-block px-4 py-1 border-2 border-[#DC2626] text-[#DC2626] font-bold text-lg rounded transform rotate-[-5deg] font-serif-classic tracking-widest shadow-sm">
              PAID
            </div>
          </div>
        </div>

        {/* Bill To / From */}
        <div className="flex justify-between mb-8 text-sm">
          <div className="w-1/2 pr-4">
            <h3 className="font-serif-classic font-bold text-slate-800 border-b indigo-border pb-1 mb-2 uppercase text-xs tracking-wider">Billed To</h3>
            <p className="font-semibold text-base text-slate-900">Aarav Mehta</p>
            <p className="text-slate-600">Mehta Design Studio</p>
            <p className="text-slate-600">14 Linking Road, Bandra West</p>
            <p className="text-slate-600">Mumbai 400050, India</p>
            <p className="text-slate-600 mt-1">aarav@mehtadesign.in</p>
          </div>
          <div className="w-1/2 pl-4 text-right">
            <h3 className="font-serif-classic font-bold text-slate-800 border-b indigo-border pb-1 mb-2 uppercase text-xs tracking-wider">Payment Details</h3>
            <p className="text-slate-600"><span className="font-semibold text-slate-800">Method:</span> Razorpay (UPI)</p>
            <p className="text-slate-600"><span className="font-semibold text-slate-800">Txn ID:</span> pay_Qk29Lx8sR4mZ</p>
            <p className="text-slate-600"><span className="font-semibold text-slate-800">Amount Paid:</span> ₹2,948.82</p>
          </div>
        </div>

        {/* License Block - High Prominence */}
        <div className="mb-8 border-2 indigo-border rounded-sm overflow-hidden">
          <div className="indigo-bg text-white px-4 py-2 font-serif-classic font-bold text-sm tracking-wide uppercase flex justify-between items-center">
            <span>Software License Details</span>
            <span className="bg-[#FB7185] text-white text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider font-sans-classic font-bold">Important</span>
          </div>
          <div className="p-4 bg-[#F8FAFC]">
            <div className="mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Your License Key</p>
              <div className="font-mono-classic text-lg font-bold text-slate-900 bg-white border border-slate-300 p-3 rounded text-center tracking-widest shadow-inner">
                LXR-PRO-7F3K-9QW2-XM4P-A1B8
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-700 mt-4 border-t border-slate-200 pt-3">
              <p><span className="font-semibold text-slate-900">Plan:</span> Pro</p>
              <p><span className="font-semibold text-slate-900">Seats:</span> 1 device</p>
              <p><span className="font-semibold text-slate-900">Valid:</span> 01 Jun 2026 &mdash; 01 Jun 2027</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y-2 indigo-border">
                <th className="py-3 px-2 text-left font-serif-classic font-bold text-slate-800 uppercase text-xs tracking-wider w-3/5">Description</th>
                <th className="py-3 px-2 text-center font-serif-classic font-bold text-slate-800 uppercase text-xs tracking-wider w-1/5">Qty</th>
                <th className="py-3 px-2 text-right font-serif-classic font-bold text-slate-800 uppercase text-xs tracking-wider w-1/5">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-4 px-2 text-slate-800 font-medium">Luxor PDF Pro &mdash; Annual License (1 Year)</td>
                <td className="py-4 px-2 text-center text-slate-600">1</td>
                <td className="py-4 px-2 text-right text-slate-800 font-medium">₹2,499.00</td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50">
                <td className="py-4 px-2 text-slate-800 font-medium">Priority Email Support (12 months)</td>
                <td className="py-4 px-2 text-center text-slate-600">1</td>
                <td className="py-4 px-2 text-right text-slate-500 italic">Included</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-2/5 border border-slate-300 rounded-sm">
            <div className="flex justify-between p-3 border-b border-slate-200 text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="text-slate-800 font-medium">₹2,499.00</span>
            </div>
            <div className="flex justify-between p-3 border-b border-slate-200 text-sm">
              <span className="text-slate-600">GST (18%)</span>
              <span className="text-slate-800 font-medium">₹449.82</span>
            </div>
            <div className="flex justify-between p-4 indigo-bg text-white font-bold">
              <span className="font-serif-classic text-base uppercase tracking-wider">Total</span>
              <span className="text-lg">₹2,948.82</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t indigo-border text-center text-xs text-slate-500">
          <p className="mb-2">Thank you for your purchase. Your license key has also been sent to your email.</p>
          <p className="mb-2">Manage your subscription at <span className="text-[#2563EB] font-medium">luxorpdf.com/account</span> &bull; Need help? <span className="text-[#2563EB] font-medium">support@luxorpdf.com</span></p>
          <p className="italic mt-4 text-slate-400">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </div>
  );
}
