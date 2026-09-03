import { AuditRepository } from '@repo/repository';
import type {
  GetAuditLogsQuery,
  PaginatedAuditLogsResponse,
  AuditLogRecord,
} from '@repo/types';
import { ApiError, NotFoundError } from '@repo/utils';
import { logger } from '@repo/logger';
import { getRedisConnection } from '@repo/config';

const DEFAULT_PAGE1_CACHE_KEY = 'audit:logs:default_page1';
const CACHE_TTL_SECONDS = 30;

export class AuditService {
  constructor(
    private readonly repository: AuditRepository = new AuditRepository(),
  ) {}

  private isDefaultPage1Query(query: GetAuditLogsQuery): boolean {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Number(query.limit) || 15;
    const hasFilters = Boolean(
      query.action ||
      query.resourceType ||
      query.actorUserId ||
      query.startDate ||
      query.endDate ||
      (query.search && query.search.trim().length > 0),
    );
    // Unfiltered page 1 query (default dashboard view)
    return page === 1 && limit === 15 && !hasFilters;
  }

  private async getRedisClient() {
    try {
      const redis = getRedisConnection();
      if (redis.status === 'wait') {
        await redis.connect().catch(() => {});
      }
      return redis.status === 'ready' ? redis : null;
    } catch {
      return null;
    }
  }

  async list(
    query: GetAuditLogsQuery = {},
  ): Promise<PaginatedAuditLogsResponse> {
    try {
      logger.info({ query }, 'AuditService: list start');
      const isDefaultPage1 = this.isDefaultPage1Query(query);

      if (isDefaultPage1) {
        try {
          const redis = await this.getRedisClient();
          if (redis) {
            const cached = await redis.get(DEFAULT_PAGE1_CACHE_KEY);
            if (cached) {
              logger.debug(
                'AuditService: list Redis cache HIT for default page 1',
              );
              return JSON.parse(cached) as PaginatedAuditLogsResponse;
            }
          }
        } catch (cacheErr) {
          logger.warn(
            { err: cacheErr },
            'AuditService: Redis cache read failed, falling back to DB',
          );
        }
      }

      const result = await this.repository.findMany(query);
      logger.debug(
        { total: result.total, count: result.data.length },
        'AuditService: list success',
      );

      if (isDefaultPage1 && result) {
        try {
          const redis = await this.getRedisClient();
          if (redis) {
            await redis.set(
              DEFAULT_PAGE1_CACHE_KEY,
              JSON.stringify(result),
              'EX',
              CACHE_TTL_SECONDS,
            );
            logger.debug('AuditService: default page 1 stored in Redis cache');
          }
        } catch (cacheErr) {
          logger.warn(
            { err: cacheErr },
            'AuditService: Redis cache write failed',
          );
        }
      }

      return result;
    } catch (error) {
      logger.error({ err: error }, 'AuditService Error in list:');
      throw new ApiError(500, 'Failed to fetch audit logs');
    }
  }

  async invalidateCache(): Promise<void> {
    try {
      const redis = getRedisConnection();
      await redis.del(DEFAULT_PAGE1_CACHE_KEY);
      logger.debug('AuditService: invalidated default page 1 cache');
    } catch (cacheErr) {
      logger.warn(
        { err: cacheErr },
        'AuditService: Redis cache invalidation failed',
      );
    }
  }

  async getById(id: string): Promise<AuditLogRecord> {
    try {
      logger.info({ id }, 'AuditService: getById start');
      const log = await this.repository.findById(id);
      if (!log) {
        throw new NotFoundError('Audit log not found');
      }
      return log;
    } catch (error) {
      logger.error({ err: error, id }, 'AuditService Error in getById:');
      if (error instanceof NotFoundError) throw error;
      throw new ApiError(500, 'Failed to fetch audit log');
    }
  }
}

export const auditService = new AuditService();
