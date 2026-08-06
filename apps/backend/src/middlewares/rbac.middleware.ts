import { requirePermission as createRequirePermission } from '@repo/middlewares';
import { authService } from '../modules/auth/auth.service.js';

export const requirePermission = createRequirePermission((userId) =>
  authService.getUserPermissions(userId),
);
