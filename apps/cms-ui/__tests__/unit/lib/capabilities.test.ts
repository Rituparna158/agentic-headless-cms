import { describe, it, expect } from 'vitest';
import { userCan } from '../../../src/lib/capabilities';

const cap = (c: string, schemaId: string | null = null) => ({
  action: 'manage',
  effect: 'allow',
  schemaId,
  condition: { capability: c },
});

describe('userCan', () => {
  it('admins can do everything', () => {
    expect(userCan({ roles: ['admin'] }, 'publish_content')).toBe(true);
  });
  it('writers cannot publish unless given the capability', () => {
    const writer = { roles: ['writer'], permissions: [cap('manage_content')] };
    expect(userCan(writer, 'manage_content')).toBe(true);
    expect(userCan(writer, 'publish_content')).toBe(false);
  });
  it('respects the website a permission was given for', () => {
    const u = { roles: ['x'], permissions: [cap('manage_content', 'a')] };
    expect(userCan(u, 'manage_content', 'a')).toBe(true);
    expect(userCan(u, 'manage_content', 'b')).toBe(false);
  });
  it('reads older raw actions as capabilities', () => {
    const u = {
      roles: ['editor'],
      permissions: [{ action: 'publish', schemaId: null }],
    };
    expect(userCan(u, 'publish_content')).toBe(true);
    expect(userCan(u, 'manage_users')).toBe(false);
  });
  it('a signed-out user can do nothing', () => {
    expect(userCan(null, 'manage_content')).toBe(false);
  });
});

import { buildRolePermissions } from '../../../src/features/access/constants/access.constants';

describe('buildRolePermissions', () => {
  it('gives website-level capabilities to each chosen website', () => {
    const p = buildRolePermissions(['manage_content'], ['a', 'b']);
    expect(p.map((x) => x.schemaId)).toEqual(['a', 'b']);
  });
  it('applies to all websites when none are chosen', () => {
    expect(buildRolePermissions(['manage_media'], [])[0]!.schemaId).toBeNull();
  });
  it('keeps user management global', () => {
    const p = buildRolePermissions(['manage_users'], ['a']);
    expect(p).toHaveLength(1);
    expect(p[0]!.schemaId).toBeNull();
  });
});
