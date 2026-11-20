import { describe, it, expect } from 'vitest';
import { toApiId, toSlug } from '../../../src/utils/apiId.util';

describe('toApiId', () => {
  it('snake-cases labels', () =>
    expect(toApiId(' Hello World! ')).toBe('hello_world'));
  it('strips leading digits', () => expect(toApiId('123 abc')).toBe('_abc'));
});

describe('toSlug', () => {
  it('kebab-cases values', () =>
    expect(toSlug('  Hello, World  ')).toBe('hello-world'));
  it('returns empty for symbols only', () => expect(toSlug('!!!')).toBe(''));
});
