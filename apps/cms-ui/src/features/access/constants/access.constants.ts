export const USER_SORTABLE_COLUMNS = ['email', 'status', 'createdAt'] as const;
export const USER_SEARCHABLE_LABEL = 'Search users...';

export const CANONICAL_ADMIN_ROLES = ['admin', 'super_admin'] as const;
export type CanonicalAdminRole = (typeof CANONICAL_ADMIN_ROLES)[number];

export function isUserAdmin(roles?: string[] | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((role) =>
    CANONICAL_ADMIN_ROLES.includes(
      role.toLowerCase().trim() as CanonicalAdminRole,
    ),
  );
}

export const MFA_SORTABLE_COLUMNS = ['email', 'createdAt', 'status'] as const;

export const CMS_CAPABILITIES = [
  {
    id: 'manage_content',
    label: 'Manage Content',
    description:
      'Write and edit Posts, Pages, Tags, and Comments, and delete their own drafts',
  },
  {
    id: 'publish_content',
    label: 'Publish Content',
    description: 'Put content live or take it down, and delete live content',
  },
  {
    id: 'manage_media',
    label: 'Manage Media',
    description: 'Upload and organize files in the Media Library',
  },
  {
    id: 'manage_appearance',
    label: 'Manage Appearance',
    description: 'Customize Themes and Menus',
  },
  {
    id: 'manage_plugins',
    label: 'Manage Plugins',
    description: 'Install, activate, and configure Plugins',
  },
  {
    id: 'manage_users',
    label: 'Manage Users',
    description: 'Add, edit, and delete Users and Roles',
  },
  {
    id: 'manage_settings',
    label: 'Manage Settings',
    description: 'Access and modify Global Settings',
  },
] as const;

/** Capabilities that can be limited to certain websites. */
export const SITE_SCOPED_CAPABILITIES: readonly string[] = [
  'manage_content',
  'publish_content',
  'manage_media',
  'manage_appearance',
  'manage_settings',
];

/**
 * The permissions saved for a role: one per capability, and for website-level
 * capabilities one per chosen website (none chosen = every website).
 */
export function buildRolePermissions(
  capabilities: string[],
  siteIds: string[],
) {
  return capabilities.flatMap((capability) => {
    const targets =
      SITE_SCOPED_CAPABILITIES.includes(capability) && siteIds.length > 0
        ? siteIds
        : [null];
    return targets.map((schemaId) => ({
      schemaId,
      action: 'manage' as const,
      effect: 'allow' as const,
      condition: { capability },
    }));
  });
}
