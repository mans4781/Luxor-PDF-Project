import { Check, ArrowRight, FileText } from "lucide-react";

const COLORS = {
  primary: "#1F1F1F",
  accent: "#D97706",
  accentDeep: "#B45309",
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  text: "#1F1F1F",
  muted: "#7A6F62",
  border: "#E8E0D5",
  borderStrong: "#D6CBB8",
};

const SANS = "'Geist', system-ui, sans-serif";
const SERIF = "'Newsreader', 'Source Serif 4', Georgia, serif";

export function EditorialWarm() {
  return (
    <div style={{ fontFamily: SANS, background: COLORS.bg, color: COLORS.text, minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ borderBottom: `1px solid ${COLORS.border}`, background: "rgba(250,247,242,0.9)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.primary, display: "grid", placeItems: "center" }}>
                <FileText size={16} color={COLORS.bg} strokeWidth={2} />
              </div>
              <span style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 20, letterSpacing: "-0.015em" }}>Luxor PDF</span>
            </div>
            <div style={{ display: "flex", gap: 28, fontSize: 14, color: COLORS.muted, fontWeight: 400 }}>
              <span>Reader</span><span>LuxorSign</span><span>Expiry</span><span>Pricing</span><span>Journal</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 14, color: COLORS.muted }}>Sign in</span>
            <button style={{ background: COLORS.primary, color: COLORS.bg, border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 500, fontSize: 14, fontFamily: SANS, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              Try Luxor free <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "96px 32px 64px", maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 999, fontSize: 13, color: COLORS.muted, marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.accent }} />
          <span style={{ fontFamily: SERIF, fontStyle: "italic" }}>Volume 2</span> · The Reader, reimagined
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 72, lineHeight: 1.05, fontWeight: 400, letterSpacing: "-0.025em", margin: "0 0 28px", color: COLORS.text }}>
          The PDF tool you'll<br/>
          <span style={{ fontStyle: "italic", color: COLORS.accentDeep }}>actually look forward</span> to opening.
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: COLORS.muted, maxWidth: 600, margin: "0 auto 40px", fontWeight: 400 }}>
          Read, sign and protect every PDF — on every device — with one calm, considered subscription. No ads, no upsells, no clutter.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 64 }}>
          <button style={{ background: COLORS.primary, color: COLORS.bg, border: "none", padding: "13px 26px", borderRadius: 999, fontWeight: 500, fontSize: 15, fontFamily: SANS, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            Try Luxor free <ArrowRight size={16} />
          </button>
          <button style={{ background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.borderStrong}`, padding: "13px 26px", borderRadius: 999, fontWeight: 500, fontSize: 15, fontFamily: SANS, cursor: "pointer" }}>
            Read about pricing
          </button>
        </div>

        {/* APP PREVIEW */}
        <div style={{ borderRadius: 20, border: `1px solid ${COLORS.border}`, overflow: "hidden", background: COLORS.surface, boxShadow: `0 32px 64px -24px rgba(31,31,31,0.18)`, maxWidth: 960, margin: "0 auto" }}>
          <div style={{ background: "#F5EFE5", padding: "12px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#E8B96A" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#D6CBB8" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#D6CBB8" }} />
            <span style={{ marginLeft: 18, fontSize: 12, color: COLORS.muted, fontFamily: SERIF, fontStyle: "italic" }}>luxor — quarterly-report.pdf</span>
          </div>
          <div style={{ height: 280, background: `linear-gradient(180deg, ${COLORS.surface}, #FBF8F3)`, display: "grid", placeItems: "center", color: COLORS.muted, fontSize: 14, fontFamily: SERIF, fontStyle: "italic" }}>
            [ a calm reading surface — generous margins, warm paper feel ]
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ padding: "32px 32px 72px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: COLORS.muted, marginBottom: 24 }}>
          Read by quietly serious teams at
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 32, opacity: 0.65, fontFamily: SERIF, fontWeight: 500, fontSize: 19, color: COLORS.text, letterSpacing: "-0.01em" }}>
          <span>Northwind</span><span style={{ fontStyle: "italic" }}>Hartfield & Co.</span><span>Vector</span><span>Lumen Labs</span><span>Quartz</span><span>Atlas</span>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "64px 32px 96px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, letterSpacing: "-0.025em", margin: "0 0 14px" }}>
            Three plans. <span style={{ fontStyle: "italic", color: COLORS.accentDeep }}>One promise.</span>
          </h2>
          <p style={{ fontSize: 17, color: COLORS.muted, margin: 0, fontFamily: SERIF, fontStyle: "italic" }}>
            Start free. Stay free as long as it serves you. Upgrade when it doesn't.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <PricingCard tier="Free" price="$0" cadence="forever" features={["1 device", "25MB file size", "Basic annotation", "Read-only"]} />
          <PricingCard tier="Pro" price="$7" cadence="per month, billed yearly" features={["3 devices", "Unlimited file size", "LuxorSign · 25/mo", "Cloud sync"]} popular />
          <PricingCard tier="Business" price="$23" cadence="per seat / month" features={["Unlimited devices", "SSO + admin", "Unlimited LuxorSign", "Priority support"]} />
        </div>
      </section>
    </div>
  );
}

function PricingCard({ tier, price, cadence, features, popular }: { tier: string; price: string; cadence: string; features: string[]; popular?: boolean }) {
  return (
    <div style={{
      background: COLORS.surface,
      border: popular ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
      borderRadius: 18,
      padding: 32,
      position: "relative",
      boxShadow: popular ? `0 18px 40px -16px rgba(217,119,6,0.28)` : "none",
    }}>
      {popular && (
        <div style={{ position: "absolute", top: -12, left: 24, background: COLORS.accent, color: "white", padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: SANS }}>
          Most chosen
        </div>
      )}
      <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: COLORS.text, marginBottom: 12, fontStyle: "italic" }}>{tier}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, letterSpacing: "-0.03em" }}>{price}</span>
      </div>
      <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 28 }}>{cadence}</div>
      <button style={{
        width: "100%", padding: "12px", borderRadius: 999, fontWeight: 500, fontSize: 14, fontFamily: SANS, cursor: "pointer", marginBottom: 24,
        background: popular ? COLORS.primary : "transparent",
        color: popular ? COLORS.bg : COLORS.text,
        border: popular ? "none" : `1px solid ${COLORS.borderStrong}`,
      }}>
        {tier === "Free" ? "Begin →" : "Start trial →"}
      </button>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((f) => (
          <li key={f} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: COLORS.text }}>
            <Check size={15} color={COLORS.accent} strokeWidth={2.5} /> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
