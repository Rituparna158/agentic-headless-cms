import { setupMediaWorker } from './media.worker.js';
import {
  assertMinimumRedisVersion,
  closeRedisConnection,
  closeAllQueues,
} from '@repo/config';
import { logger } from '@repo/logger';

logger.info('Starting Background Worker...');

// Check before any worker opens a connection
try {
  await assertMinimumRedisVersion();
  logger.info('Redis pre-flight check passed.');
} catch (error) {
  logger.fatal({ err: error }, 'Redis pre-flight check failed - exiting.');
  process.exit(1);
}

// Start the worker
const _worker = setupMediaWorker();
logger.info('Media Worker registered and listening for jobs.');

let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(
    `Received ${signal}, shutting down background worker gracefully...`,
  );

  closeAllQueues()
    .then(() => closeRedisConnection())
    .then(() => {
      logger.info('Background worker shutdown complete.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      logger.error({ err: error }, 'Error during worker shutdown');
      process.exit(1);
    });

  setTimeout(() => {
    logger.error('Graceful worker shutdown timed out, forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal(
    { err: reason },
    'Unhandled promise rejection in worker — shutting down',
  );
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception in worker — exiting');
  process.exit(1);
});
