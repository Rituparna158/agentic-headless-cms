import { Router } from 'express';

import { accessRouter } from '../modules/access/access.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { contentRoutes } from '../modules/content/content.routes.js';
import { mediaRoutes } from '../modules/media/media.routes.js';
import { accessRouter } from '../modules/access/access.routes.js';
import { webhooksRouter } from '../modules/webhooks/webhooks.routes.js';
import { localesRouter } from '../modules/locales/locales.routes.js';
import { schemaRouter } from '../modules/schemas/schema.routes.js';

/**
 * Versioned API router — feature modules (content, schema, media, auth,
 * etc.) mount their routers here as they're built. Health checks are
 * intentionally not under this prefix: Kubernetes probes and most
 * monitoring tooling expect unversioned `/health/*` paths.
 */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/schemas', schemaRouter);
apiRouter.use('/content', contentRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/access', accessRouter);
apiRouter.use('/webhooks', webhooksRouter);
apiRouter.use('/locales', localesRouter);
