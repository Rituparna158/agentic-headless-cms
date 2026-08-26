import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedUser } from '@repo/types';
import { env, getDatabaseAdapter } from '@repo/config';
import { ERROR_MESSAGES, HTTP_STATUS, AUTH_COOKIES } from '@repo/constants';
import { apiTokens, roles, permissions } from '@repo/shared-db';
import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import type { Permission } from '@repo/utils/rbac';

function errorJson(res: Response, status: number, message: string) {
  const req = res.req as unknown as Request;
  const requestId = req && typeof req.id === 'string' ? req.id : undefined;
  return res.status(status).json({ error: { message, requestId } });
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const appId = (req.headers['x-app-id'] as string) || 'default';
  const cookieName = `${AUTH_COOKIES.PREFIX}${appId.toLowerCase()}`;

  let token = (req.cookies as Record<string, string> | undefined)?.[cookieName];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    errorJson(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.AUTH.NO_TOKEN);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser & {
      isMfaChallenge?: boolean;
    };
    if (decoded.isMfaChallenge) {
      errorJson(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
      return;
    }
    req.user = decoded;
    next();
  } catch {
    try {
      // Fallback: Check if it is a dashboard-generated API Token
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const db = getDatabaseAdapter().getDb();
      const records = await db
        .select({
          token: apiTokens,
          role: roles,
        })
        .from(apiTokens)
        .leftJoin(roles, eq(apiTokens.roleId, roles.id))
        .where(eq(apiTokens.tokenHash, hash))
        .limit(1);

      if (records.length === 0) {
        errorJson(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.INVALID_TOKEN,
        );
        return;
      }

      const tokenRecord = records[0]!.token;
      const roleRecord = records[0]!.role;

      if (tokenRecord.revokedAt) {
        errorJson(res, HTTP_STATUS.UNAUTHORIZED, 'Token has been revoked');
        return;
      }

      if (
        tokenRecord.expiresAt &&
        new Date(tokenRecord.expiresAt) < new Date()
      ) {
        errorJson(res, HTTP_STATUS.UNAUTHORIZED, 'Token has expired');
        return;
      }

      // Query permissions associated with this token's role
      let tokenPermissions: Permission[] = [];
      if (tokenRecord.roleId) {
        tokenPermissions = await db
          .select({
            action: permissions.action,
            effect: permissions.effect,
            schemaId: permissions.schemaId,
            fields: permissions.fields,
            condition: permissions.condition,
          })
          .from(permissions)
          .where(
            and(
              eq(permissions.roleId, tokenRecord.roleId),
              eq(permissions.applicationId, tokenRecord.applicationId),
            ),
          );
      }

      // Set user context from token config
      req.user = {
        id: tokenRecord.createdBy || 'system',
        email: 'api-token@agentic-cms.local',
        firstName: tokenRecord.name,
        lastName: 'Token',
        roles: [roleRecord?.name || 'user'],
        permissions: tokenPermissions,
        mfaEnabled: false,
      };

      next();
    } catch {
      errorJson(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
    }
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    errorJson(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED,
    );
    return;
  }

  const isAdmin = req.user.roles?.some(
    (role) => role.toLowerCase() === 'admin',
  );

  if (!isAdmin) {
    errorJson(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.RBAC.FORBIDDEN);
    return;
  }

  next();
};

export const requireAdminOrSupport = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    errorJson(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED,
    );
    return;
  }

  const isAdminOrSupport = req.user.roles?.some((role) => {
    const lowerRole = role.toLowerCase();
    return lowerRole === 'admin' || lowerRole === 'support';
  });

  if (!isAdminOrSupport) {
    errorJson(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.RBAC.FORBIDDEN);
    return;
  }

  next();
};
