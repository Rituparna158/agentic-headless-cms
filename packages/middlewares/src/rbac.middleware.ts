import type { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS } from '@repo/constants';
import { hasPermission, Permission } from '@repo/utils/rbac';
function errorJson(res: Response, status: number, message: string) {
  const req = res.req as unknown as Request;
  const requestId = req && typeof req.id === 'string' ? req.id : undefined;
  return res.status(status).json({ error: { message, requestId } });
}
export const requirePermission =
  (
    getUserPermissions: (
      userId: string,
      appId: string,
    ) => Promise<Permission[]>,
  ) =>
  (action: string, schemaId?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        errorJson(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED,
        );
        return;
      }
      try {
        const appId = (req.headers['x-app-id'] as string) || 'default';
        const permissions =
          req.user.permissions ||
          (await getUserPermissions(req.user.id, appId));
        if (!hasPermission(permissions, action, schemaId)) {
          errorJson(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.RBAC.FORBIDDEN);
          return;
        }
        next();
      } catch (err) {
        next(err);
      }
    };
  };
