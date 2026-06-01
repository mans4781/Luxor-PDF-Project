import { and, eq, ne, sql, desc } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import {
  db,
  organizationsTable,
  organizationMembersTable,
  organizationInvitesTable,
  devicesTable,
  type Organization,
  type OrganizationMember,
  type OrganizationInvite,
  type Device,
} from "@workspace/db";
import { logger } from "./logger";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** How long an emailed invite stays valid before it must be re-sent. */
export const INVITE_EXPIRY_DAYS = 14;
/** Each team member may bind at most this many devices. */
export const MAX_DEVICES_PER_MEMBER = 2;

export type OrgRole = "admin" | "member";

// ─── Idempotent startup migration ─────────────────────────────────────────────

export async function runOrgMigrations(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        plan_name TEXT NOT NULL DEFAULT 'team',
        status TEXT NOT NULL DEFAULT 'active',
        max_seats INTEGER NOT NULL DEFAULT 1,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organizations_owner_user_id_idx
        ON organizations(owner_user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organizations_stripe_subscription_id_idx
        ON organizations(stripe_subscription_id)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_members (
        org_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        PRIMARY KEY (org_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
        ON organization_members(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organization_members_org_status_idx
        ON organization_members(org_id, status)
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_invites (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        token_hash TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        invited_by TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE,
        accepted_by_user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organization_invites_org_id_idx
        ON organization_invites(org_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organization_invites_email_idx
        ON organization_invites(email)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS organization_invites_org_status_idx
        ON organization_invites(org_id, status)
    `);
  } catch (err) {
    logger.error({ err }, "Organization migration failed");
    throw err;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 256-bit URL-safe invite token; only its SHA-256 hash is ever stored. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim()).digest("hex");
}

/** Seats consumed = active members + still-pending (un-expired) invites. */
async function seatsUsed(orgId: number, now: Date = new Date()): Promise<number> {
  const [members] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.orgId, orgId),
        eq(organizationMembersTable.status, "active"),
      ),
    );
  const [invites] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(organizationInvitesTable)
    .where(
      and(
        eq(organizationInvitesTable.orgId, orgId),
        eq(organizationInvitesTable.status, "pending"),
        sql`${organizationInvitesTable.expiresAt} > ${now}`,
      ),
    );
  return (members?.n ?? 0) + (invites?.n ?? 0);
}

// ─── Membership / org lookups ─────────────────────────────────────────────────

export interface ActiveOrgMembership {
  org: Organization;
  member: OrganizationMember;
}

/**
 * Returns the user's active membership in an active, currently-subscribed org,
 * or null. Used by the license layer to grant Team members access without a
 * product key. If the user belongs to several orgs the one with the latest
 * subscription end wins.
 */
export async function getActiveOrgMembership(
  userId: string,
  now: Date = new Date(),
): Promise<ActiveOrgMembership | null> {
  const rows = await db
    .select({ org: organizationsTable, member: organizationMembersTable })
    .from(organizationMembersTable)
    .innerJoin(
      organizationsTable,
      eq(organizationMembersTable.orgId, organizationsTable.id),
    )
    .where(
      and(
        eq(organizationMembersTable.userId, userId),
        eq(organizationMembersTable.status, "active"),
        eq(organizationsTable.status, "active"),
        sql`${organizationsTable.subscriptionEndDate} > ${now}`,
      ),
    )
    .orderBy(desc(organizationsTable.subscriptionEndDate))
    .limit(1);
  return rows[0] ?? null;
}

/** The org where this user is an active admin (the team they manage), or null. */
export async function getAdminOrg(
  userId: string,
): Promise<{ org: Organization; member: OrganizationMember } | null> {
  const rows = await db
    .select({ org: organizationsTable, member: organizationMembersTable })
    .from(organizationMembersTable)
    .innerJoin(
      organizationsTable,
      eq(organizationMembersTable.orgId, organizationsTable.id),
    )
    .where(
      and(
        eq(organizationMembersTable.userId, userId),
        eq(organizationMembersTable.status, "active"),
        eq(organizationMembersTable.role, "admin"),
      ),
    )
    .orderBy(desc(organizationsTable.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export interface OrgMemberWithDevices {
  userId: string;
  email: string | null;
  role: string;
  status: string;
  joinedAt: string;
  devices: Array<{
    deviceId: string;
    deviceName: string | null;
    os: string | null;
    firstActivatedAt: string;
    lastSeenAt: string;
  }>;
}

export interface OrgSummary {
  id: number;
  name: string;
  planName: string;
  status: string;
  maxSeats: number;
  seatsUsed: number;
  seatsAvailable: number;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  subscriptionActive: boolean;
  isOwner: boolean;
  members: OrgMemberWithDevices[];
  pendingInvites: Array<{
    id: number;
    email: string;
    role: string;
    invitedBy: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

/** Builds the full admin-console view for an org the caller administers. */
export async function getOrgSummaryForAdmin(
  userId: string,
  now: Date = new Date(),
): Promise<OrgSummary | null> {
  const admin = await getAdminOrg(userId);
  if (!admin) return null;
  const { org } = admin;

  const memberRows = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.orgId, org.id),
        eq(organizationMembersTable.status, "active"),
      ),
    )
    .orderBy(organizationMembersTable.joinedAt);

  const memberIds = memberRows.map((m) => m.userId);
  let deviceRows: Device[] = [];
  if (memberIds.length > 0) {
    deviceRows = await db
      .select()
      .from(devicesTable)
      .where(sql`${devicesTable.userId} = ANY(${memberIds})`);
  }

  const members: OrgMemberWithDevices[] = memberRows.map((m) => ({
    userId: m.userId,
    email: m.email,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
    devices: deviceRows
      .filter((d) => d.userId === m.userId)
      .map((d) => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        os: d.os,
        firstActivatedAt: d.firstActivatedAt.toISOString(),
        lastSeenAt: d.lastSeenAt.toISOString(),
      })),
  }));

  const inviteRows = await db
    .select()
    .from(organizationInvitesTable)
    .where(
      and(
        eq(organizationInvitesTable.orgId, org.id),
        eq(organizationInvitesTable.status, "pending"),
        sql`${organizationInvitesTable.expiresAt} > ${now}`,
      ),
    )
    .orderBy(desc(organizationInvitesTable.createdAt));

  const used = await seatsUsed(org.id, now);

  return {
    id: org.id,
    name: org.name,
    planName: org.planName,
    status: org.status,
    maxSeats: org.maxSeats,
    seatsUsed: used,
    seatsAvailable: Math.max(0, org.maxSeats - used),
    subscriptionStartDate: org.subscriptionStartDate.toISOString(),
    subscriptionEndDate: org.subscriptionEndDate.toISOString(),
    subscriptionActive:
      org.status === "active" &&
      org.subscriptionEndDate.getTime() > now.getTime(),
    isOwner: org.ownerUserId === userId,
    members,
    pendingInvites: inviteRows.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: i.invitedBy,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    })),
  };
}

// ─── Org provisioning (called by billing webhook) ─────────────────────────────

export interface CreateOrgParams {
  name: string;
  ownerUserId: string;
  ownerEmail?: string | null;
  planName: string;
  maxSeats: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
}

/**
 * Creates an organization and seeds the buyer as its admin. Idempotent on the
 * Stripe subscription id: if an org already exists for that subscription it is
 * extended/updated instead of duplicated.
 */
export async function createOrganizationWithOwner(
  params: CreateOrgParams,
): Promise<Organization> {
  const now = new Date();

  if (params.stripeSubscriptionId) {
    const [existing] = await db
      .select()
      .from(organizationsTable)
      .where(
        eq(
          organizationsTable.stripeSubscriptionId,
          params.stripeSubscriptionId,
        ),
      )
      .limit(1);
    if (existing) {
      const [updated] = await db
        .update(organizationsTable)
        .set({
          maxSeats: params.maxSeats,
          status: "active",
          subscriptionEndDate: params.subscriptionEndDate,
          updatedAt: now,
        })
        .where(eq(organizationsTable.id, existing.id))
        .returning();
      return updated ?? existing;
    }
  }

  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizationsTable)
      .values({
        name: params.name,
        ownerUserId: params.ownerUserId,
        planName: params.planName,
        status: "active",
        maxSeats: params.maxSeats,
        stripeCustomerId: params.stripeCustomerId ?? null,
        stripeSubscriptionId: params.stripeSubscriptionId ?? null,
        subscriptionStartDate: params.subscriptionStartDate,
        subscriptionEndDate: params.subscriptionEndDate,
      })
      .returning();
    if (!org) throw new Error("Failed to create organization");

    await tx
      .insert(organizationMembersTable)
      .values({
        orgId: org.id,
        userId: params.ownerUserId,
        email: params.ownerEmail ? normalizeEmail(params.ownerEmail) : null,
        role: "admin",
        status: "active",
      })
      .onConflictDoUpdate({
        target: [
          organizationMembersTable.orgId,
          organizationMembersTable.userId,
        ],
        set: { role: "admin", status: "active", updatedAt: now },
      });

    return org;
  });
}

/** Extends an org's subscription window (renewal via invoice.paid). */
export async function extendOrgSubscription(
  stripeSubscriptionId: string,
  newEnd: Date,
  maxSeats?: number,
  now: Date = new Date(),
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  if (!org) return null;
  const [updated] = await db
    .update(organizationsTable)
    .set({
      subscriptionEndDate: newEnd,
      status: "active",
      ...(maxSeats !== undefined ? { maxSeats } : {}),
      updatedAt: now,
    })
    .where(eq(organizationsTable.id, org.id))
    .returning();
  return updated ?? org;
}

// ─── Invites ──────────────────────────────────────────────────────────────────

export type InviteError =
  | "no_org"
  | "seats_full"
  | "already_member"
  | "already_invited";

export interface InviteResult {
  invite: OrganizationInvite;
  rawToken: string;
  org: Organization;
}

export type InviteOutcome =
  | { ok: true; result: InviteResult }
  | { ok: false; error: InviteError };

/**
 * Admin invites an email address to their org. Reserves a seat (active members
 * + pending invites must stay within `maxSeats`). The raw token is returned for
 * the email link and never persisted.
 */
export async function inviteMember(
  adminUserId: string,
  email: string,
  role: OrgRole = "member",
  now: Date = new Date(),
): Promise<InviteOutcome> {
  const admin = await getAdminOrg(adminUserId);
  if (!admin) return { ok: false, error: "no_org" };
  const { org } = admin;
  const normEmail = normalizeEmail(email);

  // Already an active member with this email?
  const existingMember = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.orgId, org.id),
        eq(organizationMembersTable.email, normEmail),
        eq(organizationMembersTable.status, "active"),
      ),
    )
    .limit(1);
  if (existingMember[0]) return { ok: false, error: "already_member" };

  // Already a pending invite for this email?
  const existingInvite = await db
    .select()
    .from(organizationInvitesTable)
    .where(
      and(
        eq(organizationInvitesTable.orgId, org.id),
        eq(organizationInvitesTable.email, normEmail),
        eq(organizationInvitesTable.status, "pending"),
        sql`${organizationInvitesTable.expiresAt} > ${now}`,
      ),
    )
    .limit(1);
  if (existingInvite[0]) return { ok: false, error: "already_invited" };

  const used = await seatsUsed(org.id, now);
  if (used >= org.maxSeats) return { ok: false, error: "seats_full" };

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_DAYS * MS_PER_DAY);

  const [invite] = await db
    .insert(organizationInvitesTable)
    .values({
      orgId: org.id,
      email: normEmail,
      role,
      tokenHash,
      status: "pending",
      invitedBy: adminUserId,
      expiresAt,
    })
    .returning();
  if (!invite) throw new Error("Failed to create invite");

  return { ok: true, result: { invite, rawToken, org } };
}

export type RevokeInviteError = "no_org" | "invite_not_found";
export type RevokeInviteOutcome =
  | { ok: true }
  | { ok: false; error: RevokeInviteError };

export async function revokeInvite(
  adminUserId: string,
  inviteId: number,
  now: Date = new Date(),
): Promise<RevokeInviteOutcome> {
  const admin = await getAdminOrg(adminUserId);
  if (!admin) return { ok: false, error: "no_org" };
  const updated = await db
    .update(organizationInvitesTable)
    .set({ status: "revoked", updatedAt: now })
    .where(
      and(
        eq(organizationInvitesTable.id, inviteId),
        eq(organizationInvitesTable.orgId, admin.org.id),
        eq(organizationInvitesTable.status, "pending"),
      ),
    )
    .returning();
  if (updated.length === 0) return { ok: false, error: "invite_not_found" };
  return { ok: true };
}

export type AcceptError =
  | "invalid_token"
  | "expired"
  | "revoked"
  | "email_mismatch"
  | "org_inactive"
  | "seats_full";

export interface AcceptResult {
  org: Organization;
  role: string;
}

export type AcceptOutcome =
  | { ok: true; result: AcceptResult }
  | { ok: false; error: AcceptError };

/**
 * An invited user accepts their invite. The logged-in user's primary email must
 * match the invited email (case-insensitive) so a forwarded link can't be
 * redeemed by the wrong account. Idempotent for an already-active member.
 */
export async function acceptInvite(
  rawToken: string,
  userId: string,
  userEmail: string | null,
  now: Date = new Date(),
): Promise<AcceptOutcome> {
  const tokenHash = hashInviteToken(rawToken);
  const [invite] = await db
    .select()
    .from(organizationInvitesTable)
    .where(eq(organizationInvitesTable.tokenHash, tokenHash))
    .limit(1);
  if (!invite) return { ok: false, error: "invalid_token" };
  if (invite.status === "revoked") return { ok: false, error: "revoked" };
  if (invite.status === "accepted") {
    // Idempotent: surface the org if this user already redeemed it.
    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, invite.orgId))
      .limit(1);
    if (org && invite.acceptedByUserId === userId) {
      return { ok: true, result: { org, role: invite.role } };
    }
    return { ok: false, error: "revoked" };
  }
  if (invite.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: "expired" };
  }
  if (
    !userEmail ||
    normalizeEmail(userEmail) !== normalizeEmail(invite.email)
  ) {
    return { ok: false, error: "email_mismatch" };
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, invite.orgId))
    .limit(1);
  if (
    !org ||
    org.status !== "active" ||
    org.subscriptionEndDate.getTime() <= now.getTime()
  ) {
    return { ok: false, error: "org_inactive" };
  }

  return db.transaction(async (tx) => {
    // Re-check seats inside the tx (excluding this very invite, which we are
    // about to consume).
    const [memberCount] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.orgId, org.id),
          eq(organizationMembersTable.status, "active"),
        ),
      );
    const [pendingCount] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(organizationInvitesTable)
      .where(
        and(
          eq(organizationInvitesTable.orgId, org.id),
          eq(organizationInvitesTable.status, "pending"),
          ne(organizationInvitesTable.id, invite.id),
          sql`${organizationInvitesTable.expiresAt} > ${now}`,
        ),
      );
    const alreadyActive = await tx
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.orgId, org.id),
          eq(organizationMembersTable.userId, userId),
          eq(organizationMembersTable.status, "active"),
        ),
      )
      .limit(1);

    const used = (memberCount?.n ?? 0) + (pendingCount?.n ?? 0);
    if (!alreadyActive[0] && used >= org.maxSeats) {
      return { ok: false, error: "seats_full" as const };
    }

    await tx
      .insert(organizationMembersTable)
      .values({
        orgId: org.id,
        userId,
        email: normalizeEmail(invite.email),
        role: invite.role,
        status: "active",
      })
      .onConflictDoUpdate({
        target: [
          organizationMembersTable.orgId,
          organizationMembersTable.userId,
        ],
        set: {
          status: "active",
          role: invite.role,
          email: normalizeEmail(invite.email),
          updatedAt: now,
        },
      });

    await tx
      .update(organizationInvitesTable)
      .set({
        status: "accepted",
        acceptedAt: now,
        acceptedByUserId: userId,
        updatedAt: now,
      })
      .where(eq(organizationInvitesTable.id, invite.id));

    return { ok: true as const, result: { org, role: invite.role } };
  });
}

// ─── Member removal ───────────────────────────────────────────────────────────

export type RemoveMemberError =
  | "no_org"
  | "member_not_found"
  | "cannot_remove_owner";
export type RemoveMemberOutcome =
  | { ok: true }
  | { ok: false; error: RemoveMemberError };

/**
 * Admin removes a member, freeing their seat. The owner cannot be removed. The
 * member's device rows are deleted so freed seats don't leave dangling devices.
 */
export async function removeMember(
  adminUserId: string,
  targetUserId: string,
  now: Date = new Date(),
): Promise<RemoveMemberOutcome> {
  const admin = await getAdminOrg(adminUserId);
  if (!admin) return { ok: false, error: "no_org" };
  const { org } = admin;
  if (targetUserId === org.ownerUserId) {
    return { ok: false, error: "cannot_remove_owner" };
  }

  const updated = await db
    .update(organizationMembersTable)
    .set({ status: "removed", updatedAt: now })
    .where(
      and(
        eq(organizationMembersTable.orgId, org.id),
        eq(organizationMembersTable.userId, targetUserId),
        eq(organizationMembersTable.status, "active"),
      ),
    )
    .returning();
  if (updated.length === 0) return { ok: false, error: "member_not_found" };

  // Free up their devices so the seat is fully reclaimed.
  await db.delete(devicesTable).where(eq(devicesTable.userId, targetUserId));

  return { ok: true };
}

// ─── Device activation / deactivation (team members) ──────────────────────────

export type ActivateDeviceError = "no_membership" | "max_devices_reached";
export interface ActivateDeviceResult {
  deviceId: string;
  devicesUsed: number;
  devicesAllowed: number;
}
export type ActivateDeviceOutcome =
  | { ok: true; result: ActivateDeviceResult }
  | { ok: false; error: ActivateDeviceError };

/**
 * Binds a device for a team member (no product key needed). Members may bind up
 * to MAX_DEVICES_PER_MEMBER distinct devices; re-binding an existing device just
 * bumps lastSeen and never counts against the cap.
 */
export async function activateOrgDevice(
  userId: string,
  deviceId: string,
  deviceName: string | null,
  os: string | null,
  now: Date = new Date(),
): Promise<ActivateDeviceOutcome> {
  const membership = await getActiveOrgMembership(userId, now);
  if (!membership) return { ok: false, error: "no_membership" };

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(devicesTable)
      .where(
        and(
          eq(devicesTable.userId, userId),
          eq(devicesTable.deviceId, deviceId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      const [count] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(devicesTable)
        .where(eq(devicesTable.userId, userId));
      if ((count?.n ?? 0) >= MAX_DEVICES_PER_MEMBER) {
        return { ok: false as const, error: "max_devices_reached" as const };
      }
    }

    await tx
      .insert(devicesTable)
      .values({ deviceId, userId, deviceName, os })
      .onConflictDoUpdate({
        target: devicesTable.deviceId,
        set: { lastSeenAt: now, deviceName, os },
      });

    const [used] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(devicesTable)
      .where(eq(devicesTable.userId, userId));

    return {
      ok: true as const,
      result: {
        deviceId,
        devicesUsed: used?.n ?? 1,
        devicesAllowed: MAX_DEVICES_PER_MEMBER,
      },
    };
  });
}

export type DeactivateDeviceError = "no_org" | "device_not_found";
export type DeactivateOrgDeviceOutcome =
  | { ok: true }
  | { ok: false; error: DeactivateDeviceError };

/** Admin deactivates (deletes) a device belonging to a member of their org. */
export async function deactivateOrgDevice(
  adminUserId: string,
  targetUserId: string,
  deviceId: string,
): Promise<DeactivateOrgDeviceOutcome> {
  const admin = await getAdminOrg(adminUserId);
  if (!admin) return { ok: false, error: "no_org" };

  // Confirm the target is a member of the admin's org.
  const [member] = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.orgId, admin.org.id),
        eq(organizationMembersTable.userId, targetUserId),
        eq(organizationMembersTable.status, "active"),
      ),
    )
    .limit(1);
  if (!member) return { ok: false, error: "device_not_found" };

  const deleted = await db
    .delete(devicesTable)
    .where(
      and(eq(devicesTable.userId, targetUserId), eq(devicesTable.deviceId, deviceId)),
    )
    .returning();
  if (deleted.length === 0) return { ok: false, error: "device_not_found" };
  return { ok: true };
}
