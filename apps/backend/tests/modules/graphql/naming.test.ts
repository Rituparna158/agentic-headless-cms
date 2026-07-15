import { describe, it, expect } from 'vitest';
import {
  toCamelCase,
  toPascalCase,
  toPluralCamelCase,
} from '../../../src/modules/graphql/naming.js';

describe('graphql naming helpers', () => {
  it('converts kebab-case slugs to PascalCase', () => {
    expect(toPascalCase('blog-post')).toBe('BlogPost');
    expect(toPascalCase('article')).toBe('Article');
  });

  it('converts kebab-case slugs to camelCase', () => {
    expect(toCamelCase('blog-post')).toBe('blogPost');
    expect(toCamelCase('article')).toBe('article');
  });

  it('pluralizes correctly, including irregular plurals', () => {
    expect(toPluralCamelCase('blog-post')).toBe('blogPosts');
    expect(toPluralCamelCase('category')).toBe('categories');
  });

  it('handles snake_case and multi-word slugs', () => {
    expect(toPascalCase('landing_page_section')).toBe('LandingPageSection');
  });
});
