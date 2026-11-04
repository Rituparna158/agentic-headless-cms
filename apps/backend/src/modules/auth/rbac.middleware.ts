import { requirePermission as createRequirePermission } from '@mindfiredigital/middlewares';
import { authService } from './auth.service.js';
export const requirePermission = createRequirePermission((userId, appId) =>
  authService.getUserPermissions(userId, appId),
);
