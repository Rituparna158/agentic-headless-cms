import './instrumentation.js';
import { sdk } from './instrumentation.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { getDatabaseAdapter } from './config/database.js';
import {
  assertMinimumRedisVersion,
  closeRedisConnection,
} from './config/redis.js';
import { closeAllQueues } from './queues/queue.factory.js';
import { setupMediaWorker } from './queues/media.worker.js';

const app = createApp();

// Instantiate the adapter at start so a config-time error surfaces immediately
getDatabaseAdapter();

// Check before any queue/worker opens a connection so an unsupported Redis
try {
  await assertMinimumRedisVersion();
} catch (error) {
  logger.fatal({ err: error }, 'Redis pre-flight check failed - exiting.');
  process.exit(1);
}

// Workers actually open a Redis connection and start polling — started here
// (not in createApp()) so importing the app in tests never does either.
setupMediaWorker();

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  // Guards against a double-invocation — e.g. an unhandledRejection firing
  // while a SIGTERM-triggered shutdown is already in progress would
  // otherwise call server.close() a second time on an already-closing
  // server.
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}, shutting down gracefully...`);

  server.close((closeServerError) => {
    if (closeServerError) {
      logger.error(
        { err: closeServerError },
        'Error while closing HTTP server',
      );
    }

    // Queues/workers before Redis itself — closeAllQueues() waits for
    // in-flight jobs to finish and needs a live connection to do so.
    // Best-effort: a failure here shouldn't block the DB pool from also
    // closing, so it's caught and logged rather than propagated.
    closeAllQueues()
      .then(() => closeRedisConnection())
      .catch((closeQueueError: unknown) => {
        logger.error(
          { err: closeQueueError },
          'Error while closing queues/workers/Redis connection',
        );
      })
      .then(() => getDatabaseAdapter().close())
      .then(() => sdk.shutdown())
      .then(() => {
        logger.info('Shutdown complete.');
        process.exit(closeServerError ? 1 : 0);
      })
      .catch((closeDbError: unknown) => {
        logger.error(
          { err: closeDbError },
          'Error while closing database connection pool',
        );
        process.exit(1);
      });
  });

  // Force-exit if graceful shutdown hangs (e.g. an in-flight request never
  // completes) — Kubernetes will SIGKILL after its own grace period
  // regardless, but this ensures a clean, logged exit before that happens.
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  // A rejected promise with no handler means somewhere in the app a bug
  // exists — the process state from here on is unverified. Logging and
  // continuing would silently override Node's own crash-on-unhandled-
  // rejection default for the entire process. Shut down gracefully (drain
  // in-flight requests, close the DB pool) rather than hard-exiting like
  // uncaughtException does below, since the process itself isn't
  // necessarily corrupted the way it is after an uncaught exception.
  logger.fatal({ err: reason }, 'Unhandled promise rejection — shutting down');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception — exiting');
  process.exit(1);
});
