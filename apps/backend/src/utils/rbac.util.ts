import type { Permission } from '../types/rbac.types.js';

/**
 * Pure permission check, shared by the Express `requirePermission`
 * middleware below and the GraphQL resolvers (`graphql.context.ts`) — RBAC
 * is exactly the kind of logic that must never drift between two transport
 * layers exposing the same content operations.
 */
export function hasPermission(
  permissions: Permission[],
  action: string,
  schemaId?: string,
): boolean {
  return permissions.some((p) => {
    const actionMatches = p.action === action || p.action === '*';
    const schemaMatches =
      !schemaId || p.schemaId === null || p.schemaId === schemaId;
    const effectAllows = p.effect === 'allow';
    return actionMatches && schemaMatches && effectAllows;
  });
}
