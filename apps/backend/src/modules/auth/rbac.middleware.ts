import { requirePermission as createRequirePermission } from '@repo/middlewares';
import { authService } from './auth.service.js';

export const requirePermission = createRequirePermission((userId) =>
  authService.getUserPermissions(userId),
);
