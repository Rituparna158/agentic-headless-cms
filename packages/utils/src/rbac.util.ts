export interface Permission {
  action: string;
  schemaId: string | null;
  effect: string;
}

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
