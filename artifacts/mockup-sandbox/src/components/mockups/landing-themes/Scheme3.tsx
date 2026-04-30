import { Check, ArrowUpRight, FileText } from "lucide-react";

const COLORS = {
  primary: "#164A81",
  secondary: "#E85D2A",
  accent: "#F4A261",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF4EC",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
};

const SANS = "'Inter', system-ui, sans-serif";

export function Scheme3() {
  return (
    <div style={{ fontFamily: SANS, background: COLORS.bg, color: COLORS.text, minHeight: "100vh", letterSpacing: "-0.011em" }}>
      <nav style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, background: COLORS.primary, borderRadius: 5, display: "grid", placeItems: "center" }}>
                <FileText size={13} color="white" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em", color: COLORS.text }}>Luxor</span>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>
              <span>Reader</span><span>Sign</span><span>Expiry</span><span>Pricing</span><span>Changelog</span><span>Docs</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>Log in</span>
            <button style={{ background: COLORS.primary, color: "white", border: "none", padding: "7px 14px", borderRadius: 6, fontWeight: 500, fontSize: 13, fontFamily: SANS, cursor: "pointer" }}>
              Start for free →
            </button>
          </div>
        </div>
      </nav>

      <section style={{ padding: "112px 32px 80px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", border: `1px solid ${COLORS.border}`, background: COLORS.surface, borderRadius: 999, fontSize: 12, color: COLORS.muted, fontWeight: 500, marginBottom: 32 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: COLORS.secondary }} /> Reader 2.0 · Now shipping
        </div>
        <h1 style={{ fontSize: 72, lineHeight: 1.0, fontWeight: 600, letterSpacing: "-0.045em", margin: "0 0 28px", color: COLORS.text }}>
          PDF, perfected.<br/>
          <span style={{ color: COLORS.secondary, fontWeight: 600 }}>One subscription.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: COLORS.muted, maxWidth: 560, margin: "0 auto 40px", fontWeight: 400 }}>
          The reader, signer, and protector your team actually wants to use. Built for speed. Designed for craft.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 72 }}>
          <button style={{ background: COLORS.primary, color: "white", border: "none", padding: "11px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, fontFamily: SANS, cursor: "pointer" }}>
            Start for free →
          </button>
          <button style={{ background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.borderStrong}`, padding: "11px 20px", borderRadius: 8, fontWeight: 500, fontSize: 14, fontFamily: SANS, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            See pricing <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden", background: COLORS.surfaceAlt, maxWidth: 960, margin: "0 auto" }}>
          <div style={{ background: COLORS.surface, padding: "10px 16px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.secondary }} />
            <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.borderStrong }} />
            <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.borderStrong }} />
            <span style={{ marginLeft: 14, fontSize: 11, color: COLORS.muted, fontFamily: "ui-monospace, monospace" }}>luxor.app/document</span>
          </div>
          <div style={{ height: 280, background: COLORS.surfaceAlt, display: "grid", placeItems: "center", color: COLORS.muted, fontSize: 13, fontFamily: "ui-monospace, monospace" }}>
            [ reader · zero chrome · keyboard-driven ]
          </div>
        </div>
      </section>

      <section style={{ padding: "32px 32px 80px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 500, marginBottom: 24 }}>
          Used by teams at
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, opacity: 0.7, fontWeight: 600, fontSize: 16, color: COLORS.text, letterSpacing: "-0.02em" }}>
          <span>Northwind</span><span>Hartfield</span><span>Vector</span><span>Lumen</span><span>Quartz</span><span>Atlas</span>
        </div>
      </section>

      <section style={{ padding: "72px 32px 96px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontSize: 48, fontWeight: 600, letterSpacing: "-0.04em", margin: "0 0 12px", color: COLORS.text }}>
            Simple, fair pricing.
          </h2>
          <p style={{ fontSize: 16, color: COLORS.muted, margin: 0 }}>Start free. Upgrade only when you need to.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden", background: COLORS.surface }}>
          <PricingCol tier="Free" price="$0" cadence="forever" features={["1 device", "25MB file size", "Basic annotation", "Read-only"]} />
          <PricingCol tier="Pro" price="$7" cadence="per month, billed yearly" features={["3 devices", "Unlimited file size", "LuxorSign · 25/mo", "Cloud sync"]} popular />
          <PricingCol tier="Business" price="$23" cadence="per seat / month" features={["Unlimited devices", "SSO + admin console", "Unlimited LuxorSign", "Priority support"]} />
        </div>
      </section>
    </div>
  );
}

function PricingCol({ tier, price, cadence, features, popular }: { tier: string; price: string; cadence: string; features: string[]; popular?: boolean }) {
  return (
    <div style={{
      padding: 32,
      background: popular ? COLORS.surfaceAlt : COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      position: "relative",
    }}>
      {popular && (
        <div style={{ position: "absolute", top: 16, right: 16, fontSize: 10, color: "white", background: COLORS.secondary, padding: "3px 8px", borderRadius: 999, fontWeight: 700, letterSpacing: "0.06em" }}>
          POPULAR
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>{tier}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.04em", color: popular ? COLORS.primary : COLORS.text }}>{price}</span>
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 24 }}>{cadence}</div>
      <button style={{
        width: "100%", padding: "9px", borderRadius: 6, fontWeight: 500, fontSize: 13, fontFamily: SANS, cursor: "pointer", marginBottom: 24,
        background: popular ? COLORS.primary : COLORS.surface,
        color: popular ? "white" : COLORS.text,
        border: popular ? "none" : `1px solid ${COLORS.borderStrong}`,
      }}>
        {tier === "Free" ? "Get started →" : "Start trial →"}
      </button>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: COLORS.text }}>
            <Check size={14} color={COLORS.secondary} strokeWidth={2.5} /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
