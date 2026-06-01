import React from 'react';

export function Editorial() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 font-sans" style={{ backgroundColor: '#F4F1EB', color: '#1C1917' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{__html: `
        .editorial-invoice {
          --color-ivory: #F4F1EB;
          --color-ink: #1C1917;
          --color-indigo: #312E81;
          --color-coral: #FB7185;
          --font-serif: 'Cormorant Garamond', serif;
          --font-sans: 'Outfit', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }
        .editorial-invoice {
          font-family: var(--font-sans);
          background-color: var(--color-ivory);
          color: var(--color-ink);
        }
        .editorial-serif {
          font-family: var(--font-serif);
        }
        .editorial-mono {
          font-family: var(--font-mono);
        }
      `}} />

      <div className="editorial-invoice relative w-[850px] min-h-[1180px] bg-[#F4F1EB] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-16 flex flex-col border border-[#E8E4D9]">
        
        {/* Header */}
        <header className="flex justify-between items-start mb-16 border-b border-[#1C1917]/20 pb-12">
          <div className="flex flex-col">
            <div className="w-14 h-14 bg-white shadow-sm border border-[#E8E4D9] rounded flex items-center justify-center mb-6">
              <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="editorial-serif text-6xl font-medium tracking-tight leading-none mb-4">Invoice</h1>
            <p className="text-sm tracking-widest uppercase text-[#1C1917]/60">Luxor PDF Suite</p>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <div className="px-3 py-1 mb-8 border border-[#312E81] text-[#312E81] text-xs font-medium tracking-widest uppercase inline-block">
              Paid
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#1C1917]/80">
              <span className="text-[#1C1917]/50 text-right">Invoice No</span>
              <span className="font-medium editorial-mono">LXR-INV-2026-00428</span>
              
              <span className="text-[#1C1917]/50 text-right">Date</span>
              <span className="font-medium">01 Jun 2026</span>
              
              <span className="text-[#1C1917]/50 text-right">Due</span>
              <span className="font-medium">01 Jun 2026</span>
            </div>
          </div>
        </header>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-16 mb-16">
          <div>
            <h3 className="editorial-serif text-2xl mb-4 italic text-[#1C1917]/70">From</h3>
            <div className="text-sm leading-relaxed text-[#1C1917]/80">
              <p className="font-medium text-[#1C1917]">Luxor PDF Suite</p>
              <p>luxorpdf.com</p>
              <p>billing@luxorpdf.com</p>
              <p className="mt-2 text-xs text-[#1C1917]/50">GSTIN: 29ABCDE1234F1Z5</p>
            </div>
          </div>
          
          <div>
            <h3 className="editorial-serif text-2xl mb-4 italic text-[#1C1917]/70">Bill To</h3>
            <div className="text-sm leading-relaxed text-[#1C1917]/80">
              <p className="font-medium text-[#1C1917]">Aarav Mehta</p>
              <p>Mehta Design Studio</p>
              <p>14 Linking Road, Bandra West</p>
              <p>Mumbai 400050, India</p>
              <p>aarav@mehtadesign.in</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1C1917] text-left">
                <th className="py-4 font-medium tracking-widest uppercase text-xs text-[#1C1917]/60">Description</th>
                <th className="py-4 font-medium tracking-widest uppercase text-xs text-[#1C1917]/60 text-center w-24">Qty</th>
                <th className="py-4 font-medium tracking-widest uppercase text-xs text-[#1C1917]/60 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#1C1917]/10">
                <td className="py-6 pr-4">
                  <p className="font-medium text-base mb-1">Luxor PDF Pro — Annual License (1 Year)</p>
                </td>
                <td className="py-6 text-center text-[#1C1917]/70">1</td>
                <td className="py-6 text-right editorial-mono text-base">₹2,499.00</td>
              </tr>
              <tr className="border-b border-[#1C1917]/10">
                <td className="py-6 pr-4">
                  <p className="font-medium text-base mb-1">Priority Email Support (12 months)</p>
                </td>
                <td className="py-6 text-center text-[#1C1917]/70">1</td>
                <td className="py-6 text-right editorial-mono text-[#1C1917]/50 italic">Included</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-80">
            <div className="flex justify-between py-2 text-sm text-[#1C1917]/70">
              <span>Subtotal</span>
              <span className="editorial-mono">₹2,499.00</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-[#1C1917]/70 border-b border-[#1C1917]/20">
              <span>GST (18%)</span>
              <span className="editorial-mono">₹449.82</span>
            </div>
            <div className="flex justify-between py-4 mt-2">
              <span className="editorial-serif text-2xl font-medium">Total</span>
              <span className="editorial-mono text-2xl font-medium">₹2,948.82</span>
            </div>
            <div className="flex justify-between py-2 text-sm text-[#312E81] font-medium bg-[#312E81]/5 px-4 mt-4">
              <span>Amount Paid</span>
              <span className="editorial-mono">₹2,948.82</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-16 grid grid-cols-2 gap-8 text-sm border-t border-b border-[#1C1917]/10 py-6">
          <div>
            <span className="text-[#1C1917]/50 uppercase tracking-widest text-xs block mb-1">Payment Method</span>
            <span className="font-medium">Razorpay (UPI)</span>
          </div>
          <div>
            <span className="text-[#1C1917]/50 uppercase tracking-widest text-xs block mb-1">Transaction ID</span>
            <span className="editorial-mono text-xs">pay_Qk29Lx8sR4mZ</span>
          </div>
        </div>

        {/* License Key Block - Key Differentiator */}
        <div className="mt-auto mb-16 relative">
          <div className="absolute inset-0 bg-[#312E81] -mx-16 px-16 py-12 text-white">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="editorial-serif text-4xl mb-2 text-[#F4F1EB]">Your License Key</h2>
                <p className="text-[#F4F1EB]/70 font-light tracking-wide text-sm">Please keep this secure. Valid for 1 device.</p>
              </div>
              <div className="text-right text-sm text-[#F4F1EB]/70">
                <p className="mb-1">Valid until</p>
                <p className="font-medium text-[#F4F1EB]">01 Jun 2027</p>
              </div>
            </div>
            
            <div className="bg-[#F4F1EB]/10 border border-[#F4F1EB]/20 p-6 flex items-center justify-center">
              <span className="editorial-mono text-2xl tracking-[0.2em] font-medium text-[#FB7185] break-all text-center">
                LXR-PRO-7F3K-9QW2-XM4P-A1B8
              </span>
            </div>
            
            <div className="mt-6 flex justify-between text-xs tracking-widest uppercase text-[#F4F1EB]/50">
              <span>Plan: Pro</span>
              <span>Seats: 1 Device</span>
            </div>
          </div>
          {/* Spacer to push content down below the absolute positioned block */}
          <div className="h-[240px]"></div>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-8 border-t border-[#1C1917]/20 text-center">
          <p className="text-xs text-[#1C1917]/50 leading-relaxed max-w-lg mx-auto">
            Thank you for your purchase. Your license key has also been sent to your email. 
            Manage your subscription at <span className="text-[#1C1917] font-medium">luxorpdf.com/account</span>.<br/>
            This is a computer-generated invoice. Support: <span className="text-[#1C1917]">support@luxorpdf.com</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
