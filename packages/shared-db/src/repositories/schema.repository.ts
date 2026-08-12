import { eq, sql } from 'drizzle-orm';
import type { Database } from '../client.js';
import { RecordNotFoundError } from '../errors.js';
import {
  fields,
  schemas,
  schemaVersions,
  contentEntries,
} from '../schema/index.js';
import type { actorTypeEnum, schemaTypeEnum } from '../schema/enums.js';
import { withTransaction } from '../transaction.js';
import { buildPaginationOptions } from '../queries/pagination.js';
import type { BaseQueryOptions } from '@repo/types';

export interface SchemaFieldInput {
  apiId: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  isUnique: boolean;
  isLocalized: boolean;
  isRepeatable: boolean;
  validation?: unknown;
  config?: unknown;
  sortOrder: number;
}

export interface CreateSchemaInput {
  name: string;
  slug: string;
  type: (typeof schemaTypeEnum.enumValues)[number];
  fields: SchemaFieldInput[];
  actorType: (typeof actorTypeEnum.enumValues)[number];
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
}

export interface UpdateSchemaInput {
  name?: string;
  fields?: SchemaFieldInput[];
  migrationNotes?: string | null;
  actorType: (typeof actorTypeEnum.enumValues)[number];
  createdByUserId?: string | null;
  createdByAgentId?: string | null;
}

export type SchemaRecord = typeof schemas.$inferSelect;

async function insertFields(
  tx: Database,
  schemaId: string,
  fieldInputs: SchemaFieldInput[],
): Promise<void> {
  if (fieldInputs.length === 0) return;

  await tx.insert(fields).values(
    fieldInputs.map((field) => ({
      schemaId,
      apiId: field.apiId,
      displayName: field.displayName,
      dataType: field.dataType,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isLocalized: field.isLocalized,
      isRepeatable: field.isRepeatable,
      validation: field.validation ?? null,
      config: field.config ?? null,
      sortOrder: field.sortOrder,
    })),
  );
}

/**
 * Creates a schema definition, its normalized field projection, and its
 * initial version snapshot in one transaction — `schemas.definition`,
 * `fields`, and `schema_versions` must never drift out of sync with each
 * other (see content.ts's comment on the `fields` table).
 */
export async function createSchema(
  db: Database,
  input: CreateSchemaInput,
): Promise<SchemaRecord> {
  return withTransaction(db, async (tx) => {
    const definition = { fields: input.fields };

    const [schema] = await tx
      .insert(schemas)
      .values({
        name: input.name,
        slug: input.slug,
        type: input.type,
        definition,
      })
      .returning();

    if (!schema) {
      throw new RecordNotFoundError('Insert of schema returned no row.');
    }

    await insertFields(tx, schema.id, input.fields);

    await tx.insert(schemaVersions).values({
      schemaId: schema.id,
      version: schema.version,
      definition,
      actorType: input.actorType,
      createdByUserId: input.createdByUserId ?? null,
      createdByAgentId: input.createdByAgentId ?? null,
    });

    return schema;
  });
}

export async function listSchemas(
  db: Database,
  options: BaseQueryOptions = {},
): Promise<readonly [SchemaRecord[], number]> {
  const { limit, offset, orderBy, where } = buildPaginationOptions(
    options,
    {
      id: schemas.id,
      name: schemas.name,
      slug: schemas.slug,
      createdAt: schemas.createdAt,
    },
    [schemas.name, schemas.slug],
  );

  const result = await db
    .select()
    .from(schemas)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(...orderBy);

  const countResult = await db
    .select({ count: sql<number>`cast(count(${schemas.id}) as integer)` })
    .from(schemas)
    .where(where);

  return [result, countResult[0]?.count ?? 0] as const;
}

export async function getSchemaById(
  db: Database,
  id: string,
): Promise<SchemaRecord> {
  const [schema] = await db
    .select()
    .from(schemas)
    .where(eq(schemas.id, id))
    .limit(1);

  if (!schema) {
    throw new RecordNotFoundError(`Schema ${id} does not exist.`);
  }

  return schema;
}

/**
 * Updates a schema definition. When `fields` is provided, it fully replaces
 * the existing field list rather than merging — schema-as-code definitions
 * are authored as a whole, not patched field-by-field, and a full replace
 * keeps the normalized `fields` projection trivially consistent with the new
 * `definition` instead of needing a three-way diff against the previous
 * field list. Every update is snapshotted into `schema_versions` regardless,
 * per FR-CM-8, so a migration can be previewed and rolled back.
 */
export async function updateSchema(
  db: Database,
  id: string,
  input: UpdateSchemaInput,
): Promise<SchemaRecord> {
  return withTransaction(db, async (tx) => {
    const [existing] = await tx
      .select()
      .from(schemas)
      .where(eq(schemas.id, id))
      .limit(1);

    if (!existing) {
      throw new RecordNotFoundError(`Schema ${id} does not exist.`);
    }

    const existingDefinition = existing.definition as {
      fields: SchemaFieldInput[];
    };
    const nextFields = input.fields ?? existingDefinition.fields;
    const definition = { fields: nextFields };
    const nextVersion = existing.version + 1;

    const [updated] = await tx
      .update(schemas)
      .set({
        name: input.name ?? existing.name,
        definition,
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(schemas.id, id))
      .returning();

    if (!updated) {
      throw new RecordNotFoundError(`Schema ${id} does not exist.`);
    }

    if (input.fields) {
      await tx.delete(fields).where(eq(fields.schemaId, id));
      await insertFields(tx, id, input.fields);
    }

    await tx.insert(schemaVersions).values({
      schemaId: id,
      version: nextVersion,
      definition,
      migrationNotes: input.migrationNotes ?? null,
      actorType: input.actorType,
      createdByUserId: input.createdByUserId ?? null,
      createdByAgentId: input.createdByAgentId ?? null,
    });

    return updated;
  });
}

export async function deleteSchema(
  db: Database,
  id: string,
  force: boolean = false,
): Promise<void> {
  return withTransaction(db, async (tx) => {
    if (force) {
      await tx.delete(contentEntries).where(eq(contentEntries.schemaId, id));
    }

    const [deleted] = await tx
      .delete(schemas)
      .where(eq(schemas.id, id))
      .returning({ id: schemas.id });

    if (!deleted) {
      throw new RecordNotFoundError(`Schema ${id} does not exist.`);
    }
  });
}
