import { Check, ArrowRight, FileText, PenLine, Clock, Shield } from "lucide-react";

const COLORS = {
  primary: "#0C4782",
  primaryDark: "#083258",
  accent: "#EE1125",
  bg: "#FFFFFF",
  surface: "#F6F8FB",
  text: "#0F1729",
  muted: "#5B6478",
  border: "#E5E9F0",
};

const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const SERIF = "'Fraunces', 'Source Serif 4', Georgia, serif";

export function StripePremium() {
  return (
    <div style={{ fontFamily: SANS, background: COLORS.bg, color: COLORS.text, minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: COLORS.primary, display: "grid", placeItems: "center" }}>
                <FileText size={16} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>Luxor PDF</span>
            </div>
            <div style={{ display: "flex", gap: 28, fontSize: 14, color: COLORS.muted, fontWeight: 500 }}>
              <span>Products</span><span>Reader</span><span>LuxorSign</span><span>Pricing</span><span>Docs</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: COLORS.muted, fontWeight: 500 }}>Sign in</span>
            <button style={{ background: COLORS.primary, color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14, fontFamily: SANS, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              Start free <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "88px 32px 64px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 999, fontSize: 13, color: COLORS.muted, fontWeight: 500, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.accent }} /> New · Luxor PDF Reader 2.0
        </div>
        <h1 style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-0.035em", margin: "0 0 24px", color: COLORS.text }}>
          Premium PDF tools,<br/>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: COLORS.primary }}>on subscription.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: COLORS.muted, maxWidth: 620, margin: "0 auto 36px", fontWeight: 400 }}>
          Read, sign and protect every PDF — on every device — with one license. Built for individuals and teams who refuse to compromise.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 56 }}>
          <button style={{ background: COLORS.primary, color: "white", border: "none", padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15, fontFamily: SANS, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            Start free <ArrowRight size={16} />
          </button>
          <button style={{ background: "white", color: COLORS.text, border: `1px solid ${COLORS.border}`, padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15, fontFamily: SANS, cursor: "pointer" }}>
            See pricing
          </button>
        </div>

        {/* APP PREVIEW */}
        <div style={{ borderRadius: 16, border: `1px solid ${COLORS.border}`, overflow: "hidden", background: COLORS.surface, boxShadow: `0 24px 60px -20px ${COLORS.primary}33, 0 0 0 1px ${COLORS.border}`, maxWidth: 980, margin: "0 auto" }}>
          <div style={{ background: "#EEF1F6", padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FF5F57" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FFBD2E" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#28C840" }} />
            <span style={{ marginLeft: 16, fontSize: 12, color: COLORS.muted, fontFamily: "ui-monospace, monospace" }}>app.luxorpdf.com</span>
          </div>
          <div style={{ height: 280, background: `linear-gradient(180deg, ${COLORS.surface}, white)`, display: "grid", placeItems: "center", color: COLORS.muted, fontSize: 14 }}>
            [ Reader screenshot · annotation toolbar · clean PDF page ]
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ padding: "32px 32px 72px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: COLORS.muted, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 24 }}>
          Trusted by 12,000+ teams worldwide
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, opacity: 0.55, fontWeight: 700, fontSize: 18, color: COLORS.text }}>
          <span>Northwind</span><span style={{ fontFamily: SERIF, fontStyle: "italic" }}>Hartfield & Co</span><span>Vector</span><span>Lumen Labs</span><span>Quartz</span><span>Atlas</span>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "64px 32px 96px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px" }}>
            Pricing that <span style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, color: COLORS.primary }}>scales with you</span>
          </h2>
          <p style={{ fontSize: 17, color: COLORS.muted, margin: 0 }}>Start free. Upgrade when ready.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <PricingCard tier="Free" price="$0" cadence="forever" features={["1 device", "25MB file size", "Basic annotation", "Read-only"]} />
          <PricingCard tier="Pro" price="$7" cadence="/mo, billed yearly" features={["3 devices", "Unlimited file size", "LuxorSign 25/mo", "Cloud sync"]} popular />
          <PricingCard tier="Business" price="$23" cadence="/seat/mo, billed yearly" features={["Unlimited devices", "SSO + admin", "Unlimited LuxorSign", "Priority support"]} />
        </div>
      </section>
    </div>
  );
}

function PricingCard({ tier, price, cadence, features, popular }: { tier: string; price: string; cadence: string; features: string[]; popular?: boolean }) {
  return (
    <div style={{
      background: "white",
      border: popular ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
      borderRadius: 16,
      padding: 28,
      position: "relative",
      boxShadow: popular ? `0 12px 32px -12px ${COLORS.primary}55` : "none",
    }}>
      {popular && (
        <div style={{ position: "absolute", top: -12, left: 24, background: COLORS.accent, color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Most Popular
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.muted, marginBottom: 8 }}>{tier}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>{price}</span>
      </div>
      <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 24 }}>{cadence}</div>
      <button style={{
        width: "100%", padding: "11px", borderRadius: 10, fontWeight: 600, fontSize: 14, fontFamily: SANS, cursor: "pointer", marginBottom: 24,
        background: popular ? COLORS.primary : "white",
        color: popular ? "white" : COLORS.text,
        border: popular ? "none" : `1px solid ${COLORS.border}`,
      }}>
        {tier === "Free" ? "Get started" : "Start free trial"}
      </button>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: COLORS.text }}>
            <Check size={16} color={COLORS.primary} strokeWidth={3} /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
