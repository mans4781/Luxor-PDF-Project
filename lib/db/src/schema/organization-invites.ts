import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * A pending invitation for an email address to join an organization. The raw
 * invite token is NEVER stored — only its SHA-256 hash (`tokenHash`, unique).
 * The raw token is embedded once in the invite email's accept link. `status`
 * moves pending → accepted | revoked | expired.
 */
export const organizationInvitesTable = pgTable(
  "organization_invites",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status").notNull().default("pending"),
    invitedBy: text("invited_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByUserId: text("accepted_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("organization_invites_org_id_idx").on(t.orgId),
    index("organization_invites_email_idx").on(t.email),
    index("organization_invites_org_status_idx").on(t.orgId, t.status),
  ],
);

export type OrganizationInvite = typeof organizationInvitesTable.$inferSelect;
export type InsertOrganizationInvite =
  typeof organizationInvitesTable.$inferInsert;
