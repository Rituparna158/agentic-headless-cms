import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { permissionActionEnum, permissionEffectEnum } from './enums.js';
import { roles } from './identity.js';
import { schemas } from './content.js';

// Normalized, indexed permission rows instead of a JSONB blob on roles —
// field/row-level RBAC (FR-AC-2) gets evaluated on every API request, so it
// belongs in a queryable table, not parsed out of JSON each time.
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
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
  role: one(roles, { fields: [permissions.roleId], references: [roles.id] }),
  schema: one(schemas, {
    fields: [permissions.schemaId],
    references: [schemas.id],
  }),
}));
