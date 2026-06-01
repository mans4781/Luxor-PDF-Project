import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Membership of a Clerk user in an organization. One row per (org, user). The
 * `role` is `admin` (can invite/remove members and deactivate devices) or
 * `member`. `status` is `active` or `removed`; removing a member frees a seat
 * but keeps the row for audit. `email` is the lowercased address the member was
 * invited as.
 */
export const organizationMembersTable = pgTable(
  "organization_members",
  {
    orgId: integer("org_id").notNull(),
    userId: text("user_id").notNull(),
    email: text("email"),
    role: text("role").notNull().default("member"),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.orgId, t.userId] }),
    index("organization_members_user_id_idx").on(t.userId),
    index("organization_members_org_status_idx").on(t.orgId, t.status),
  ],
);

export type OrganizationMember = typeof organizationMembersTable.$inferSelect;
export type InsertOrganizationMember =
  typeof organizationMembersTable.$inferInsert;
