import { useState } from "react";
import { Layout } from "@/components/Layout";
import { User, Bell, Shield, CreditCard, Key, Building, Check } from "lucide-react";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "api", label: "API Keys", icon: Key },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function Settings() {
  const [section, setSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [notifs, setNotifs] = useState({
    signedEmail: true,
    reminders: true,
    marketing: false,
    weeklyDigest: true,
  });

  async function save() {
    await new Promise(r => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Layout title="Settings" subtitle="Manage your account and preferences">
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  section === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-xl">
          {section === "profile" && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Profile Information</h2>
              <div className="flex items-center gap-4 pb-5 border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">Y</div>
                <div>
                  <button className="text-sm font-medium text-primary hover:text-primary/80">Change photo</button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 2 MB</p>
                </div>
              </div>
              {[
                { label: "Full name", value: "Your Name", type: "text" },
                { label: "Email address", value: "you@example.com", type: "email" },
                { label: "Phone number", value: "+1 (555) 000-0000", type: "tel" },
                { label: "Company", value: "", type: "text", placeholder: "Your company" },
                { label: "Job title", value: "", type: "text", placeholder: "Your role" },
              ].map(({ label, value, type, placeholder }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                  <input
                    type={type}
                    defaultValue={value}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
              </button>
            </div>
          )}

          {section === "notifications" && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
              {[
                { key: "signedEmail", label: "Document signed", desc: "Email when someone signs your document" },
                { key: "reminders", label: "Automatic reminders", desc: "Send reminders to pending signers" },
                { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of document activity each week" },
                { key: "marketing", label: "Product updates", desc: "News and tips from LexSign" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Toggle
                    enabled={notifs[key as keyof typeof notifs]}
                    onChange={v => setNotifs(n => ({ ...n, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          )}

          {section === "security" && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Current password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">New password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Confirm new password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                </div>
                <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Update Password
                </button>
              </div>
              <div className="pt-5 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Two-factor authentication</p>
                    <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">Enable</button>
                </div>
              </div>
            </div>
          )}

          {section === "billing" && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <h2 className="text-base font-semibold text-foreground">Billing & Plan</h2>
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Free Plan</p>
                    <p className="text-xs text-indigo-600 mt-1">5 documents per month · 2 signers per doc</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">Upgrade</button>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { plan: "Starter", price: "$9", features: ["25 docs/month", "5 signers per doc", "Templates", "Audit trail"] },
                  { plan: "Pro", price: "$24", features: ["Unlimited docs", "Unlimited signers", "Bulk send", "API access", "Advanced audit"] },
                ].map(({ plan, price, features }) => (
                  <div key={plan} className="border border-border rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{plan} — {price}/mo</p>
                      <ul className="mt-2 space-y-1">
                        {features.map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button className="px-3 py-1.5 border border-primary text-primary rounded-lg text-xs font-medium hover:bg-primary/5 transition-colors">
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "api" && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">API Keys</h2>
                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">Pro feature</span>
              </div>
              <p className="text-sm text-muted-foreground">Use API keys to integrate LexSign into your own applications. Upgrade to Pro to generate API keys.</p>
              <div className="h-32 rounded-xl bg-muted/40 border border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <Key className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No API keys yet</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
