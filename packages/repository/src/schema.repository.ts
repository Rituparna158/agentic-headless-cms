import {
  createSchema as createSchemaRecord,
  listSchemas as listSchemaRecords,
  getSchemaById,
  getSchemaBySlug,
  updateSchema as updateSchemaRecord,
  deleteSchema as deleteSchemaRecord,
  type Database,
} from '@repo/shared-db';
import type {
  CreateSchemaInput,
  UpdateSchemaInput,
  BaseQueryOptions,
} from '@repo/types';
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

  async list(options: BaseQueryOptions = {}) {
    try {
      logger.info('SchemaRepository: listing schemas');
      const db = this.getDb();
      const result = await listSchemaRecords(db, options);
      logger.debug(
        { count: result[0].length },
        'SchemaRepository: list complete',
      );
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

  async getBySlug(slug: string) {
    try {
      logger.info({ slug }, 'SchemaRepository: fetching schema by slug');
      const db = this.getDb();
      const result = await getSchemaBySlug(db, slug);
      logger.debug({ found: !!result }, 'SchemaRepository: getBySlug complete');
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'RecordNotFoundError') {
        throw new ApiError(404, error.message);
      }
      logger.error({ err: error }, 'SchemaRepository Error in getBySlug:');
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
      const err = error as Record<string, unknown>;
      if (
        err?.code === '23503' ||
        (error instanceof Error &&
          (error.message.toLowerCase().includes('foreign key constraint') ||
            error.message.toLowerCase().includes('constraint') ||
            error.message.toLowerCase().includes('conflict')))
      ) {
        throw new ApiError(
          409,
          'Cannot delete schema with existing content entries (FOREIGN_KEY_VIOLATION)',
        );
      }
      throw new ApiError(500, REPO_ERRORS.DELETE_SCHEMA_FAILED);
    }
  }
}
