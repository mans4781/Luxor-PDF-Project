// Proposed invoice format for Luxor PDF Secure purchases.
// Matches the license-email branding (Luxor blue/red/amber wordmark, slate palette).
export function InvoiceFormat() {
  return (
    <div className="min-h-screen w-full bg-slate-100 py-8 px-4 font-sans text-slate-900">
      <div className="mx-auto max-w-[720px] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-10 pt-10 pb-6">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              <span className="text-blue-900">Luxor</span>{" "}
              <span className="text-red-600">PDF</span>{" "}
              <span className="text-amber-700">Secure</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              luxorpdf.com · noreply@luxorpdf.com
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tracking-wide text-slate-800">INVOICE</p>
            <p className="mt-1 text-sm text-slate-500">LX-2026-000148</p>
            <p className="text-sm text-slate-500">August 14, 2026</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              PAID
            </span>
          </div>
        </div>

        <div className="mx-10 border-t border-slate-200" />

        {/* Billed to / payment info */}
        <div className="grid grid-cols-2 gap-8 px-10 py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Billed to</p>
            <p className="mt-2 text-sm font-semibold">Mansoor Alam</p>
            <p className="text-sm text-slate-500">mansoor@example.com</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Payment</p>
            <p className="mt-2 text-sm">Razorpay · UPI</p>
            <p className="text-sm text-slate-500">Ref: pay_NxT4kQ8vLm2Wc1</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-200 text-[11px] uppercase tracking-widest text-slate-400">
                <th className="py-3 text-left font-semibold">Description</th>
                <th className="py-3 text-right font-semibold">Period</th>
                <th className="py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <p className="font-semibold">Luxor PDF Secure — Yearly plan</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    License key: <span className="font-mono">LUXOR-8F4K-····-····-3RZT</span>
                  </p>
                </td>
                <td className="py-4 text-right text-slate-500 whitespace-nowrap align-top">
                  Aug 14, 2026 – Aug 14, 2027
                </td>
                <td className="py-4 text-right font-semibold align-top">₹2,499.00</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto mt-4 w-64 text-sm">
            <div className="flex justify-between py-1 text-slate-500">
              <span>Subtotal</span><span>₹2,117.80</span>
            </div>
            <div className="flex justify-between py-1 text-slate-500">
              <span>GST (18%)</span><span>₹381.20</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 py-2 text-base font-bold">
              <span>Total paid</span><span>₹2,499.00</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-slate-50 px-10 py-6">
          <p className="text-xs leading-relaxed text-slate-500">
            Your license key was sent separately to your email and is shown here
            partially masked for security. Need help? Reply to your license email
            or visit <span className="text-indigo-800 font-medium">luxorpdf.com/contact</span>.
          </p>
          <p className="mt-2 text-xs text-slate-400">© 2026 Luxor PDF Secure. This invoice was generated automatically after payment confirmation.</p>
        </div>
      </div>
    </div>
  );
}
