import { Router } from 'express';

/**
 * Versioned API router — feature modules (content, schema, media, auth,
 * etc.) mount their routers here as they're built. Health checks are
 * intentionally not under this prefix: Kubernetes probes and most
 * monitoring tooling expect unversioned `/health/*` paths.
 */
export const apiRouter = Router();
