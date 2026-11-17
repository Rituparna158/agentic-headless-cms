import { describe, it, expect } from 'vitest';
import {
  getStarterPagesForCategory,
  GENERAL_STARTER_PAGES,
  ECOMMERCE_STARTER_PAGES,
} from '@/features/collections/constants/starter-pages.constants';

describe('starter-pages.constants', () => {
  it('returns general starter pages by default or for general category', () => {
    const defaultPages = getStarterPagesForCategory();
    expect(defaultPages).toEqual(GENERAL_STARTER_PAGES);
    expect(defaultPages).toHaveLength(4);

    const keys = defaultPages.map((p) => p.key);
    expect(keys).toEqual(['home', 'about', 'contact', 'services']);
  });

  it('returns ecommerce starter pages when category is ecommerce or shop or amazon', () => {
    const ecomPages = getStarterPagesForCategory('ecommerce');
    expect(ecomPages).toEqual(ECOMMERCE_STARTER_PAGES);
    expect(ecomPages).toHaveLength(4);

    const amazonPages = getStarterPagesForCategory('tpl-amazon-product');
    expect(amazonPages).toEqual(ECOMMERCE_STARTER_PAGES);

    const keys = ecomPages.map((p) => p.key);
    expect(keys).toEqual(['store_home', 'products', 'orders', 'support']);
  });

  it('each starter page has distinct schemas and a valid grapesjs body layout', () => {
    const allPages = [...GENERAL_STARTER_PAGES, ...ECOMMERCE_STARTER_PAGES];

    for (const page of allPages) {
      expect(page.title).toBeTruthy();
      expect(page.slug).toBeTruthy();
      expect(page.badge).toBeTruthy();
      expect(page.body.builder).toBe('grapesjs');
      expect(typeof page.body.html).toBe('string');
      expect(page.body.html.trim().length).toBeGreaterThan(50);
      expect(Array.isArray(page.schemas)).toBe(true);
      expect(page.schemas.length).toBeGreaterThan(0);

      // Verify each schema has valid field definitions and initial values
      for (const schema of page.schemas) {
        expect(schema.id).toBeTruthy();
        expect(schema.name).toBeTruthy();
        expect(schema.slug).toBeTruthy();
        expect(schema.fields.length).toBeGreaterThan(0);

        if (schema.entryType === 'single') {
          expect(schema.values).toBeDefined();
        } else if (schema.entryType === 'multi') {
          expect(Array.isArray(schema.items)).toBe(true);
          expect(schema.items!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('starter page schemas are unique per page across general pages', () => {
    const schemaSlugs = GENERAL_STARTER_PAGES.flatMap((p) =>
      p.schemas.map((s) => s.slug),
    );
    const uniqueSlugs = new Set(schemaSlugs);
    // Every schema across all general starter pages has a unique slug/id
    expect(uniqueSlugs.size).toBe(schemaSlugs.length);
  });

  it('starter page schemas are unique per page across ecommerce pages', () => {
    const schemaSlugs = ECOMMERCE_STARTER_PAGES.flatMap((p) =>
      p.schemas.map((s) => s.slug),
    );
    const uniqueSlugs = new Set(schemaSlugs);
    expect(uniqueSlugs.size).toBe(schemaSlugs.length);
  });

  it('all data-cms-slot attributes in HTML map to valid schema field apiIds', () => {
    const allPages = [...GENERAL_STARTER_PAGES, ...ECOMMERCE_STARTER_PAGES];

    for (const page of allPages) {
      const allFieldApiIds = new Set(
        page.schemas.flatMap((s) => s.fields.map((f) => f.apiId)),
      );

      // Regex to find all data-cms-slot="something"
      const slotMatches = Array.from(
        page.body.html.matchAll(/data-cms-slot=["']([^"']+)["']/g),
      ).map((m) => m[1]);

      expect(slotMatches.length).toBeGreaterThan(0);
      for (const slotName of slotMatches) {
        if (!slotName) continue;
        expect(
          allFieldApiIds.has(slotName),
          `Page "${page.title}" has slot "${slotName}" in HTML which is missing in its schema fields!`,
        ).toBe(true);
      }
    }
  });

  it('every starter page has its section headers or titles slotted in the template HTML', () => {
    const allPages = [...GENERAL_STARTER_PAGES, ...ECOMMERCE_STARTER_PAGES];

    for (const page of allPages) {
      const hasHeaderSlot =
        page.body.html.includes('data-cms-slot="section_title"') ||
        page.body.html.includes('data-cms-slot="headline"');
      expect(
        hasHeaderSlot,
        `Page "${page.title}" (${page.key}) is missing a slotted section header or headline in its HTML!`,
      ).toBe(true);
    }
  });
});
