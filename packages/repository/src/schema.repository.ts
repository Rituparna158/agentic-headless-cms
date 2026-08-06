import {
  createSchema as createSchemaRecord,
  listSchemas as listSchemaRecords,
  getSchemaById,
  updateSchema as updateSchemaRecord,
  deleteSchema as deleteSchemaRecord,
  type Database,
} from '@repo/shared-db';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class SchemaRepository {
  private getDb(): Database {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateSchemaInput & { actorUserId: string }) {
    try {
      logger.info(
        { schemaName: input.name, actorUserId: input.actorUserId },
        'SchemaRepository: creating schema',
      );
      const db = this.getDb();
      const result = await createSchemaRecord(db, {
        name: input.name,
        slug: input.slug,
        type: input.type,
        fields: input.fields,
        actorType: 'user',
        createdByUserId: input.actorUserId,
      });
      logger.debug({ schemaId: result.id }, 'SchemaRepository: schema created');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_SCHEMA_FAILED);
    }
  }

  async list() {
    try {
      logger.info('SchemaRepository: listing schemas');
      const db = this.getDb();
      const result = await listSchemaRecords(db);
      logger.debug({ count: result.length }, 'SchemaRepository: list complete');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_SCHEMAS_FAILED);
    }
  }

  async getById(id: string) {
    try {
      logger.info({ id }, 'SchemaRepository: fetching schema by ID');
      const db = this.getDb();
      const result = await getSchemaById(db, id);
      logger.debug({ found: !!result }, 'SchemaRepository: getById complete');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaRepository Error in getById:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async update(id: string, input: UpdateSchemaInput & { actorUserId: string }) {
    try {
      logger.info(
        { id, actorUserId: input.actorUserId },
        'SchemaRepository: updating schema',
      );
      const db = this.getDb();
      const result = await updateSchemaRecord(db, id, {
        name: input.name,
        fields: input.fields,
        migrationNotes: input.migrationNotes,
        actorType: 'user',
        createdByUserId: input.actorUserId,
      });
      logger.debug({ id }, 'SchemaRepository: schema updated');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaRepository Error in update:');
      throw new ApiError(500, REPO_ERRORS.UPDATE_SCHEMA_FAILED);
    }
  }

  async delete(id: string, force: boolean = false) {
    try {
      logger.info({ id, force }, 'SchemaRepository: deleting schema');
      const db = this.getDb();
      const result = await deleteSchemaRecord(db, id, force);
      logger.debug({ id }, 'SchemaRepository: schema deleted');
      return result;
    } catch (error) {
      logger.error({ err: error }, 'SchemaRepository Error in delete:');
      throw new ApiError(500, REPO_ERRORS.DELETE_SCHEMA_FAILED);
    }
  }
}
