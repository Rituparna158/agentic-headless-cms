import { eq, sql } from 'drizzle-orm';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { plugins, withTransaction } from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import type { PluginRecord, UpsertPluginInput } from '@repo/types';

export class PluginRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async findAll(): Promise<PluginRecord[]> {
    try {
      return await withTransaction(this.db, async (tx) => {
        const rows = await tx.select().from(plugins);
        return rows as unknown as PluginRecord[];
      });
    } catch (error) {
      logger.error({ err: error }, 'PluginRepository: findAll failed');
      throw new ApiError(500, 'Failed to fetch plugins from database');
    }
  }

  async findById(id: string): Promise<PluginRecord | null> {
    try {
      const records = await withTransaction(this.db, async (tx) => {
        return await tx
          .select()
          .from(plugins)
          .where(eq(plugins.id, id))
          .limit(1);
      });
      return (records[0] as unknown as PluginRecord) ?? null;
    } catch (error) {
      logger.error({ id, err: error }, 'PluginRepository: findById failed');
      throw new ApiError(500, 'Failed to fetch plugin by id');
    }
  }

  async upsert(input: UpsertPluginInput): Promise<PluginRecord> {
    try {
      const result = await withTransaction(this.db, async (tx) => {
        return await tx
          .insert(plugins)
          .values({
            id: input.id,
            name: input.name,
            version: input.version,
            isEnabled: input.isEnabled ?? true,
            config: input.config ?? {},
          })
          .onConflictDoUpdate({
            target: plugins.id,
            set: {
              name: input.name,
              version: input.version,
              updatedAt: sql`now()`,
            },
          })
          .returning();
      });
      return result[0] as unknown as PluginRecord;
    } catch (error) {
      logger.error({ input, err: error }, 'PluginRepository: upsert failed');
      throw new ApiError(500, 'Failed to upsert plugin record');
    }
  }

  async updateStatus(id: string, isEnabled: boolean): Promise<PluginRecord> {
    try {
      const result = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(plugins)
          .set({
            isEnabled,
            updatedAt: sql`now()`,
          })
          .where(eq(plugins.id, id))
          .returning();
      });
      if (!result[0]) {
        throw new ApiError(404, `Plugin "${id}" not found in database`);
      }
      return result[0] as unknown as PluginRecord;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(
        { id, isEnabled, err: error },
        'PluginRepository: updateStatus failed',
      );
      throw new ApiError(500, 'Failed to update plugin status');
    }
  }

  async updateConfig(
    id: string,
    config: Record<string, unknown>,
  ): Promise<PluginRecord> {
    try {
      const result = await withTransaction(this.db, async (tx) => {
        return await tx
          .update(plugins)
          .set({
            config,
            updatedAt: sql`now()`,
          })
          .where(eq(plugins.id, id))
          .returning();
      });
      if (!result[0]) {
        throw new ApiError(404, `Plugin "${id}" not found in database`);
      }
      return result[0] as unknown as PluginRecord;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ id, err: error }, 'PluginRepository: updateConfig failed');
      throw new ApiError(500, 'Failed to update plugin configuration');
    }
  }
}
