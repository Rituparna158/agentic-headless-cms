import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const plugins = pgTable(
  'plugins',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    config: jsonb('config').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    isEnabledIdx: index('plugins_is_enabled_idx').on(table.isEnabled),
  }),
);

export type PluginTable = typeof plugins;
