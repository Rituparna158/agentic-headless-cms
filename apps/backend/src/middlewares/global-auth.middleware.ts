import { Request, Response, NextFunction } from 'express';
import { getDatabaseAdapter } from '@repo/config';
import { applications } from '@repo/shared-db';
import { eq } from 'drizzle-orm';
import { logger } from '@repo/logger';
import { HTTP_STATUS } from '@repo/constants';
import crypto from 'crypto';
export const globalAuthMiddleware = async (
  req: Request & { context?: { applicationId?: string } },
  res: Response,
  next: NextFunction,
) => {
  // Public routes that don't require tenant mapping or authentication
  if (
    req.originalUrl &&
    (req.originalUrl.includes('/media/file/') ||
      req.originalUrl.includes('/auth/sso'))
  ) {
    return next();
  }
  try {
    const db = getDatabaseAdapter().getDb();
    const apiKey = req.headers['x-api-key'] as string;
    const appIdString = req.headers['x-app-id'] as string;
    if (apiKey) {
      const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const appRecords = await db
        .select()
        .from(applications)
        .where(eq(applications.apiKeyHash, hash))
        .limit(1);
      if (appRecords.length === 0) {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: { message: 'Invalid API Key' } });
      }
      const resolvedApp = appRecords[0]!;
      // Verify the mapping! If they provided an App ID, it MUST match the API Key's true application
      if (appIdString && resolvedApp.name !== appIdString) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: {
            message: `Mismatch: The provided API Key does not belong to the application '${appIdString}'`,
          },
        });
      }
      req.headers['x-app-id'] = resolvedApp.name;
      req.context = { ...req.context, applicationId: resolvedApp.id };
      return next();
    }
    if (appIdString) {
      const appRecords = await db
        .select()
        .from(applications)
        .where(eq(applications.name, appIdString))
        .limit(1);
      if (appRecords.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: {
            message: `Application '${appIdString}' not found. Please provide a valid X-App-Id.`,
          },
        });
      }
      req.context = { ...req.context, applicationId: appRecords[0]!.id };
      return next();
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: {
        message:
          'Missing Authentication Headers (You must provide either a valid X-Api-Key or X-App-Id)',
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in globalAuthMiddleware');
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  }
};
