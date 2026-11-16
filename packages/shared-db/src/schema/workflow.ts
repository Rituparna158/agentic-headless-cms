import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { actorTypeEnum } from './enums.js';
import { applications, users } from './identity.js';
import { schemas, contentEntries } from './content.js';
import type { WorkflowStage, WorkflowTransition } from '@repo/types';

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  applicationId: uuid('application_id')
    .notNull()
    .default(sql`current_setting('app.current_application_id', true)::uuid`)
    .references(() => applications.id, { onDelete: 'cascade' }),
  isDefault: boolean('is_default').notNull().default(false),
  stages: jsonb('stages').$type<WorkflowStage[]>().notNull(),
  transitions: jsonb('transitions').$type<WorkflowTransition[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const schemaWorkflows = pgTable(
  'schema_workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    schemaId: uuid('schema_id')
      .notNull()
      .references(() => schemas.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .default(sql`current_setting('app.current_application_id', true)::uuid`)
      .references(() => applications.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    appSchemaUnique: unique('schema_workflows_app_schema_unique').on(
      table.applicationId,
      table.schemaId,
    ),
    workflowIdx: index('schema_workflows_workflow_idx').on(table.workflowId),
  }),
);

export const contentWorkflowStates = pgTable(
  'content_workflow_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    currentStage: varchar('current_stage', { length: 100 }).notNull(),
    applicationId: uuid('application_id')
      .notNull()
      .default(sql`current_setting('app.current_application_id', true)::uuid`)
      .references(() => applications.id, { onDelete: 'cascade' }),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id, {
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
    entryUnique: unique('content_workflow_states_entry_unique').on(
      table.applicationId,
      table.entryId,
    ),
  }),
);

export const workflowHistories = pgTable(
  'workflow_histories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    fromStage: varchar('from_stage', { length: 100 }).notNull(),
    toStage: varchar('to_stage', { length: 100 }).notNull(),
    action: varchar('action', { length: 100 }),
    comment: text('comment'),
    actorType: actorTypeEnum('actor_type').notNull().default('user'),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    applicationId: uuid('application_id')
      .notNull()
      .default(sql`current_setting('app.current_application_id', true)::uuid`)
      .references(() => applications.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryIdx: index('workflow_histories_entry_idx').on(
      table.applicationId,
      table.entryId,
    ),
  }),
);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  application: one(applications, {
    fields: [workflows.applicationId],
    references: [applications.id],
  }),
  schemaWorkflows: many(schemaWorkflows),
}));

export const schemaWorkflowsRelations = relations(
  schemaWorkflows,
  ({ one }) => ({
    workflow: one(workflows, {
      fields: [schemaWorkflows.workflowId],
      references: [workflows.id],
    }),
    schema: one(schemas, {
      fields: [schemaWorkflows.schemaId],
      references: [schemas.id],
    }),
    application: one(applications, {
      fields: [schemaWorkflows.applicationId],
      references: [applications.id],
    }),
  }),
);

export const contentWorkflowStatesRelations = relations(
  contentWorkflowStates,
  ({ one }) => ({
    entry: one(contentEntries, {
      fields: [contentWorkflowStates.entryId],
      references: [contentEntries.id],
    }),
    workflow: one(workflows, {
      fields: [contentWorkflowStates.workflowId],
      references: [workflows.id],
    }),
    user: one(users, {
      fields: [contentWorkflowStates.updatedByUserId],
      references: [users.id],
    }),
  }),
);

export const workflowHistoriesRelations = relations(
  workflowHistories,
  ({ one }) => ({
    entry: one(contentEntries, {
      fields: [workflowHistories.entryId],
      references: [contentEntries.id],
    }),
    workflow: one(workflows, {
      fields: [workflowHistories.workflowId],
      references: [workflows.id],
    }),
    actorUser: one(users, {
      fields: [workflowHistories.actorUserId],
      references: [users.id],
    }),
  }),
);
