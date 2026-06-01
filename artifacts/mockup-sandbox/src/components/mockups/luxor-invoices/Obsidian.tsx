import React from 'react';
import './_obsidian.css';

export function Obsidian() {
  return (
    <div className="obsidian-theme">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      
      <div className="invoice-card w-full max-w-[700px] p-12 md:p-16 rounded-2xl flex flex-col gap-10">
        
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md overflow-hidden p-2">
                <img src="/__mockup/images/luxor-icon.png" alt="Luxor PDF" className="w-full h-full object-contain" />
              </div>
              <span className="font-serif text-2xl tracking-wide text-white">Luxor PDF Suite</span>
            </div>
            <div className="text-[var(--text-muted)] text-sm leading-relaxed mt-2">
              <p>luxorpdf.com</p>
              <p>billing@luxorpdf.com</p>
              <p>GSTIN: 29ABCDE1234F1Z5</p>
            </div>
          </div>
          
          <div className="text-right flex flex-col gap-2">
            <h1 className="font-serif text-4xl tracking-widest text-[var(--accent-gold)] uppercase mb-2">Invoice</h1>
            <p className="text-[var(--text-muted)] text-sm flex justify-between gap-6"><span>Invoice No:</span> <span className="text-white font-mono">LXR-INV-2026-00428</span></p>
            <p className="text-[var(--text-muted)] text-sm flex justify-between gap-6"><span>Invoice Date:</span> <span className="text-white">01 Jun 2026</span></p>
            <p className="text-[var(--text-muted)] text-sm flex justify-between gap-6"><span>Due Date:</span> <span className="text-white">01 Jun 2026</span></p>
            <div className="mt-2 inline-flex items-center justify-end">
              <span className="px-3 py-1 rounded-full border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-semibold tracking-widest uppercase bg-[rgba(252,211,77,0.1)]">Paid</span>
            </div>
          </div>
        </header>

        <div className="divider" />

        {/* Bill To */}
        <section className="flex justify-between">
          <div className="flex flex-col gap-2 max-w-[250px]">
            <h3 className="text-xs tracking-widest text-[var(--text-muted)] uppercase mb-1">Billed To</h3>
            <p className="font-medium text-lg text-white">Aarav Mehta</p>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              Mehta Design Studio<br />
              14 Linking Road, Bandra West<br />
              Mumbai 400050, India
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-1">aarav@mehtadesign.in</p>
          </div>
          
          <div className="flex flex-col gap-2 text-right">
            <h3 className="text-xs tracking-widest text-[var(--text-muted)] uppercase mb-1">Payment Details</h3>
            <p className="text-white text-sm">Razorpay (UPI)</p>
            <p className="text-[var(--text-muted)] text-sm font-mono mt-1">Txn: pay_Qk29Lx8sR4mZ</p>
          </div>
        </section>

        {/* Items Table */}
        <section className="mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-3 text-xs tracking-widest text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)] font-normal">Description</th>
                <th className="py-3 text-xs tracking-widest text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)] font-normal text-right">Qty</th>
                <th className="py-3 text-xs tracking-widest text-[var(--text-muted)] uppercase border-b border-[var(--border-subtle)] font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td className="py-5 border-b border-[var(--border-subtle)] text-white font-medium">Luxor PDF Pro — Annual License (1 Year)</td>
                <td className="py-5 border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-right">1</td>
                <td className="py-5 border-b border-[var(--border-subtle)] text-white text-right font-mono">₹2,499.00</td>
              </tr>
              <tr>
                <td className="py-5 border-b border-[var(--border-subtle)] text-white font-medium">Priority Email Support (12 months)</td>
                <td className="py-5 border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-right">1</td>
                <td className="py-5 border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-right font-mono">Included</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 flex flex-col gap-3">
              <div className="flex justify-between text-sm text-[var(--text-muted)]">
                <span>Subtotal</span>
                <span className="font-mono text-white">₹2,499.00</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--text-muted)]">
                <span>GST (18%)</span>
                <span className="font-mono text-white">₹449.82</span>
              </div>
              <div className="divider my-1" />
              <div className="flex justify-between items-center">
                <span className="font-serif text-xl text-white">Total</span>
                <span className="font-mono text-xl text-[var(--accent-gold)]">₹2,948.82</span>
              </div>
              <div className="flex justify-between items-center mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-[var(--text-muted)] font-medium">Amount Paid</span>
                <span className="font-mono text-sm text-white">₹2,948.82</span>
              </div>
            </div>
          </div>
        </section>

        {/* License Key Panel */}
        <section className="key-panel mt-4 p-8 rounded-xl flex flex-col items-center justify-center text-center gap-4">
          <h3 className="text-[var(--accent-gold)] text-xs tracking-widest uppercase font-semibold">Your Pro License Key</h3>
          <div className="bg-black/50 border border-[var(--accent-gold)]/30 rounded-lg px-6 py-4 backdrop-blur-sm">
            <code className="font-mono text-2xl md:text-3xl text-white tracking-widest text-shadow-sm shadow-[var(--accent-gold)]">LXR-PRO-7F3K-9QW2-XM4P-A1B8</code>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-[var(--text-muted)] mt-2">
            <p>Plan: <span className="text-white font-medium">Pro</span></p>
            <p>Seats: <span className="text-white font-medium">1 device</span></p>
            <p>Valid: <span className="text-white font-medium">01 Jun 2026 → 01 Jun 2027</span></p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t border-[var(--border-subtle)] text-center">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto">
            Thank you for your purchase. Your license key has also been sent to your email. 
            Manage your subscription at <span className="text-white">luxorpdf.com/account</span>.<br />
            This is a computer-generated invoice. Support: <span className="text-white">support@luxorpdf.com</span>
          </p>
        </footer>

      </div>
    </div>
  );
}
