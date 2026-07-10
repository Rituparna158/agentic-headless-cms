import type { Request, Response } from 'express';
import { checkReadiness } from './health.service.js';

/** Liveness — is the process itself still running? No dependencies checked; a positive answer just means "don't kill this container." */
export function liveness(_req: Request, res: Response): void {
  res.status(200).json({ status: 'ok' });
}

export async function readiness(_req: Request, res: Response): Promise<void> {
  const result = await checkReadiness();
  res.status(result.healthy ? 200 : 503).json({
    status: result.healthy ? 'ok' : 'error',
    dependencies: result.dependencies,
  });
}
