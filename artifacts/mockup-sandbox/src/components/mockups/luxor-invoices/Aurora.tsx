import React from 'react';

export function Aurora() {
  return (
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-[#312E81] via-[#2563EB] to-[#FB7185] flex justify-center items-start aurora-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        
        .aurora-wrapper {
          font-family: 'Space Grotesk', sans-serif;
        }
        .aurora-display {
          font-family: 'Sora', sans-serif;
        }
        .aurora-mono {
          font-family: 'Space Mono', monospace;
        }
        .aurora-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.2) inset;
        }
        .aurora-glass-chip {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}} />

      <div className="aurora-glass w-full max-w-[750px] rounded-[2rem] p-10 md:p-14 text-slate-800 relative overflow-hidden">
        {/* Decorative blooms inside the card for extra glass effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FB7185] rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2563EB] rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-tr from-[#312E81] to-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg p-2.5">
                <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-full h-full object-contain filter drop-shadow-md brightness-0 invert" />
              </div>
              <div>
                <h1 className="aurora-display text-2xl font-bold tracking-tight text-slate-900">Luxor PDF</h1>
                <p className="text-sm font-medium text-slate-500">Pro License Invoice</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-700 font-bold tracking-widest text-xs uppercase mb-3">
                Paid
              </div>
              <p className="aurora-mono text-sm font-medium text-slate-600">LXR-INV-2026-00428</p>
              <p className="text-sm text-slate-500 mt-1">Issued: 01 Jun 2026</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</h3>
              <p className="font-bold text-slate-900">Aarav Mehta</p>
              <p className="text-sm text-slate-600 font-medium">Mehta Design Studio</p>
              <p className="text-sm text-slate-600">14 Linking Road, Bandra West</p>
              <p className="text-sm text-slate-600">Mumbai 400050, India</p>
              <p className="text-sm text-slate-600">aarav@mehtadesign.in</p>
            </div>
            <div className="space-y-1.5 md:text-right">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Seller</h3>
              <p className="font-bold text-slate-900">Luxor PDF Suite</p>
              <p className="text-sm text-slate-600">luxorpdf.com</p>
              <p className="text-sm text-slate-600">billing@luxorpdf.com</p>
              <p className="text-sm text-slate-600">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
          </div>

          {/* License Key Block */}
          <div className="aurora-glass-chip rounded-2xl p-6 md:p-8 mb-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <h3 className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest mb-3">Your Pro License Key</h3>
            <div className="aurora-mono text-lg md:text-2xl font-bold text-indigo-900 tracking-wider bg-white/60 px-6 py-3 md:py-4 rounded-xl border border-white/60 shadow-sm mb-4 w-full text-center">
              LXR-PRO-7F3K-9QW2-XM4P-A1B8
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-indigo-900/70">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Plan: Pro</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Seats: 1 device</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Valid until 01 Jun 2027</span>
            </div>
          </div>

          <div className="mb-10 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">Description</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 text-center w-24">Qty</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                <tr>
                  <td className="py-4 px-4 font-medium text-slate-800">Luxor PDF Pro — Annual License (1 Year)</td>
                  <td className="py-4 px-4 text-slate-600 text-center font-medium">1</td>
                  <td className="py-4 px-4 text-slate-800 text-right font-semibold">₹2,499.00</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium text-slate-800">Priority Email Support (12 months)</td>
                  <td className="py-4 px-4 text-slate-600 text-center font-medium">1</td>
                  <td className="py-4 px-4 text-slate-500 text-right text-sm font-medium">Included</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-t border-slate-200/60 pt-6 mb-12 gap-6">
            <div className="space-y-1.5 bg-white/40 p-4 rounded-xl border border-white/50 w-full md:w-auto">
              <p className="text-sm text-slate-500"><span className="font-bold text-slate-700">Payment Method:</span> Razorpay (UPI)</p>
              <p className="text-sm text-slate-500"><span className="font-bold text-slate-700">Txn ID:</span> <span className="aurora-mono text-xs ml-1">pay_Qk29Lx8sR4mZ</span></p>
            </div>
            <div className="w-full md:w-64 space-y-3">
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>Subtotal</span>
                <span>₹2,499.00</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 font-medium">
                <span>GST (18%)</span>
                <span>₹449.82</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200/60 mt-3">
                <span>Total Paid</span>
                <span>₹2,948.82</span>
              </div>
            </div>
          </div>

          <footer className="text-center pt-8 border-t border-slate-200/60">
            <p className="text-sm text-slate-500 mb-2 leading-relaxed">
              Thank you for your purchase. Your license key has also been sent to your email.<br/>
              Manage your subscription at <span className="font-semibold text-slate-700">luxorpdf.com/account</span>.
            </p>
            <p className="text-xs text-slate-400 mt-5 uppercase tracking-widest font-semibold">
              Computer-generated invoice · <span className="text-slate-500 lowercase tracking-normal font-medium">support@luxorpdf.com</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Aurora;
