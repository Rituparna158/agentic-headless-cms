export type Capability =
  | 'manage_content'
  | 'publish_content'
  | 'manage_media'
  | 'manage_appearance'
  | 'manage_plugins'
  | 'manage_users'
  | 'manage_settings';

export interface Perm {
  action: string;
  effect?: string;
  schemaId?: string | null;
  condition?: Record<string, unknown> | null;
}

export interface UserLike {
  roles?: string[] | null;
  permissions?: Perm[] | null;
}
