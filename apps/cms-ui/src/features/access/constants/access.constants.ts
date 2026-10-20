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
    description: 'Create, edit, and delete Posts, Pages, Tags, and Comments',
  },
  {
    id: 'publish_content',
    label: 'Publish Content',
    description: 'Authority to publish content directly',
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
