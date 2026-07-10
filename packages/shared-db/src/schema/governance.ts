import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { actorTypeEnum, approvalStatusEnum, auditActionEnum } from './enums.js';
import { contentEntries, contentVersions } from './content.js';
import { agents, apiTokens, users } from './identity.js';

export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => contentEntries.id, { onDelete: 'cascade' }),
  proposedVersionId: uuid('proposed_version_id')
    .notNull()
    .references(() => contentVersions.id, { onDelete: 'cascade' }),
  actorType: actorTypeEnum('proposed_by_type').notNull(),
  proposedByUserId: uuid('proposed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  proposedByAgentId: uuid('proposed_by_agent_id').references(() => agents.id, {
    onDelete: 'set null',
  }),
  status: approvalStatusEnum('status').notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// The differentiator's foundation (FR-AG-6/7): immutable, attributable log of every
// human or agent write. Enforce immutability at the DB grant level (revoke UPDATE/DELETE
// on this table for the application role) — this schema alone doesn't guarantee it.
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorType: actorTypeEnum('actor_type').notNull(),
  actorUserId: uuid('actor_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  actorAgentId: uuid('actor_agent_id').references(() => agents.id, {
    onDelete: 'set null',
  }),
  action: auditActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id').notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  revertedByLogId: uuid('reverted_by_log_id').references(
    (): AnyPgColumn => auditLogs.id,
    {
      onDelete: 'set null',
    },
  ),
  // ip, token id, MCP tool name, prompt reference, etc. — kept as one flexible
  // bag rather than a single ip_address column so it covers whatever context
  // the write path actually has available.
  context: jsonb('context'),
  timestamp: timestamp('timestamp', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// The underlying LLM call: what was asked, what came back, which
// provider/model, what it cost. One agent turn may span zero or more of
// these (a rule-based automation might invoke tools with no LLM call at all).
export const agentInteractions = pgTable('agent_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentTokenId: uuid('agent_token_id')
    .notNull()
    .references(() => apiTokens.id, { onDelete: 'cascade' }),
  auditLogId: uuid('audit_log_id').references(() => auditLogs.id, {
    onDelete: 'set null',
  }),
  promptText: text('prompt_text'),
  responseText: text('response_text'),
  provider: varchar('provider', { length: 100 }),
  model: varchar('model', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// The resulting tool/MCP invocation — distinct from agent_interactions
// because one LLM call can trigger multiple tool calls, and this is the
// table that records FR-AG-4's "invalid writes are rejected with structured
// errors" outcome directly (validated / rejected_reason), rather than that
// living only implicitly in audit_logs.
export const agentOperations = pgTable('agent_operations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').references(() => agents.id, {
    onDelete: 'set null',
  }),
  tokenId: uuid('token_id').references(() => apiTokens.id, {
    onDelete: 'set null',
  }),
  toolName: varchar('tool_name', { length: 255 }).notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  validated: boolean('validated').notNull().default(false),
  rejectedReason: text('rejected_reason'),
  entryId: uuid('entry_id').references(() => contentEntries.id, {
    onDelete: 'set null',
  }),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 1000 }).notNull(),
  events: jsonb('events').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  secretKey: varchar('secret_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Fixes the missing delivery/retry visibility gap.
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id')
    .notNull()
    .references(() => webhooks.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  responseStatus: integer('response_status'),
  attempt: integer('attempt').notNull().default(1),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvalsRelations = relations(approvals, ({ one }) => ({
  entry: one(contentEntries, {
    fields: [approvals.entryId],
    references: [contentEntries.id],
  }),
  proposedVersion: one(contentVersions, {
    fields: [approvals.proposedVersionId],
    references: [contentVersions.id],
  }),
  proposedByUser: one(users, {
    fields: [approvals.proposedByUserId],
    references: [users.id],
  }),
  proposedByAgent: one(agents, {
    fields: [approvals.proposedByAgentId],
    references: [agents.id],
  }),
  reviewer: one(users, {
    fields: [approvals.reviewedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actorUser: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
  actorAgent: one(agents, {
    fields: [auditLogs.actorAgentId],
    references: [agents.id],
  }),
  revertedBy: one(auditLogs, {
    fields: [auditLogs.revertedByLogId],
    references: [auditLogs.id],
  }),
}));

export const agentInteractionsRelations = relations(
  agentInteractions,
  ({ one }) => ({
    agentToken: one(apiTokens, {
      fields: [agentInteractions.agentTokenId],
      references: [apiTokens.id],
    }),
    auditLog: one(auditLogs, {
      fields: [agentInteractions.auditLogId],
      references: [auditLogs.id],
    }),
  }),
);

export const agentOperationsRelations = relations(
  agentOperations,
  ({ one }) => ({
    agent: one(agents, {
      fields: [agentOperations.agentId],
      references: [agents.id],
    }),
    token: one(apiTokens, {
      fields: [agentOperations.tokenId],
      references: [apiTokens.id],
    }),
    entry: one(contentEntries, {
      fields: [agentOperations.entryId],
      references: [contentEntries.id],
    }),
  }),
);

export const webhooksRelations = relations(webhooks, ({ many }) => ({
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(
  webhookDeliveries,
  ({ one }) => ({
    webhook: one(webhooks, {
      fields: [webhookDeliveries.webhookId],
      references: [webhooks.id],
    }),
  }),
);
