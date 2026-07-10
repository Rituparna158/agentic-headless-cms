import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  actorTypeEnum,
  relationKindEnum,
  schemaStatusEnum,
  schemaTypeEnum,
  versionStatusEnum,
} from './enums.js';
import { agents, users } from './identity.js';

export const schemas = pgTable('schemas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  type: schemaTypeEnum('type').notNull(),
  definition: jsonb('definition').notNull(),
  status: schemaStatusEnum('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Normalized projection of `schemas.definition`, kept in sync whenever the
// definition changes. The JSONB definition stays the schema-as-code source
// of truth (diffable, version-controlled); this table exists so permission
// checks, relation integrity, and "which schemas have a field of type X"
// queries don't require parsing JSON on every request.
export const fields = pgTable(
  'fields',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schemaId: uuid('schema_id')
      .notNull()
      .references(() => schemas.id, { onDelete: 'cascade' }),
    apiId: varchar('api_id', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    dataType: varchar('data_type', { length: 50 }).notNull(),
    isRequired: boolean('is_required').notNull().default(false),
    isUnique: boolean('is_unique').notNull().default(false),
    isLocalized: boolean('is_localized').notNull().default(false),
    isRepeatable: boolean('is_repeatable').notNull().default(false),
    validation: jsonb('validation'),
    config: jsonb('config'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    apiIdUnique: unique('fields_schema_api_id_unique').on(
      table.schemaId,
      table.apiId,
    ),
  }),
);

// Schema-level relation declarations (which field, between which schemas,
// what cardinality) — distinct from entry_relations, which holds the actual
// instance rows.
export const relationDefs = pgTable('relation_defs', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldId: uuid('field_id')
    .notNull()
    .references(() => fields.id, { onDelete: 'cascade' }),
  sourceSchemaId: uuid('source_schema_id')
    .notNull()
    .references(() => schemas.id, { onDelete: 'cascade' }),
  targetSchemaId: uuid('target_schema_id').references(() => schemas.id, {
    onDelete: 'cascade',
  }), // null = polymorphic
  kind: relationKindEnum('kind').notNull(),
  inverseFieldId: uuid('inverse_field_id').references(() => fields.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Fixes FR-CM-8: every schema definition change is snapshotted so a migration
// can be previewed and rolled back instead of only living in audit_logs.
export const schemaVersions = pgTable('schema_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaId: uuid('schema_id')
    .notNull()
    .references(() => schemas.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  definition: jsonb('definition').notNull(),
  checksum: varchar('checksum', { length: 64 }),
  migrationNotes: text('migration_notes'),
  actorType: actorTypeEnum('actor_type').notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdByAgentId: uuid('created_by_agent_id').references(() => agents.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contentEntries = pgTable('content_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  schemaId: uuid('schema_id')
    .notNull()
    .references(() => schemas.id, { onDelete: 'restrict' }),
  actorType: actorTypeEnum('created_by_type').notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdByAgentId: uuid('created_by_agent_id').references(() => agents.id, {
    onDelete: 'set null',
  }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Current-state read path — one row per (entry, locale), kept in sync with
// contentVersions on every write. Delivery APIs read this single indexed
// row instead of deriving "what's current" from version history (NFR-P-1).
// The one-row-per-locale shape also makes "only one published version at a
// time" a structural guarantee rather than something enforced by an index.
export const entryLocalizations = pgTable(
  'entry_localizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 20 }).notNull(),
    status: versionStatusEnum('status').notNull().default('draft'),
    data: jsonb('data').notNull(),
    publishedData: jsonb('published_data'),
    scheduledPublishAt: timestamp('scheduled_publish_at', {
      withTimezone: true,
    }),
    scheduledUnpublishAt: timestamp('scheduled_unpublish_at', {
      withTimezone: true,
    }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryLocaleUnique: unique('entry_localizations_entry_locale_unique').on(
      table.entryId,
      table.locale,
    ),
  }),
);

// Full version history — append-only, used for diff/rollback, not the read path.
export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 20 }).notNull(),
    versionNo: integer('version_no').notNull(),
    status: versionStatusEnum('status').notNull(),
    data: jsonb('data').notNull(),
    actorType: actorTypeEnum('actor_type').notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdByAgentId: uuid('created_by_agent_id').references(() => agents.id, {
      onDelete: 'set null',
    }),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryLocaleVersionUnique: unique(
      'content_versions_entry_locale_version_unique',
    ).on(table.entryId, table.locale, table.versionNo),
  }),
);

export const entryRelations = pgTable(
  'entry_relations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fieldId: uuid('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
    sourceEntryId: uuid('source_entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    targetEntryId: uuid('target_entry_id')
      .notNull()
      .references(() => contentEntries.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    noDuplicateRelations: unique('entry_relations_unique').on(
      table.fieldId,
      table.sourceEntryId,
      table.targetEntryId,
    ),
  }),
);

export const schemasRelations = relations(schemas, ({ many }) => ({
  fields: many(fields),
  versions: many(schemaVersions),
  entries: many(contentEntries),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  schema: one(schemas, { fields: [fields.schemaId], references: [schemas.id] }),
  relationDefs: many(relationDefs),
  entryRelations: many(entryRelations),
}));

export const relationDefsRelations = relations(relationDefs, ({ one }) => ({
  field: one(fields, {
    fields: [relationDefs.fieldId],
    references: [fields.id],
    relationName: 'relationDefField',
  }),
  sourceSchema: one(schemas, {
    fields: [relationDefs.sourceSchemaId],
    references: [schemas.id],
    relationName: 'relationDefSource',
  }),
  targetSchema: one(schemas, {
    fields: [relationDefs.targetSchemaId],
    references: [schemas.id],
    relationName: 'relationDefTarget',
  }),
  inverseField: one(fields, {
    fields: [relationDefs.inverseFieldId],
    references: [fields.id],
    relationName: 'relationDefInverseField',
  }),
}));

export const schemaVersionsRelations = relations(schemaVersions, ({ one }) => ({
  schema: one(schemas, {
    fields: [schemaVersions.schemaId],
    references: [schemas.id],
  }),
  createdByUser: one(users, {
    fields: [schemaVersions.createdByUserId],
    references: [users.id],
  }),
  createdByAgent: one(agents, {
    fields: [schemaVersions.createdByAgentId],
    references: [agents.id],
  }),
}));

export const contentEntriesRelations = relations(
  contentEntries,
  ({ one, many }) => ({
    schema: one(schemas, {
      fields: [contentEntries.schemaId],
      references: [schemas.id],
    }),
    createdByUser: one(users, {
      fields: [contentEntries.createdByUserId],
      references: [users.id],
    }),
    createdByAgent: one(agents, {
      fields: [contentEntries.createdByAgentId],
      references: [agents.id],
    }),
    localizations: many(entryLocalizations),
    versions: many(contentVersions),
  }),
);

export const entryLocalizationsRelations = relations(
  entryLocalizations,
  ({ one }) => ({
    entry: one(contentEntries, {
      fields: [entryLocalizations.entryId],
      references: [contentEntries.id],
    }),
  }),
);

export const contentVersionsRelations = relations(
  contentVersions,
  ({ one }) => ({
    entry: one(contentEntries, {
      fields: [contentVersions.entryId],
      references: [contentEntries.id],
    }),
    createdByUser: one(users, {
      fields: [contentVersions.createdByUserId],
      references: [users.id],
    }),
    createdByAgent: one(agents, {
      fields: [contentVersions.createdByAgentId],
      references: [agents.id],
    }),
  }),
);

export const entryRelationsRelations = relations(entryRelations, ({ one }) => ({
  field: one(fields, {
    fields: [entryRelations.fieldId],
    references: [fields.id],
  }),
  source: one(contentEntries, {
    fields: [entryRelations.sourceEntryId],
    references: [contentEntries.id],
    relationName: 'sourceEntry',
  }),
  target: one(contentEntries, {
    fields: [entryRelations.targetEntryId],
    references: [contentEntries.id],
    relationName: 'targetEntry',
  }),
}));
