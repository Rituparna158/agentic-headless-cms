import { ERROR_MESSAGES } from '@repo/constants';
import { authService } from '../auth/auth.service.js';
import { hasPermission, type Permission } from '@repo/utils/rbac';
import { ForbiddenError, UnauthorizedError } from '@repo/utils';
import { GraphQLContext } from '../../types/graphql.types.js';

const DRAFT_AUTHORIZED_ACTIONS = ['publish', 'update', 'create'];

async function resolvePermissions(
  context: GraphQLContext,
): Promise<Permission[]> {
  if (!context.user) {
    return [];
  }

  // API tokens carry their own role-scoped permissions; never evaluate creator's DB permissions
  if (context.user.isApiToken) {
    return context.user.permissions ?? [];
  }

  return authService.getUserPermissions(context.user.id, context.appId);
}

/** Check GraphQL permissions */
export async function assertPermission(
  context: GraphQLContext,
  action: string,
  schemaId?: string,
): Promise<void> {
  if (!context.user) {
    throw new UnauthorizedError(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED);
  }

  const permissions = await resolvePermissions(context);
  if (!hasPermission(permissions, action, schemaId)) {
    throw new ForbiddenError(ERROR_MESSAGES.RBAC.FORBIDDEN);
  }
}

/**
 * Determine whether the caller can access non-published (draft) content.
 * Evaluated strictly from effective permissions (bare `read` grants published access only).
 */
export async function isAuthorizedForDrafts(
  context: GraphQLContext,
  schemaId?: string,
): Promise<boolean> {
  if (!context.user) {
    return false;
  }

  const permissions = await resolvePermissions(context);
  return DRAFT_AUTHORIZED_ACTIONS.some((action) =>
    hasPermission(permissions, action, schemaId),
  );
}
