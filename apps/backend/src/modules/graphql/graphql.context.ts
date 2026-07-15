import { ERROR_MESSAGES } from '@repo/shared-types';
import { authService } from '../auth/auth.service.js';
import { hasPermission } from '../../utils/rbac.util.js';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../common/errors/http-error.js';
import { GraphQLContext } from '../../types/graphql.types.js';

/**
 * Resolver-side equivalent of the REST layer's requirePermission
 * middleware — GraphQL has one HTTP endpoint for many operations, so RBAC
 * can't be applied at the route level and has to be checked inside each
 * resolver instead. Throws HttpError subclasses; Apollo reports them via
 * the response's `errors[]` with their message, same as the REST error
 * handler would for the equivalent operation.
 */
export async function assertPermission(
  context: GraphQLContext,
  action: string,
  schemaId?: string,
): Promise<void> {
  if (!context.user) {
    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
  }

  const permissions = await authService.getUserPermissions(context.user.id);
  if (!hasPermission(permissions, action, schemaId)) {
    throw new ForbiddenError(ERROR_MESSAGES.RBAC.FORBIDDEN);
  }
}
