import { useState } from "react";
import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { LogIn, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SignedInMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const avatarUrl = user?.imageUrl ?? null;
  const initials = getInitials(displayName, email);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="button-account-menu"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-1 hover:border-[#1e3a8a]/40 hover:shadow-sm transition-all"
          aria-label="Account menu"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#312E81] text-[11px] font-bold text-white">
              {initials}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" strokeWidth={2.25} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#312E81] text-sm font-bold text-white">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">
              {displayName ?? "Your account"}
            </div>
            {email ? (
              <div className="truncate text-xs text-slate-500">{email}</div>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="menuitem-manage-account"
          onSelect={() => {
            setOpen(false);
            openUserProfile();
          }}
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Manage account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="menuitem-sign-out"
          onSelect={() => {
            setOpen(false);
            void signOut();
          }}
          className="text-rose-600 focus:text-rose-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignedOutCta() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="flex items-center gap-2">
      <Link href="/sign-in">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-700 hover:text-[#1e3a8a]"
          data-testid="button-sign-in"
        >
          <LogIn className="mr-1.5 h-4 w-4" />
          Sign in
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          size="sm"
          className="bg-[#1e3a8a] hover:bg-[#312E81] text-white"
          data-testid="button-sign-up"
        >
          Create account
        </Button>
      </Link>
      {/* basePath used to silence unused warning when Link doesn't expose it */}
      <span className="hidden">{basePath}</span>
    </div>
  );
}

export function AccountMenu() {
  return (
    <>
      <Show when="signed-in">
        <SignedInMenu />
      </Show>
      <Show when="signed-out">
        <SignedOutCta />
      </Show>
    </>
  );
}
