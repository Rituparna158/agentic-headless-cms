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

const DRAFT_AUTHORIZED_ROLES = new Set([
  'admin',
  'super_admin',
  'editor',
  'author',
]);

const DRAFT_AUTHORIZED_ACTIONS = ['manage', 'publish', 'update', 'create'];

/**
 * Determine whether the caller can access non-published (draft) content.
 * Bare `read` permissions grant access to published entries only.
 */
export async function isAuthorizedForDrafts(
  context: GraphQLContext,
  schemaId?: string,
): Promise<boolean> {
  if (!context.user) {
    return false;
  }

  const userRoles = context.user.roles ?? [];
  if (
    userRoles.some((role) => DRAFT_AUTHORIZED_ROLES.has(role.toLowerCase()))
  ) {
    return true;
  }

  const permissions =
    context.user.permissions && context.user.permissions.length > 0
      ? context.user.permissions
      : await authService.getUserPermissions(context.user.id, context.appId);

  return DRAFT_AUTHORIZED_ACTIONS.some((action) =>
    hasPermission(permissions, action, schemaId),
  );
}
