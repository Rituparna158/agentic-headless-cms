import type { Database } from './client.js';
import { isRetryableError, mapPostgresError } from './errors.js';

export interface WithTransactionOptions {
  /**
   * Number of times to retry the whole callback if Postgres reports a
   * serialization failure (40001) or deadlock (40P01) — both are expected,
   * transient outcomes under concurrent writes at higher isolation levels,
   * not bugs, and the standard remedy is "retry the transaction."
   * Defaults to 3.
   */
  maxRetries?: number;
  /** Base delay for exponential backoff between retries, in ms. Defaults to 50. */
  baseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` inside a single database transaction, translating any driver
 * error into the typed `DatabaseError` hierarchy and automatically retrying
 * the *entire* callback (with jittered exponential backoff) when Postgres
 * signals a transient conflict — a serialization failure or deadlock caused
 * by another concurrent transaction, not by the callback's own logic.
 *
 * Non-retryable errors (unique/foreign-key/not-null violations, connection
 * errors, application-thrown errors) are rethrown immediately on first
 * occurrence; retrying those would just fail the same way again.
 */
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
      // Drizzle's transaction callback receives a tx-scoped query builder;
      // returning a value from it propagates back out through `db.transaction`.
      return await db.transaction((tx) => fn(tx as unknown as Database));
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
