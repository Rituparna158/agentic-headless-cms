import {
  bigint,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { actorTypeEnum } from './enums.js';
import { agents, users } from './identity.js';

export const mediaFolders = pgTable('media_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  parentFolderId: uuid('parent_folder_id').references(
    (): AnyPgColumn => mediaFolders.id,
    {
      onDelete: 'set null',
    },
  ),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mediaTags = pgTable('media_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  // bigint, not integer — a plain integer caps at ~2.1GB and will silently
  // overflow on large video uploads.
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  url: varchar('url', { length: 1000 }).notNull(),
  altText: varchar('alt_text', { length: 500 }),
  metadata: jsonb('metadata'),
  storageProvider: varchar('storage_provider', { length: 50 })
    .notNull()
    .default('local'),
  folderId: uuid('folder_id').references(() => mediaFolders.id, {
    onDelete: 'set null',
  }),
  actorType: actorTypeEnum('uploaded_by_type').notNull(),
  uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  uploadedByAgentId: uuid('uploaded_by_agent_id').references(() => agents.id, {
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

export const mediaAssetTags = pgTable(
  'media_asset_tags',
  {
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => mediaTags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mediaAssetId, table.tagId] }),
  }),
);

export const mediaFoldersRelations = relations(
  mediaFolders,
  ({ one, many }) => ({
    parent: one(mediaFolders, {
      fields: [mediaFolders.parentFolderId],
      references: [mediaFolders.id],
    }),
    assets: many(mediaAssets),
  }),
);

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  folder: one(mediaFolders, {
    fields: [mediaAssets.folderId],
    references: [mediaFolders.id],
  }),
  uploadedByUser: one(users, {
    fields: [mediaAssets.uploadedByUserId],
    references: [users.id],
  }),
  uploadedByAgent: one(agents, {
    fields: [mediaAssets.uploadedByAgentId],
    references: [agents.id],
  }),
  tags: many(mediaAssetTags),
}));

export const mediaTagsRelations = relations(mediaTags, ({ many }) => ({
  assets: many(mediaAssetTags),
}));

export const mediaAssetTagsRelations = relations(mediaAssetTags, ({ one }) => ({
  asset: one(mediaAssets, {
    fields: [mediaAssetTags.mediaAssetId],
    references: [mediaAssets.id],
  }),
  tag: one(mediaTags, {
    fields: [mediaAssetTags.tagId],
    references: [mediaTags.id],
  }),
}));
