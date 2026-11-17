/**
 * Capabilities are what a role can do ("publish content", "manage media"…).
 * A role stores them as permissions with `condition.capability`.
 */
export type Capability =
  | 'manage_content'
  | 'publish_content'
  | 'manage_media'
  | 'manage_appearance'
  | 'manage_plugins'
  | 'manage_users'
  | 'manage_settings';

export interface CapPermission {
  action: string;
  effect: string;
  schemaId?: string | null;
  condition?: unknown;
}
