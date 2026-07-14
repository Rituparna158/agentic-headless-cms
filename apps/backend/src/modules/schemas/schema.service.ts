import {
  createSchema as createSchemaRecord,
  listSchemas as listSchemaRecords,
  updateSchema as updateSchemaRecord,
  type Database,
} from '@repo/shared-db';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/shared-types';
import { getDatabaseAdapter } from '../../config/database.js';

// `getDatabaseAdapter()` returns the un-parameterized `DatabasePort` (its
// generic defaults to `any`) — asserting the concrete `Database` type here
// keeps this module lint-clean without changing that shared, more broadly
// used signature.
function getDb(): Database {
  return getDatabaseAdapter().getDb() as Database;
}

export class SchemaService {
  async create(input: CreateSchemaInput, actorUserId: string) {
    const db = getDb();
    return createSchemaRecord(db, {
      name: input.name,
      slug: input.slug,
      type: input.type,
      fields: input.fields,
      actorType: 'user',
      createdByUserId: actorUserId,
    });
  }

  async list() {
    const db = getDb();
    return listSchemaRecords(db);
  }

  async update(id: string, input: UpdateSchemaInput, actorUserId: string) {
    const db = getDb();
    return updateSchemaRecord(db, id, {
      name: input.name,
      fields: input.fields,
      migrationNotes: input.migrationNotes,
      actorType: 'user',
      createdByUserId: actorUserId,
    });
  }
}

export const schemaService = new SchemaService();
