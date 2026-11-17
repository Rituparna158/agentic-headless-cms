import type { Capability } from '../types/capabilities.types';

/** Raw backend actions that older roles carry, read as capabilities. */
export const LEGACY_CAPABILITIES: Record<string, Capability[]> = {
  create: ['manage_content'],
  update: ['manage_content'],
  delete: ['manage_content'],
  publish: ['publish_content'],
};

export const LEGACY = LEGACY_CAPABILITIES;
