import './instrumentation.js';
import { sdk } from './instrumentation.js';
import { createApp } from './app.js';
import { env } from '@repo/config';
import { logger } from '@repo/logger';
import { getDatabaseAdapter } from '@repo/config';
import { assertMinimumRedisVersion, closeRedisConnection } from '@repo/config';

const app = createApp();

// Instantiate database adapter
getDatabaseAdapter();

// Check Redis connection
try {
  await assertMinimumRedisVersion();
} catch (error) {
  logger.warn(
    { err: error },
    'Redis pre-flight check warning — operating with database fallback mode.',
  );
}

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
});

let shuttingDown = false;

function shutdown(signal: string): void {
  // Guard against double shutdown
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

    // Close queues before Redis
    closeRedisConnection()
      .catch((closeQueueError: unknown) => {
        logger.error(
          { err: closeQueueError },
          'Error while closing Redis connection',
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

  // Force exit on timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  // Handle unhandled promise rejections
  logger.fatal({ err: reason }, 'Unhandled promise rejection — shutting down');
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception — exiting');
  process.exit(1);
});
