import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white pt-20 pb-8 border-t border-slate-200">
      <div className="container mx-auto px-6 max-w-[1280px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={`${import.meta.env.BASE_URL}brand/luxor-reader-logo.png`}
                alt="Luxor PDF"
                className="h-7 w-auto"
              />
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                Luxor PDF Reader
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              A fast, lightweight, and secure PDF reader designed for productivity and privacy.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#features" className="hover:text-[#E50914]">Features</a></li>
              <li><a href="#tools" className="hover:text-[#E50914]">Tools</a></li>
              <li><a href="#security" className="hover:text-[#E50914]">Security</a></li>
              <li><a href="#pricing" className="hover:text-[#E50914]">Pricing</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-[#E50914]">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-[#E50914]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#E50914]">Terms of Service</Link></li>
              <li><Link href="/refund" className="hover:text-[#E50914]">Refund Policy</Link></li>
              <li><Link href="/contact" className="hover:text-[#E50914]">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="#support" className="hover:text-[#E50914]">Help Center</a></li>
              <li><a href="#support" className="hover:text-[#E50914]">FAQ</a></li>
              <li><a href="mailto:enquiry@luxorpdf.com" className="hover:text-[#E50914]">enquiry@luxorpdf.com</a></li>
            </ul>
          </div>

          {/* Column 5: Follow Us */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Follow Us</h3>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><a href="https://x.com/LuxorPDF" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#E50914]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 text-center md:text-left text-sm text-slate-500">
          <p>© 2026 Luxor PDF. A brand of Fairnova Labs Private Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
