import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from '@repo/logger';
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
  requestIdMiddleware,
  contextMiddleware,
} from '@repo/middlewares';
import { env } from '@repo/config';
import { setupAuditListener } from '@repo/events';
import { graphqlRouter } from './modules/graphql/graphql.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { metricsRouter } from './modules/observability/metrics.routes.js';
import { setupMediaQueueListener } from './queues/media-queue.listener.js';
import { apiRouter } from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger.js';

// App assembly
export function createApp(): Express {
  setupAuditListener();
  // Register listeners
  setupMediaQueueListener();

  const app = express();

  app.disable('x-powered-by');
  // Trust closest proxy
  app.set('trust proxy', 1);
  // Use extended query parser
  app.set('query parser', 'extended');

  app.use(requestIdMiddleware);
  app.use(contextMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: {
        // Ignore health probe logs
        ignore: (req) => req.url?.startsWith('/health') ?? false,
      },
    }),
  );
  app.use(
    helmet({
      // Configure cross-origin policy
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.includes(',')
        ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/metrics', metricsRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/v1', apiRouter);
  app.use('/graphql', graphqlRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
