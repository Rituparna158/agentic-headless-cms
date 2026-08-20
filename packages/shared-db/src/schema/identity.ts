import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import {
  appAccessStatusEnum,
  mfaResetRequestStatusEnum,
  tokenTypeEnum,
  userStatusEnum,
} from './enums.js';
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  apiKeyHash: varchar('api_key_hash', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull().default('CLIENT_APP'), // SYSTEM_DASHBOARD or CLIENT_APP
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    applicationId: uuid('application_id')
      .notNull()
      .default(sql`current_setting('app.current_application_id', true)::uuid`)
      .references(() => applications.id, { onDelete: 'cascade' }),
    description: text('description'),
    mfaRequired: boolean('mfa_required').notNull().default(false),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameAppUnique: unique('roles_name_application_unique').on(
      table.name,
      table.applicationId,
    ),
  }),
);
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
  status: userStatusEnum('status').notNull().default('invited'),
  inviteTokenHash: varchar('invite_token_hash', { length: 255 }),
  inviteExpiresAt: timestamp('invite_expires_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const mfaResetRequests = pgTable('mfa_reset_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sourceApp: varchar('source_app', { length: 255 }),
  status: mfaResetRequestStatusEnum('status').notNull().default('pending'),
  adminId: uuid('admin_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  tokenHash: varchar('token_hash', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const passwordResetRequests = pgTable('password_reset_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const userApplications = pgTable(
  'user_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .default(sql`current_setting('app.current_application_id', true)::uuid`)
      .references(() => applications.id, { onDelete: 'cascade' }),
    status: appAccessStatusEnum('status').notNull().default('invited'),
    grantedBy: uuid('granted_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userAppUnique: unique('user_applications_user_application_unique').on(
      table.userId,
      table.applicationId,
    ),
  }),
);
// Multi-role support — a user can be Editor via one role and Reviewer via
// another, rather than being pinned to a single role.
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userApplicationId: uuid('user_application_id')
      .notNull()
      .references(() => userApplications.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userAppRoleUnique: uniqueIndex('user_roles_user_app_role_unique').on(
      table.userApplicationId,
      table.roleId,
    ),
  }),
);
export const userIdentities = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 100 }).notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerUnique: unique('user_identities_provider_unique').on(
      table.provider,
      table.providerUserId,
    ),
  }),
);
export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .default(sql`current_setting('app.current_application_id', true)::uuid`)
    .references(() => applications.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: tokenTypeEnum('type').notNull().default('user'),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  scopes: jsonb('scopes'),
  rateLimitConfig: jsonb('rate_limit_config'),
  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .default(sql`current_setting('app.current_application_id', true)::uuid`)
    .references(() => applications.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  modelProvider: varchar('model_provider', { length: 100 }),
  defaultTokenId: uuid('default_token_id').references(() => apiTokens.id, {
    onDelete: 'set null',
  }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const applicationsRelations = relations(applications, ({ many }) => ({
  roles: many(roles),
  userApplications: many(userApplications),
  apiTokens: many(apiTokens),
  agents: many(agents),
}));
export const rolesRelations = relations(roles, ({ one, many }) => ({
  application: one(applications, {
    fields: [roles.applicationId],
    references: [applications.id],
  }),
  userRoles: many(userRoles),
  apiTokens: many(apiTokens),
}));
export const usersRelations = relations(users, ({ many }) => ({
  userApplications: many(userApplications, {
    relationName: 'userApplications',
  }),
  identities: many(userIdentities),
  apiTokens: many(apiTokens),
  mfaResetRequests: many(mfaResetRequests, {
    relationName: 'userMfaResetRequests',
  }),
  passwordResetRequests: many(passwordResetRequests),
}));
export const passwordResetRequestsRelations = relations(
  passwordResetRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetRequests.userId],
      references: [users.id],
    }),
  }),
);
export const mfaResetRequestsRelations = relations(
  mfaResetRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [mfaResetRequests.userId],
      references: [users.id],
      relationName: 'userMfaResetRequests',
    }),
    admin: one(users, {
      fields: [mfaResetRequests.adminId],
      references: [users.id],
      relationName: 'adminMfaResetRequests',
    }),
  }),
);
export const userApplicationsRelations = relations(
  userApplications,
  ({ one, many }) => ({
    application: one(applications, {
      fields: [userApplications.applicationId],
      references: [applications.id],
    }),
    user: one(users, {
      fields: [userApplications.userId],
      references: [users.id],
      relationName: 'userApplications',
    }),
    grantedByUser: one(users, {
      fields: [userApplications.grantedBy],
      references: [users.id],
      relationName: 'grantedUserApplications',
    }),
    userRoles: many(userRoles),
  }),
);
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  userApplication: one(userApplications, {
    fields: [userRoles.userApplicationId],
    references: [userApplications.id],
  }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
  creator: one(users, {
    fields: [userRoles.createdBy],
    references: [users.id],
  }),
}));
export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, { fields: [userIdentities.userId], references: [users.id] }),
}));
export const apiTokensRelations = relations(apiTokens, ({ one, many }) => ({
  application: one(applications, {
    fields: [apiTokens.applicationId],
    references: [applications.id],
  }),
  role: one(roles, { fields: [apiTokens.roleId], references: [roles.id] }),
  creator: one(users, {
    fields: [apiTokens.createdBy],
    references: [users.id],
  }),
  agentsDefaultingToThisToken: many(agents),
}));
export const agentsRelations = relations(agents, ({ one }) => ({
  application: one(applications, {
    fields: [agents.applicationId],
    references: [applications.id],
  }),
  defaultToken: one(apiTokens, {
    fields: [agents.defaultTokenId],
    references: [apiTokens.id],
  }),
}));
