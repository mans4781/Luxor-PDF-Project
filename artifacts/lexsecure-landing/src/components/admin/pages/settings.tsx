import { useState } from "react";
import { toast } from "sonner";
import { Bell, Globe2, Lock, ShieldCheck, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "../shared";
import { logAudit } from "../services";

export function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const [notifPayments, setNotifPayments] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifSecurity, setNotifSecurity] = useState(true);
  const [timezone, setTimezone] = useState("UTC");
  const [displayName, setDisplayName] = useState("Admin");

  return (
    <div>
      <PageHeader title="Settings" sub="Console preferences and account security" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <User className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-9 max-w-xs text-[13px]" />
            </div>
            <div>
              <Label className="text-xs">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-1 h-9 max-w-xs text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Dubai"].map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-blue-700"
              onClick={() => {
                logAudit("Console preferences updated", displayName);
                toast.success("Preferences saved for this session.");
              }}
            >
              Save preferences
            </Button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Preferences apply to this console session on this device.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Bell className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Payment events", desc: "New subscriptions, renewals and failed payments", v: notifPayments, set: setNotifPayments },
              { label: "Offer lifecycle", desc: "Offers starting, ending or hitting usage limits", v: notifOffers, set: setNotifOffers },
              { label: "Security alerts", desc: "Failed admin logins and unusual activity", v: notifSecurity, set: setNotifSecurity },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/60 px-3 py-2.5">
                <div>
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{n.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">{n.desc}</div>
                </div>
                <Switch checked={n.v} onCheckedChange={n.set} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/60 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Two-step admin login</div>
                <Badge variant="outline" className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-[10px] text-emerald-600 dark:text-emerald-400">enabled</Badge>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                Console access requires the admin password plus the secondary passphrase.
              </div>
            </div>
            <div className="rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/60 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Session token</div>
                <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500">this browser</Badge>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                Your admin token is stored for this tab only and cleared when you log out.
              </div>
            </div>
            <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700" onClick={onLogout}>
              Log out of console
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
              <Globe2 className="h-4 w-4 text-slate-400 dark:text-slate-500" /> About this console
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            <p>
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
              Revenue, users, licenses, documents and traffic are <span className="font-semibold text-slate-700 dark:text-slate-300">live production data</span>.
            </p>
            <p>
              Sections marked <Badge variant="outline" className="mx-0.5 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-[9px] text-amber-600 dark:text-amber-400">sample</Badge>
              (offers, referrals, acquisition channels, ops metrics, regions) are illustrative
              workspaces — their backends are on the roadmap, and every action you take there is
              kept in this session so nothing is silently lost.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
