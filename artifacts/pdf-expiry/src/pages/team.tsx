import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Trash2,
  Loader2,
  ShieldCheck,
  Monitor,
  Clock,
  Crown,
  X,
  Building2,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useGetOrg,
  useInviteOrgMember,
  useRevokeOrgInvite,
  useRemoveOrgMember,
  useDeactivateOrgDevice,
  useCreateCheckoutSession,
  getGetOrgQueryKey,
  type OrgSummary,
  type OrgMember,
} from "@workspace/api-client-react";
import { basePath } from "@/lib/base-path";

export default function TeamPage() {
  return (
    <Layout>
      <TeamContent />
    </Layout>
  );
}

function TeamContent() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  const orgQuery = useGetOrg({
    query: {
      queryKey: getGetOrgQueryKey(),
      retry: false,
      enabled: isLoaded && isSignedIn,
    },
  });

  if (!isLoaded || orgQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading your team…
      </div>
    );
  }

  if (orgQuery.isError || !orgQuery.data) {
    return <CreateTeamState />;
  }

  return <TeamConsole org={orgQuery.data} />;
}

// ─── Empty state: buy a team plan ─────────────────────────────────────────────

function CreateTeamState() {
  const [orgName, setOrgName] = useState("");
  const [seats, setSeats] = useState(3);
  const checkout = useCreateCheckoutSession();
  const { toast } = useToast();

  function handleStart() {
    const origin = window.location.origin;
    checkout.mutate(
      {
        data: {
          plan: "team",
          provider: "stripe",
          seats: Math.max(1, Math.floor(seats)),
          orgName: orgName.trim() || "My Team",
          successUrl: `${origin}${basePath}/team?checkout_success=1`,
          cancelUrl: `${origin}${basePath}/team?checkout_cancelled=1`,
        },
      },
      {
        onSuccess: (data) => {
          if (data?.url) window.location.replace(data.url);
          else
            toast({
              title: "Couldn't start checkout",
              description: "No checkout URL was returned.",
              variant: "destructive",
            });
        },
        onError: (err: unknown) => {
          toast({
            title: "Couldn't start checkout",
            description:
              err instanceof Error ? err.message : "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <Building2 className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Start a team</h1>
            <p className="text-white/85 text-sm mt-0.5">
              Buy seats once, invite your colleagues by email — no license keys
              to share.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-indigo-700 font-semibold text-sm">
              Team name
            </Label>
            <Input
              id="org-name"
              data-testid="input-org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc."
              className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seats" className="text-indigo-700 font-semibold text-sm">
              Number of seats
            </Label>
            <Input
              id="seats"
              data-testid="input-seats"
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={(e) =>
                setSeats(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 w-32"
            />
            <p className="text-xs text-slate-500">
              One seat per person. Each member can use up to 2 devices.
            </p>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold disabled:opacity-60"
            disabled={checkout.isPending}
            onClick={handleStart}
            data-testid="button-start-team"
          >
            {checkout.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" /> Continue to checkout
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Management console ───────────────────────────────────────────────────────

function TeamConsole({ org }: { org: OrgSummary }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");

  const inviteMut = useInviteOrgMember();
  const revokeMut = useRevokeOrgInvite();
  const removeMut = useRemoveOrgMember();
  const deactivateMut = useDeactivateOrgDevice();

  function refresh() {
    void qc.invalidateQueries({ queryKey: getGetOrgQueryKey() });
  }

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    try {
      const res = await inviteMut.mutateAsync({
        data: { email, role: "member" },
      });
      setInviteEmail("");
      refresh();
      toast({
        title: "Invitation sent",
        description: res.emailSent
          ? `An invite email is on its way to ${res.email}.`
          : `Invite created for ${res.email}, but the email could not be sent.`,
      });
    } catch (err) {
      toast({
        title: "Couldn't send invite",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleRevoke(inviteId: number) {
    try {
      await revokeMut.mutateAsync({ data: { inviteId } });
      refresh();
      toast({ title: "Invite revoked" });
    } catch (err) {
      toast({
        title: "Couldn't revoke invite",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeMut.mutateAsync({ data: { userId } });
      refresh();
      toast({ title: "Member removed" });
    } catch (err) {
      toast({
        title: "Couldn't remove member",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeactivate(userId: string, deviceId: string) {
    try {
      await deactivateMut.mutateAsync({ data: { userId, deviceId } });
      refresh();
      toast({ title: "Device deactivated" });
    } catch (err) {
      toast({
        title: "Couldn't deactivate device",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  const seatsFull = org.seatsAvailable <= 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
              <Users className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="team-name">
                {org.name}
              </h1>
              <p className="text-white/85 text-sm mt-0.5 capitalize">
                {org.planName} plan ·{" "}
                {org.subscriptionActive ? "Active" : "Inactive"} until{" "}
                {new Date(org.subscriptionEndDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold leading-none"
              data-testid="seats-summary"
            >
              {org.seatsUsed}/{org.maxSeats}
            </div>
            <div className="text-white/80 text-xs mt-1">seats used</div>
          </div>
        </div>
      </div>

      {/* Invite */}
      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="pt-6 space-y-3">
          <Label className="text-indigo-700 font-semibold text-sm flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Invite a colleague
          </Label>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input
              data-testid="input-invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleInvite();
              }}
              placeholder="colleague@company.com"
              disabled={seatsFull}
              className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20"
            />
            <Button
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 font-semibold shrink-0 disabled:opacity-60"
              disabled={inviteMut.isPending || seatsFull || !inviteEmail.trim()}
              onClick={handleInvite}
              data-testid="button-send-invite"
            >
              {inviteMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Send invite
                </>
              )}
            </Button>
          </div>
          {seatsFull && (
            <p className="text-xs text-rose-600">
              All seats are in use. Remove a member to free up a seat.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {org.pendingInvites.length > 0 && (
        <Card className="border-amber-100 shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending invitations
            </h2>
            <ul className="space-y-2" data-testid="pending-invites">
              {org.pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {inv.email}
                    </p>
                    <p className="text-xs text-amber-600">
                      Expires{" "}
                      {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 shrink-0"
                    disabled={revokeMut.isPending}
                    onClick={() => handleRevoke(inv.id)}
                    data-testid={`button-revoke-${inv.id}`}
                  >
                    <X className="w-4 h-4 mr-1" /> Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Members ({org.members.length})
          </h2>
          <ul className="space-y-3" data-testid="members-list">
            {org.members.map((m) => (
              <MemberRow
                key={m.userId}
                member={m}
                onRemove={() => handleRemove(m.userId)}
                onDeactivate={(deviceId) => handleDeactivate(m.userId, deviceId)}
                removing={removeMut.isPending}
                deactivating={deactivateMut.isPending}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({
  member,
  onRemove,
  onDeactivate,
  removing,
  deactivating,
}: {
  member: OrgMember;
  onRemove: () => void;
  onDeactivate: (deviceId: string) => void;
  removing: boolean;
  deactivating: boolean;
}) {
  const isAdmin = member.role === "admin";
  return (
    <li className="border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {isAdmin ? (
              <Crown className="w-4 h-4" />
            ) : (
              <Users className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {member.email ?? member.userId}
            </p>
            <p className="text-xs text-slate-500 capitalize">{member.role}</p>
          </div>
        </div>
        {!isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 shrink-0"
            disabled={removing}
            onClick={onRemove}
            data-testid={`button-remove-${member.userId}`}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      {member.devices.length > 0 && (
        <ul className="mt-3 space-y-1.5 pl-12">
          {member.devices.map((d) => (
            <li
              key={d.deviceId}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-1.5 text-slate-600 min-w-0">
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {d.deviceName ?? d.deviceId.slice(0, 12)}
                  {d.os ? ` · ${d.os}` : ""}
                </span>
              </span>
              <button
                className="text-rose-500 hover:text-rose-700 font-medium shrink-0 disabled:opacity-50"
                disabled={deactivating}
                onClick={() => onDeactivate(d.deviceId)}
                data-testid={`button-deactivate-${d.deviceId}`}
              >
                Deactivate
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
