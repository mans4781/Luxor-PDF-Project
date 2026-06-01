import React from "react";
import { Badge } from "@/components/ui/badge";

export interface InvoiceLineItem {
  description: string;
  qty: number;
  amount: string; // pre-formatted, e.g. "₹2,499.00" or "$29.00" or "Included"
}

export interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  /** Optional tax-id row (e.g. GSTIN). Omit for regions without one. */
  taxIdLabel?: string;
  taxIdValue?: string;
  billTo: {
    name: string;
    org: string;
    addressLines: string[];
    email: string;
  };
  licenseKey: string;
  plan: string;
  seats: string;
  validRange: string;
  lineItems: InvoiceLineItem[];
  payment: {
    method: string;
    txnId: string;
    amountPaid: string;
  };
  totals: {
    subtotal: string;
    /** Optional tax row (e.g. "GST (18%)"). Omit for tax-free regions. */
    taxLabel?: string;
    taxAmount?: string;
    total: string;
  };
}

export const INDIA_INVOICE: InvoiceData = {
  invoiceNo: "LXR-INV-2026-00428",
  invoiceDate: "01 Jun 2026",
  dueDate: "01 Jun 2026",
  taxIdLabel: "GSTIN",
  taxIdValue: "29ABCDE1234F1Z5",
  billTo: {
    name: "Aarav Mehta",
    org: "Mehta Design Studio",
    addressLines: ["14 Linking Road, Bandra West", "Mumbai 400050, India"],
    email: "aarav@mehtadesign.in",
  },
  licenseKey: "LXR-PRO-7F3K-9QW2-XM4P-A1B8",
  plan: "Pro Plan",
  seats: "1 User / 2 Devices",
  validRange: "01 Jun 2026 — 01 Jun 2027",
  lineItems: [
    { description: "Luxor PDF Pro — Annual License (1 Year)", qty: 1, amount: "₹2,499.00" },
    { description: "Priority Email Support (12 months)", qty: 1, amount: "Included" },
  ],
  payment: {
    method: "Razorpay (UPI)",
    txnId: "pay_Qk29Lx8sR4mZ",
    amountPaid: "₹2,948.82",
  },
  totals: {
    subtotal: "₹2,499.00",
    taxLabel: "GST (18%)",
    taxAmount: "₹449.82",
    total: "₹2,948.82",
  },
};

export const USA_INVOICE: InvoiceData = {
  invoiceNo: "LXR-INV-2026-00429",
  invoiceDate: "01 Jun 2026",
  dueDate: "01 Jun 2026",
  billTo: {
    name: "James Carter",
    org: "Carter Creative LLC",
    addressLines: ["1200 Market Street, Suite 400", "San Francisco, CA 94103, USA"],
    email: "james@cartercreative.com",
  },
  licenseKey: "LXR-PRO-4D8H-2KP9-VT6N-Z3C7",
  plan: "Pro Plan",
  seats: "1 User / 2 Devices",
  validRange: "01 Jun 2026 — 01 Jun 2027",
  lineItems: [
    { description: "Luxor PDF Pro — Annual License (1 Year)", qty: 1, amount: "$29.00" },
    { description: "Priority Email Support (12 months)", qty: 1, amount: "Included" },
  ],
  payment: {
    method: "Stripe (Card •••• 4242)",
    txnId: "ch_3PqL8xJk2mN4Rt0",
    amountPaid: "$29.00",
  },
  totals: {
    subtotal: "$29.00",
    total: "$29.00",
  },
};

export function InvoiceTemplate({ data = INDIA_INVOICE }: { data?: InvoiceData }) {
  const hasTaxRow = Boolean(data.totals.taxLabel && data.totals.taxAmount);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(data.licenseKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

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
            <div className="text-white text-lg font-semibold mb-2">{data.invoiceNo}</div>
            <div className="inline-block px-4 py-1.5 border-2 border-white text-white font-bold text-base tracking-[0.25em] rounded-sm">
              PAID
            </div>
          </div>
        </div>

        {/* BILLING INFO */}
        <div className="p-10 pb-6 grid grid-cols-2 gap-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
            <div className="text-slate-800 leading-relaxed text-sm">
              <p className="font-bold text-base mb-1">{data.billTo.name}</p>
              <p>{data.billTo.org}</p>
              {data.billTo.addressLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p className="text-blue-600 mt-1">{data.billTo.email}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-slate-500">Invoice Date</div>
              <div className="text-slate-800 font-medium text-right">{data.invoiceDate}</div>

              <div className="text-slate-500">Due Date</div>
              <div className="text-slate-800 font-medium text-right">{data.dueDate}</div>

              {data.taxIdLabel && data.taxIdValue && (
                <>
                  <div className="text-slate-500">{data.taxIdLabel}</div>
                  <div className="text-slate-800 font-medium text-right">{data.taxIdValue}</div>
                </>
              )}
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
              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-semibold">{data.plan}</Badge>
            </div>

            <div className="relative bg-white border border-indigo-100 rounded-lg p-4 pr-14 flex items-center justify-center mb-4 shadow-inner">
              <code className="font-mono text-xl md:text-2xl font-bold text-slate-800 tracking-[0.2em] text-center">
                {data.licenseKey}
              </code>
              <button
                type="button"
                aria-label={copied ? "License key copied" : "Copy license key"}
                title={copied ? "Copied" : "Copy license key"}
                onClick={handleCopy}
                className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-colors ${copied ? "text-green-600" : "text-indigo-300 hover:text-indigo-400"}`}
              >
                {copied ? (
                  <>
                    <span className="text-xs font-semibold">Copied</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                ) : (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <rect x="9" y="9" width="11" height="11" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-between text-sm text-slate-600 font-medium">
              <div><span className="text-slate-400">Seats:</span> {data.seats}</div>
              <div><span className="text-slate-400">Valid:</span> {data.validRange}</div>
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
              {data.lineItems.map((item, i) => {
                const isIncluded = item.amount.toLowerCase() === "included";
                return (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-4">
                      <div className="font-semibold text-slate-800">{item.description}</div>
                    </td>
                    <td className="py-4 text-center text-slate-600">{item.qty}</td>
                    <td className={`py-4 text-right font-medium ${isIncluded ? "text-slate-500 italic" : "text-slate-800"}`}>
                      {item.amount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTALS & PAYMENT */}
        <div className="px-10 pb-10 flex justify-between items-end">
          <div className="w-1/2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Details</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="font-medium text-slate-800">Method:</span> {data.payment.method}</p>
              <p><span className="font-medium text-slate-800">Transaction ID:</span> {data.payment.txnId}</p>
              <p><span className="font-medium text-slate-800">Amount Paid:</span> {data.payment.amountPaid}</p>
            </div>
          </div>

          <div className="w-1/2 max-w-[280px]">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-800 font-medium">{data.totals.subtotal}</span>
              </div>
              {hasTaxRow && (
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-slate-500">{data.totals.taxLabel}</span>
                  <span className="text-slate-800 font-medium">{data.totals.taxAmount}</span>
                </div>
              )}
              <div className={`pt-3 border-t border-slate-200 flex justify-between items-center ${hasTaxRow ? "" : "mt-2"}`}>
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-bold text-indigo-700 text-lg">{data.totals.total}</span>
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
