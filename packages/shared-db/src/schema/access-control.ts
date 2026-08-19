import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { permissionActionEnum, permissionEffectEnum } from './enums.js';
import { applications, roles } from './identity.js';
import { schemas } from './content.js';
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id')
    .notNull()
    .default(sql`current_setting('app.current_application_id', true)::uuid`)
    .references(() => applications.id, { onDelete: 'cascade' }),
  schemaId: uuid('schema_id').references(() => schemas.id, {
    onDelete: 'cascade',
  }), // null = applies to all content types
  action: permissionActionEnum('action').notNull(),
  effect: permissionEffectEnum('effect').notNull().default('allow'),
  fields: jsonb('fields'), // allowed/denied field api_ids; null = all fields
  condition: jsonb('condition'), // row-level filter
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const permissionsRelations = relations(permissions, ({ one }) => ({
  application: one(applications, {
    fields: [permissions.applicationId],
    references: [applications.id],
  }),
  role: one(roles, { fields: [permissions.roleId], references: [roles.id] }),
  schema: one(schemas, {
    fields: [permissions.schemaId],
    references: [schemas.id],
  }),
}));
