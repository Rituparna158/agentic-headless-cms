import { describe, it, expect, vi, beforeEach } from 'vitest';

const ca = vi.hoisted(() => ({
  createPage: vi.fn(),
  updatePage: vi.fn(),
  publishPage: vi.fn(),
}));
vi.mock('@/features/collections/api/collections.api', () => ({
  collectionsApi: ca,
}));

import { compileThemeToCss } from '../../../../src/features/theme/utils/themeCss.util';
import { resolveEffectiveTheme } from '../../../../src/features/theme/utils/resolveEffectiveTheme';
import {
  isThemeEntry,
  findThemeEntry,
  readThemeConfig,
  themeApi,
  importTemplateFromJson,
} from '../../../../src/features/theme/api/theme.api';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
} from '../../../../src/features/theme/constants/theme.constants';
import type { PageEntry } from '@/types/content.types';
import type { CustomThemeTemplate } from '../../../../src/features/theme/types/theme.types';

describe('Theme Feature Suite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Curated Presets Gallery', () => {
    it('provides expanded curated presets including Nordic, Neo-Brutalist, Luxury, Cyberpunk, and Fintech', () => {
      expect(THEME_PRESETS['nordic-slate']).toBeDefined();
      expect(THEME_PRESETS['neo-brutalist']).toBeDefined();
      expect(THEME_PRESETS['luxury-gold']).toBeDefined();
      expect(THEME_PRESETS['midnight-neon']).toBeDefined();
      expect(THEME_PRESETS['fintech-corporate']).toBeDefined();
      expect(THEME_PRESETS['warm-journal']).toBeDefined();

      // Check neo-brutalist characteristics
      expect(THEME_PRESETS['neo-brutalist'].tokens.layout.borderRadius).toBe(
        '0px',
      );
      expect(THEME_PRESETS['neo-brutalist'].tokens.colors.primary).toBe(
        '#facc15',
      );

      // Check luxury atelier characteristics
      expect(
        THEME_PRESETS['luxury-gold'].tokens.typography.fontHeading,
      ).toContain('Playfair Display');
      expect(THEME_PRESETS['luxury-gold'].tokens.colors.primary).toBe(
        '#d97706',
      );
    });
  });

  describe('compileThemeToCss', () => {
    it('compiles theme tokens into valid CSS variables', () => {
      const css = compileThemeToCss(THEME_PRESETS.minimal.tokens);
      expect(css).toContain('--theme-color-primary: #18181b;');
      expect(css).toContain('--theme-color-accent: #2563eb;');
      expect(css).toContain('--theme-color-bg: #ffffff;');
      expect(css).toContain('--theme-radius: 8px;');
      expect(css).toContain('--theme-max-width: 1200px;');
    });

    it('appends customCss if provided', () => {
      const css = compileThemeToCss({
        ...THEME_PRESETS.minimal.tokens,
        customCss: '.custom-header { box-shadow: none; }',
      });
      expect(css).toContain('.custom-header { box-shadow: none; }');
    });
  });

  describe('resolveEffectiveTheme', () => {
    it('returns global theme tokens when pageTheme is null or inherit', () => {
      const resolved = resolveEffectiveTheme(THEME_PRESETS.minimal, {
        mode: 'inherit',
      });
      expect(resolved).toEqual(THEME_PRESETS.minimal.tokens);

      const resolvedNull = resolveEffectiveTheme(THEME_PRESETS.minimal, null);
      expect(resolvedNull).toEqual(THEME_PRESETS.minimal.tokens);
    });

    it('returns preset tokens when page specifies a preset mode', () => {
      const resolved = resolveEffectiveTheme(THEME_PRESETS.minimal, {
        mode: 'preset',
        presetId: 'dark-tech',
      });
      expect(resolved).toEqual(THEME_PRESETS['dark-tech'].tokens);
      expect(resolved.colors.background).toBe('#09090b');
    });

    it('resolves user created custom template when page specifies custom template ID', () => {
      const customTpl: CustomThemeTemplate = {
        id: 'custom-tpl-alpha',
        name: 'Alpha Brand',
        category: 'custom',
        tokens: {
          ...THEME_PRESETS.minimal.tokens,
          colors: {
            ...THEME_PRESETS.minimal.tokens.colors,
            primary: '#e11d48',
          },
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const resolved = resolveEffectiveTheme(
        THEME_PRESETS.minimal,
        { mode: 'preset', presetId: 'custom-tpl-alpha' },
        [customTpl],
      );

      expect(resolved.colors.primary).toBe('#e11d48');
    });

    it('merges custom overrides on top of the global theme', () => {
      const resolved = resolveEffectiveTheme(THEME_PRESETS.minimal, {
        mode: 'custom',
        overrides: {
          colors: {
            primary: '#ff0055',
          },
        },
      });

      // Overridden color
      expect(resolved.colors.primary).toBe('#ff0055');
      // Inherited colors
      expect(resolved.colors.background).toBe(
        THEME_PRESETS.minimal.tokens.colors.background,
      );
      expect(resolved.colors.accent).toBe(
        THEME_PRESETS.minimal.tokens.colors.accent,
      );
      // Inherited layout and typography
      expect(resolved.typography).toEqual(
        THEME_PRESETS.minimal.tokens.typography,
      );
      expect(resolved.layout).toEqual(THEME_PRESETS.minimal.tokens.layout);
    });
  });

  describe('themeApi & Helpers', () => {
    it('isThemeEntry correctly identifies theme entries', () => {
      expect(
        isThemeEntry({
          id: '1',
          data: { kind: 'theme' },
        } as unknown as PageEntry),
      ).toBe(true);
      expect(
        isThemeEntry({
          id: '2',
          data: { kind: 'page' },
        } as unknown as PageEntry),
      ).toBe(false);
      expect(isThemeEntry({ id: '3' } as unknown as PageEntry)).toBe(false);
    });

    it('findThemeEntry returns the theme entry from an array of entries', () => {
      const list = [
        { id: '1', data: { kind: 'page' } },
        {
          id: '2',
          data: { kind: 'theme', tokens: THEME_PRESETS.minimal.tokens },
        },
      ] as unknown as PageEntry[];

      const found = findThemeEntry(list);
      expect(found?.id).toBe('2');
    });

    it('readThemeConfig falls back to default if entry has no tokens', () => {
      expect(readThemeConfig(null)).toEqual({
        ...DEFAULT_THEME_CONFIG,
        customTemplates: [],
      });
      expect(
        readThemeConfig({ id: '1', data: {} } as unknown as PageEntry),
      ).toEqual({
        ...DEFAULT_THEME_CONFIG,
        customTemplates: [],
      });
    });

    it('themeApi.save creates and publishes a new theme entry', async () => {
      ca.createPage.mockResolvedValue({ id: 'theme-entry-1' });
      ca.publishPage.mockResolvedValue({ id: 'theme-entry-1' });

      await themeApi.save('site-1', null, THEME_PRESETS.editorial);

      expect(ca.createPage).toHaveBeenCalledWith('site-1', {
        kind: 'theme',
        title: 'Site Theme',
        slug: '__theme',
        presetId: 'editorial',
        name: 'Editorial Serif',
        description: THEME_PRESETS.editorial.description,
        tokens: THEME_PRESETS.editorial.tokens,
        customTemplates: [],
      });
      expect(ca.publishPage).toHaveBeenCalledWith('site-1', 'theme-entry-1');
    });

    it('themeApi.save updates existing theme entry if present', async () => {
      ca.updatePage.mockResolvedValue({ id: 'existing-id' });
      ca.publishPage.mockResolvedValue({ id: 'existing-id' });

      await themeApi.save(
        'site-1',
        { id: 'existing-id', data: { kind: 'theme' } } as unknown as PageEntry,
        THEME_PRESETS['dark-tech'],
      );

      expect(ca.updatePage).toHaveBeenCalledWith('site-1', 'existing-id', {
        kind: 'theme',
        title: 'Site Theme',
        slug: '__theme',
        presetId: 'dark-tech',
        name: 'Dark Tech',
        description: THEME_PRESETS['dark-tech'].description,
        tokens: THEME_PRESETS['dark-tech'].tokens,
        customTemplates: [],
      });
      expect(ca.publishPage).toHaveBeenCalledWith('site-1', 'existing-id');
    });

    it('themeApi.saveCustomTemplate persists new custom template into site theme entry', async () => {
      ca.updatePage.mockResolvedValue({ id: 'existing-id' });
      ca.publishPage.mockResolvedValue({ id: 'existing-id' });

      const newTpl: CustomThemeTemplate = {
        id: 'tpl-101',
        name: 'My Custom Neon',
        category: 'dark',
        tokens: THEME_PRESETS['midnight-neon'].tokens,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      await themeApi.saveCustomTemplate(
        'site-1',
        { id: 'existing-id', data: { kind: 'theme' } } as unknown as PageEntry,
        newTpl,
        THEME_PRESETS.minimal,
      );

      expect(ca.updatePage).toHaveBeenCalledWith(
        'site-1',
        'existing-id',
        expect.objectContaining({
          customTemplates: [newTpl],
        }),
      );
    });

    it('themeApi.deleteCustomTemplate removes custom template from list', async () => {
      ca.updatePage.mockResolvedValue({ id: 'existing-id' });
      ca.publishPage.mockResolvedValue({ id: 'existing-id' });

      const existingTpl: CustomThemeTemplate = {
        id: 'tpl-to-delete',
        name: 'Old Template',
        tokens: THEME_PRESETS.minimal.tokens,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      const themeWithCustom = {
        ...THEME_PRESETS.minimal,
        customTemplates: [existingTpl],
      };

      await themeApi.deleteCustomTemplate(
        'site-1',
        { id: 'existing-id', data: { kind: 'theme' } } as unknown as PageEntry,
        'tpl-to-delete',
        themeWithCustom,
      );

      expect(ca.updatePage).toHaveBeenCalledWith(
        'site-1',
        'existing-id',
        expect.objectContaining({
          customTemplates: [],
        }),
      );
    });

    it('importTemplateFromJson validates and imports theme JSON correctly', () => {
      const validJson = JSON.stringify({
        name: 'Imported Neon Theme',
        description: 'Imported from external file',
        tokens: {
          colors: {
            primary: '#8b5cf6',
            accent: '#06b6d4',
            background: '#030712',
            surface: '#111827',
            text: '#f9fafb',
            muted: '#9ca3af',
          },
          typography: {
            fontHeading: 'Inter, sans-serif',
            fontBody: 'Inter, sans-serif',
            baseFontSize: '16px',
          },
          layout: {
            borderRadius: '12px',
            containerWidth: '1200px',
          },
        },
      });

      const result = importTemplateFromJson(validJson);
      expect(result.name).toBe('Imported Neon Theme');
      expect(result.tokens.colors.primary).toBe('#8b5cf6');
      expect(result.tokens.layout.borderRadius).toBe('12px');
      expect(result.id).toMatch(/^custom-/);
    });

    it('importTemplateFromJson throws descriptive error on invalid format', () => {
      expect(() => importTemplateFromJson('not json')).toThrow();
      expect(() =>
        importTemplateFromJson(JSON.stringify({ name: 'Incomplete' })),
      ).toThrow(/missing required design tokens/);
    });
  });
});
