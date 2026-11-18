import { describe, it, expect } from 'vitest';
import {
  hasCapability,
  canSeeSchema,
} from '../../../../src/modules/auth/capability.js';

const grant = (capability: string, schemaId: string | null = null) => ({
  action: 'manage',
  effect: 'allow',
  schemaId,
  condition: { capability },
});

describe('hasCapability', () => {
  it('lets administrators (wildcard) do everything', () => {
    expect(
      hasCapability(
        [{ action: '*', effect: 'allow', schemaId: null }],
        'publish_content',
        's1',
      ),
    ).toBe(true);
  });
  it('a writer without the publishing capability cannot publish', () => {
    const writer = [grant('manage_content')];
    expect(hasCapability(writer, 'manage_content')).toBe(true);
    expect(hasCapability(writer, 'publish_content')).toBe(false);
  });
  it('is limited to the websites a role was given', () => {
    const p = [grant('manage_content', 'site-a')];
    expect(hasCapability(p, 'manage_content', 'site-a')).toBe(true);
    expect(hasCapability(p, 'manage_content', 'site-b')).toBe(false);
  });
  it('a role for all websites applies everywhere', () => {
    expect(hasCapability([grant('manage_media')], 'manage_media', 'any')).toBe(
      true,
    );
  });
  it('accepts any of several capabilities', () => {
    expect(
      hasCapability(
        [grant('publish_content')],
        ['manage_content', 'publish_content'],
      ),
    ).toBe(true);
  });
  it('an explicit deny always wins', () => {
    const p = [
      grant('manage_content'),
      {
        action: 'manage',
        effect: 'deny',
        schemaId: null,
        condition: { capability: 'manage_content' },
      },
    ];
    expect(hasCapability(p, 'manage_content')).toBe(false);
  });
  it('ignores permissions with no capability', () => {
    expect(
      hasCapability(
        [{ action: 'read', effect: 'allow', schemaId: null }],
        'manage_content',
      ),
    ).toBe(false);
  });
});

describe('canSeeSchema', () => {
  it('shows a website only to roles given something on it', () => {
    const designer = [grant('manage_appearance', 'site-a')];
    expect(canSeeSchema(designer, 'site-a')).toBe(true);
    expect(canSeeSchema(designer, 'site-b')).toBe(false);
  });
  it('shows every website to a role that applies to all of them', () => {
    expect(canSeeSchema([grant('manage_content')], 'any')).toBe(true);
  });
  it('shows nothing to someone with no permissions', () => {
    expect(canSeeSchema([], 'site-a')).toBe(false);
  });
});
