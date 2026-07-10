import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandlerMiddleware } from './common/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from './common/middlewares/not-found.middleware.js';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware.js';
import { logger } from './common/logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { apiRouter } from './routes/index.js';

/**
 * Pure app assembly — no `listen()` here. Kept separate from server.ts so
 * the app can be imported directly in tests (via supertest) without
 * binding a real port or touching process lifecycle.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // `true` trusts X-Forwarded-* from *any* hop, letting a client spoof
  // req.ip/req.protocol if there's ever more than one hop in front of this
  // process. `1` trusts exactly the nearest proxy — correct for the
  // single ingress/load-balancer hop this is deployed behind on Kubernetes.
  // Adjust if the real deployment topology adds more hops (e.g. a CDN in
  // front of the ingress).
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: {
        // Kubernetes probes hit /health/* every few seconds — logging every
        // one at info level would drown out everything else.
        ignore: (req) => req.url?.startsWith('/health') ?? false,
      },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/api/v1', apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
