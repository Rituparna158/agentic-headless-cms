import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandlerMiddleware } from './common/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from './common/middlewares/not-found.middleware.js';
import { requestIdMiddleware } from './common/middlewares/request-id.middleware.js';
import { logger } from './common/logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { metricsRouter } from './modules/observability/metrics.routes.js';
import { apiRouter } from './routes/index.js';
import { graphqlRouter } from './modules/graphql/graphql.router.js';
import { setupAuditListener } from './modules/audit/audit.listener.js';
import { setupMediaQueueListener } from './queues/media-queue.listener.js';

/**
 * Pure app assembly — no `listen()` here. Kept separate from server.ts so
 * the app can be imported directly in tests (via supertest) without
 * binding a real port or touching process lifecycle.
 */
export function createApp(): Express {
  setupAuditListener();
  // Registers the event *listener* only (cheap — no connection opened).
  // The actual Worker that consumes the queue is started separately in
  // server.ts, not here, so importing createApp() in tests (supertest)
  // never opens a real Redis connection just to exercise HTTP routes.
  setupMediaQueueListener();

  const app = express();

  app.disable('x-powered-by');
  // `true` trusts X-Forwarded-* from *any* hop, letting a client spoof
  // req.ip/req.protocol if there's ever more than one hop in front of this
  // process. `1` trusts exactly the nearest proxy — correct for the
  // single ingress/load-balancer hop this is deployed behind on Kubernetes.
  // Adjust if the real deployment topology adds more hops (e.g. a CDN in
  // front of the ingress).
  app.set('trust proxy', 1);
  // Express 5 defaults to the 'simple' query parser (Node's `querystring`),
  // which doesn't support bracket-nested keys. The content API's filter
  // syntax (`?filters[title][$eq]=Hello`) needs 'extended' (the `qs`
  // library) to parse into a nested req.query object instead of a flat
  // `{ "filters[title][$eq]": "Hello" }`.
  app.set('query parser', 'extended');

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
  app.use(
    helmet({
      // The default 'same-origin' CORP blocks the frontend (a different
      // origin in every real deployment — separate host/port, and a CDN in
      // front per FR-MD-2) from loading <img src> thumbnails off media
      // asset URLs at all. CORS above already scopes cross-origin access to
      // env.CORS_ORIGIN, so relaxing CORP to match doesn't open this up
      // beyond what's already allowed for fetch/XHR.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/metrics', metricsRouter);
  app.use('/api/v1', apiRouter);
  app.use('/graphql', graphqlRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
