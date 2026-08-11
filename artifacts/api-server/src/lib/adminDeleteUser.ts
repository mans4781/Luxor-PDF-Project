import { eq, inArray, or, sql } from "drizzle-orm";
import {
  db,
  userLicensesTable,
  dailyUsageTable,
  monthlyUsageTable,
  licenseEventsTable,
  licensesTable,
  devicesTable,
  organizationsTable,
  organizationMembersTable,
  organizationInvitesTable,
  paymentsTable,
  welcomeEmailsTable,
  esignWaitlistTable,
  ticketsTable,
  developersTable,
} from "@workspace/db";
import { clerkClient } from "@clerk/express";
import { logger } from "./logger";

/** Thrown when the target account is a protected developer/admin account. */
export class ProtectedUserError extends Error {
  constructor() {
    super("Developer accounts cannot be deleted from the admin console");
  }
}

/**
 * Permanently delete a user: their Clerk account and every row of data we
 * hold about them. After this, the email can sign up again as a brand-new
 * account. The DB purge runs in a single transaction and every step is
 * idempotent, so the endpoint can be retried safely if the Clerk deletion
 * fails after the purge.
 */
export async function adminDeleteUser(
  userId: string,
): Promise<{ clerkDeleted: boolean; emails: string[] }> {
  // Snapshot the account's email addresses first (needed to purge the
  // email-keyed tables). Tolerate an already-deleted Clerk account.
  let emails: string[] = [];
  let clerkUserExists = false;
  try {
    const u = await clerkClient.users.getUser(userId);
    clerkUserExists = true;
    emails = u.emailAddresses
      .map((e) => e.emailAddress.trim().toLowerCase())
      .filter(Boolean);
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status !== 404) throw err;
  }

  // Fail-closed developer protection: check the snapshot emails directly
  // against the developers table (no cache — an irreversible delete must
  // never rely on a stale negative cache entry).
  if (emails.length > 0) {
    const devRows = await db
      .select({ email: developersTable.email })
      .from(developersTable);
    const devEmails = new Set(devRows.map((r) => r.email.trim().toLowerCase()));
    if (emails.some((e) => devEmails.has(e))) {
      throw new ProtectedUserError();
    }
  }

  await db.transaction(async (tx) => {
    // Organizations this user owns: remove the whole org (members + invites).
    const ownedOrgs = await tx
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.ownerUserId, userId));
    const orgIds = ownedOrgs.map((o) => o.id);
    if (orgIds.length > 0) {
      await tx
        .delete(organizationInvitesTable)
        .where(inArray(organizationInvitesTable.orgId, orgIds));
      await tx
        .delete(organizationMembersTable)
        .where(inArray(organizationMembersTable.orgId, orgIds));
      await tx.delete(organizationsTable).where(inArray(organizationsTable.id, orgIds));
    }

    // Invites tied to this user in other orgs: ones they accepted, ones they
    // sent, and (below) ones addressed to their email.
    await tx
      .delete(organizationInvitesTable)
      .where(
        or(
          eq(organizationInvitesTable.acceptedByUserId, userId),
          eq(organizationInvitesTable.invitedBy, userId),
        ),
      );

    // User-id keyed rows.
    await tx.delete(organizationMembersTable).where(eq(organizationMembersTable.userId, userId));
    await tx.delete(devicesTable).where(eq(devicesTable.userId, userId));
    await tx.delete(licensesTable).where(eq(licensesTable.userId, userId));
    await tx.delete(licenseEventsTable).where(eq(licenseEventsTable.userId, userId));
    await tx.delete(dailyUsageTable).where(eq(dailyUsageTable.userId, userId));
    await tx.delete(monthlyUsageTable).where(eq(monthlyUsageTable.userId, userId));
    await tx.delete(paymentsTable).where(eq(paymentsTable.userId, userId));
    await tx.delete(welcomeEmailsTable).where(eq(welcomeEmailsTable.userId, userId));
    await tx.delete(esignWaitlistTable).where(eq(esignWaitlistTable.userId, userId));
    await tx.delete(userLicensesTable).where(eq(userLicensesTable.userId, userId));

    // Raw-SQL tables that have no drizzle schema export.
    await tx.execute(sql`DELETE FROM developer_verifications WHERE user_id = ${userId}`);
    await tx.execute(sql`DELETE FROM billing_events WHERE user_id = ${userId}`);

    // Email-keyed rows (support tickets, invites addressed to this email).
    for (const email of emails) {
      await tx.delete(ticketsTable).where(sql`lower(${ticketsTable.email}) = ${email}`);
      await tx
        .delete(organizationInvitesTable)
        .where(sql`lower(${organizationInvitesTable.email}) = ${email}`);
    }
  });

  // Finally remove the Clerk account so the login itself is gone. If this
  // fails, the whole call can simply be retried (the purge is idempotent).
  let clerkDeleted = false;
  if (clerkUserExists) {
    await clerkClient.users.deleteUser(userId);
    clerkDeleted = true;
  }

  logger.info({ userId, emails, clerkDeleted }, "Admin permanently deleted user");
  return { clerkDeleted, emails };
}
