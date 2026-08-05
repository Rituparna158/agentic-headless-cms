import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { locales, RecordNotFoundError } from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class LocalesRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async list() {
    try {
      logger.info('LocalesRepository: listing locales');
      const result = await this.db.select().from(locales);
      logger.debug(
        { count: result.length },
        'LocalesRepository: list complete',
      );
      return result;
    } catch (error) {
      logger.error({ err: error }, 'LocalesRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_LOCALES_FAILED);
    }
  }

  async getByCode(code: string) {
    try {
      logger.info({ code }, 'LocalesRepository: fetching locale by code');
      const [locale] = await this.db
        .select()
        .from(locales)
        .where(eq(locales.code, code))
        .limit(1);
      logger.debug(
        { found: !!locale },
        'LocalesRepository: getByCode complete',
      );
      return locale;
    } catch (error) {
      logger.error({ err: error }, 'LocalesRepository Error in getByCode:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async getById(id: string) {
    try {
      logger.info({ id }, 'LocalesRepository: fetching locale by ID');
      const [locale] = await this.db
        .select()
        .from(locales)
        .where(eq(locales.id, id))
        .limit(1);
      logger.debug({ found: !!locale }, 'LocalesRepository: getById complete');
      return locale;
    } catch (error) {
      logger.error({ err: error }, 'LocalesRepository Error in getById:');
      throw new ApiError(500, REPO_ERRORS.DB_FETCH_FAILED);
    }
  }

  async create(data: { code: string; name: string; isDefault?: boolean }) {
    try {
      logger.info(
        { code: data.code, name: data.name },
        'LocalesRepository: creating locale',
      );
      const [locale] = await this.db.insert(locales).values(data).returning();
      logger.debug(
        { code: locale?.code },
        'LocalesRepository: create complete',
      );
      return locale;
    } catch (error) {
      logger.error({ err: error }, 'LocalesRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_LOCALE_FAILED);
    }
  }

  async delete(id: string) {
    try {
      logger.info({ id }, 'LocalesRepository: deleting locale');
      const [deleted] = await this.db
        .delete(locales)
        .where(eq(locales.id, id))
        .returning({ id: locales.id });
      if (!deleted) {
        logger.error(
          { id },
          'LocalesRepository: locale not found for deletion',
        );
        throw new RecordNotFoundError('Locale not found');
      }
      logger.info({ id }, 'LocalesRepository: delete complete');
      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'LocalesRepository Error in delete:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, REPO_ERRORS.DELETE_LOCALE_FAILED);
    }
  }
}
