import type { Database } from './client.js';
import { isRetryableError, mapPostgresError } from './errors.js';
import { contextStorage } from '@repo/context';
import { sql } from 'drizzle-orm';
export interface WithTransactionOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  applicationId?: string;
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function withTransaction<T>(
  db: Database,
  fn: (tx: Database) => Promise<T>,
  options: WithTransactionOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 50;
  let attempt = 0;
  for (;;) {
    try {
      const store = contextStorage.getStore();
      const appId = options.applicationId || store?.applicationId;

      return await db.transaction(async (tx) => {
        if (appId) {
          await tx.execute(
            sql`SELECT set_config('app.current_application_id', ${appId}, true)`,
          );
        }
        return fn(tx as unknown as Database);
      });
    } catch (rawError) {
      const error = mapPostgresError(rawError);
      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }
      attempt += 1;
      const jitter = Math.random() * baseDelayMs;
      const delay = baseDelayMs * 2 ** (attempt - 1) + jitter;
      await sleep(delay);
    }
  }
}
