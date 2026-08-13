import { ERROR_MESSAGES } from '@repo/constants';
import { authService } from '../auth/auth.service.js';
import { hasPermission } from '@repo/utils/rbac';
import { ForbiddenError, UnauthorizedError } from '@repo/utils';
import { GraphQLContext } from '../../types/graphql.types.js';

/** Check GraphQL permissions */
export async function assertPermission(
  context: GraphQLContext,
  action: string,
  schemaId?: string,
): Promise<void> {
  if (!context.user) {
    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
  }

  const permissions = await authService.getUserPermissions(
    context.user.id,
    context.appId,
  );
  if (!hasPermission(permissions, action, schemaId)) {
    throw new ForbiddenError(ERROR_MESSAGES.RBAC.FORBIDDEN);
  }
}
