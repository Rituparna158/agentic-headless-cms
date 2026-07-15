import {
  createSchema as createSchemaRecord,
  listSchemas as listSchemaRecords,
  getSchemaById,
  updateSchema as updateSchemaRecord,
  type Database,
} from '@repo/shared-db';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/shared-types';
import { getDatabaseAdapter } from '../../config/database.js';

export class SchemaRepository {
  private getDb(): Database {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateSchemaInput & { actorUserId: string }) {
    const db = this.getDb();
    return createSchemaRecord(db, {
      name: input.name,
      slug: input.slug,
      type: input.type,
      fields: input.fields,
      actorType: 'user',
      createdByUserId: input.actorUserId,
    });
  }

  async list() {
    const db = this.getDb();
    return listSchemaRecords(db);
  }

  async getById(id: string) {
    const db = this.getDb();
    return getSchemaById(db, id);
  }

  async update(id: string, input: UpdateSchemaInput & { actorUserId: string }) {
    const db = this.getDb();
    return updateSchemaRecord(db, id, {
      name: input.name,
      fields: input.fields,
      migrationNotes: input.migrationNotes,
      actorType: 'user',
      createdByUserId: input.actorUserId,
    });
  }
}
