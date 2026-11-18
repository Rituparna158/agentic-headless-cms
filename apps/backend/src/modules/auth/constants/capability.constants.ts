import type { Capability } from '../types/capability.types.js';

/** Entry kinds the appearance role may change (menus, shared sections, redirects). */
export const APPEARANCE_KINDS = ['menus', 'section', 'redirect'];

export const ANY_CAPABILITY: Capability[] = [
  'manage_content',
  'publish_content',
  'manage_media',
  'manage_appearance',
  'manage_settings',
  'manage_users',
  'manage_plugins',
];
