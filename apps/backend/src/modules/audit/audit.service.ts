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
    const hasCustomSort = Boolean(
      (query.sortBy && query.sortBy !== 'timestamp') ||
      (query.sortOrder && query.sortOrder !== 'desc') ||
      (query.sortDirection && query.sortDirection !== 'desc'),
    );
    const hasFilters = Boolean(
      query.action ||
      query.resourceType ||
      query.actorUserId ||
      query.startDate ||
      query.endDate ||
      (query.search && query.search.trim().length > 0) ||
      hasCustomSort,
    );
    // Unfiltered page 1 query with default timestamp desc sort (default dashboard view)
    return page === 1 && limit === 15 && !hasFilters;
  }

  private getDefaultPage1CacheKey(applicationId?: string): string {
    return applicationId
      ? `audit:logs:${applicationId}:default_page1`
      : DEFAULT_PAGE1_CACHE_KEY;
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
      const cacheKey = this.getDefaultPage1CacheKey(query.applicationId);

      if (isDefaultPage1) {
        try {
          const redis = await this.getRedisClient();
          if (redis) {
            const cached = await redis.get(cacheKey);
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
              cacheKey,
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

  async invalidateCache(applicationId?: string): Promise<void> {
    try {
      const redis = await this.getRedisClient();
      if (!redis) return;

      // Invalidate default page 1 key(s)
      if (applicationId) {
        await redis.del(this.getDefaultPage1CacheKey(applicationId));
      }
      await redis.del(DEFAULT_PAGE1_CACHE_KEY);

      // Pattern-based invalidation for all audit query cache keys using non-blocking SCAN
      const matchPattern = applicationId
        ? `audit:logs:${applicationId}:*`
        : 'audit:logs:*';

      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          matchPattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');

      logger.debug(
        { applicationId },
        'AuditService: invalidated audit cache keys',
      );
    } catch (cacheErr) {
      logger.warn(
        { err: cacheErr },
        'AuditService: Redis cache invalidation failed',
      );
    }
  }

  async getById(id: string, applicationId?: string): Promise<AuditLogRecord> {
    try {
      logger.info({ id, applicationId }, 'AuditService: getById start');
      const log = applicationId
        ? await this.repository.findById(id, applicationId)
        : await this.repository.findById(id);
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
