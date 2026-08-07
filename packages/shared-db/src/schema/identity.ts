import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  mfaResetRequestStatusEnum,
  tokenTypeEnum,
  userStatusEnum,
} from './enums.js';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  mfaRequired: boolean('mfa_required').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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

// Multi-role support — a user can be Editor via one role and Reviewer via
// another, rather than being pinned to a single role.
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
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

// Unified credential table for both human API keys and agent tokens — they
// were structurally identical as two separate tables, which is duplication,
// not "AI-ready" design. `type` discriminates; Phase 2 just starts writing
// rows with type = 'agent'.
export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
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

// The agent as an actor, distinct from its credential — one agent can hold
// several tokens over its lifetime, and audit/version history attributes
// changes to the agent, not to whichever token happened to be used.
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
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

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  apiTokens: many(apiTokens),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  identities: many(userIdentities),
  apiTokens: many(apiTokens),
  mfaResetRequests: many(mfaResetRequests),
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
    }),
    admin: one(users, {
      fields: [mfaResetRequests.adminId],
      references: [users.id],
    }),
  }),
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, { fields: [userIdentities.userId], references: [users.id] }),
}));

export const apiTokensRelations = relations(apiTokens, ({ one, many }) => ({
  role: one(roles, { fields: [apiTokens.roleId], references: [roles.id] }),
  creator: one(users, {
    fields: [apiTokens.createdBy],
    references: [users.id],
  }),
  agentsDefaultingToThisToken: many(agents),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  defaultToken: one(apiTokens, {
    fields: [agents.defaultTokenId],
    references: [apiTokens.id],
  }),
}));
