import { collectionsApi } from '@/features/collections/api/collections.api';
import type { PageEntry } from '@/types/content.types';
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeTokens,
  CustomThemeTemplate,
} from '../types/theme.types';
import {
  DEFAULT_THEME_CONFIG,
  THEME_PRESETS,
} from '../constants/theme.constants';

const LOCAL_STORAGE_KEY_PREFIX = 'agentic_cms_custom_theme_templates_';

export const isThemeEntry = (e: PageEntry): boolean => e.data?.kind === 'theme';

export const findThemeEntry = (entries: PageEntry[]): PageEntry | null =>
  entries.find(isThemeEntry) ?? null;

/**
 * Retrieve custom templates from database entry or fallback localStorage cache.
 */
export const readCustomTemplates = (
  entry: PageEntry | null,
  siteSlug?: string,
): CustomThemeTemplate[] => {
  const d = entry?.data as Record<string, unknown> | undefined;
  if (d && Array.isArray(d.customTemplates) && d.customTemplates.length > 0) {
    if (typeof window !== 'undefined' && siteSlug) {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${siteSlug}`,
          JSON.stringify(d.customTemplates),
        );
      } catch {
        // Ignore localStorage quota errors
      }
    }
    return d.customTemplates as CustomThemeTemplate[];
  }

  if (typeof window !== 'undefined' && siteSlug) {
    try {
      const cached = localStorage.getItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${siteSlug}`,
      );
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed as CustomThemeTemplate[];
      }
    } catch {
      // Ignore parse errors
    }
  }

  return [];
};

export const readThemeConfig = (
  entry: PageEntry | null,
  siteSlug?: string,
): ThemeConfig => {
  const d = entry?.data as Record<string, unknown> | undefined;
  const customTemplates = readCustomTemplates(entry, siteSlug);

  if (!d || !d.tokens) {
    return {
      ...DEFAULT_THEME_CONFIG,
      customTemplates,
    };
  }

  return {
    presetId: (d.presetId as ThemePresetId) || 'custom',
    name: (d.name as string) || 'Custom Theme',
    description: (d.description as string) || '',
    tokens: d.tokens as ThemeTokens,
    customTemplates,
  };
};

/**
 * Export a theme or custom template to JSON for WordPress / Ghost style portability.
 */
export const exportTemplateAsJson = (
  template: ThemeConfig | CustomThemeTemplate,
  filename?: string,
): void => {
  const payload = {
    $schema: 'https://agentic-cms.org/schemas/theme-v1.json',
    generator: 'agentic-headless-cms',
    exportedAt: new Date().toISOString(),
    name: template.name,
    description: template.description || '',
    category: template.category || 'custom',
    tokens: template.tokens,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-theme.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Parse an uploaded JSON file into a valid CustomThemeTemplate.
 */
export const importTemplateFromJson = (
  jsonString: string,
): CustomThemeTemplate => {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid theme template file format.');
  }

  const tokens = parsed.tokens as ThemeTokens;
  if (!tokens || !tokens.colors || !tokens.typography || !tokens.layout) {
    throw new Error(
      'Theme template missing required design tokens (colors, typography, or layout).',
    );
  }

  const fallback = THEME_PRESETS.minimal.tokens;

  const validTokens: ThemeTokens = {
    colors: {
      primary: tokens.colors.primary || fallback.colors.primary,
      accent: tokens.colors.accent || fallback.colors.accent,
      background: tokens.colors.background || fallback.colors.background,
      surface: tokens.colors.surface || fallback.colors.surface,
      text: tokens.colors.text || fallback.colors.text,
      muted: tokens.colors.muted || fallback.colors.muted,
    },
    typography: {
      fontHeading:
        tokens.typography.fontHeading || fallback.typography.fontHeading,
      fontBody: tokens.typography.fontBody || fallback.typography.fontBody,
      baseFontSize:
        tokens.typography.baseFontSize || fallback.typography.baseFontSize,
    },
    layout: {
      borderRadius: tokens.layout.borderRadius || fallback.layout.borderRadius,
      containerWidth:
        tokens.layout.containerWidth || fallback.layout.containerWidth,
    },
    customCss: tokens.customCss || '',
  };

  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: typeof parsed.name === 'string' ? parsed.name : 'Imported Theme',
    description:
      typeof parsed.description === 'string'
        ? parsed.description
        : 'Imported custom theme template',
    category: parsed.category || 'custom',
    tokens: validTokens,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Site Theme is stored as a published entry of kind "theme" in the site's collection.
 */
export const themeApi = {
  save: async (
    siteSlug: string,
    existing: PageEntry | null,
    theme: ThemeConfig,
    customTemplates?: CustomThemeTemplate[],
  ): Promise<PageEntry> => {
    const list = customTemplates ?? theme.customTemplates ?? [];
    if (typeof window !== 'undefined' && siteSlug) {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_KEY_PREFIX}${siteSlug}`,
          JSON.stringify(list),
        );
      } catch {
        // Ignore
      }
    }

    const data = {
      kind: 'theme',
      title: 'Site Theme',
      slug: '__theme',
      presetId: theme.presetId,
      name: theme.name,
      description: theme.description || '',
      tokens: theme.tokens,
      customTemplates: list,
    };

    const saved = existing
      ? await collectionsApi.updatePage(siteSlug, existing.id, data)
      : await collectionsApi.createPage(siteSlug, data);

    return collectionsApi.publishPage(siteSlug, saved.id);
  },

  saveCustomTemplate: async (
    siteSlug: string,
    existingThemeEntry: PageEntry | null,
    template: CustomThemeTemplate,
    currentTheme: ThemeConfig,
  ): Promise<PageEntry> => {
    const currentList =
      currentTheme.customTemplates ||
      readCustomTemplates(existingThemeEntry, siteSlug);
    const existingIndex = currentList.findIndex((t) => t.id === template.id);

    const updatedList =
      existingIndex >= 0
        ? currentList.map((t) => (t.id === template.id ? template : t))
        : [...currentList, template];

    const updatedTheme: ThemeConfig = {
      ...currentTheme,
      customTemplates: updatedList,
    };

    return themeApi.save(
      siteSlug,
      existingThemeEntry,
      updatedTheme,
      updatedList,
    );
  },

  deleteCustomTemplate: async (
    siteSlug: string,
    existingThemeEntry: PageEntry | null,
    templateId: string,
    currentTheme: ThemeConfig,
  ): Promise<PageEntry> => {
    const currentList =
      currentTheme.customTemplates ||
      readCustomTemplates(existingThemeEntry, siteSlug);
    const updatedList = currentList.filter((t) => t.id !== templateId);

    const updatedTheme: ThemeConfig = {
      ...currentTheme,
      customTemplates: updatedList,
      // If active preset was this deleted template, fall back to minimal
      presetId:
        currentTheme.presetId === templateId
          ? 'minimal'
          : currentTheme.presetId,
    };

    return themeApi.save(
      siteSlug,
      existingThemeEntry,
      updatedTheme,
      updatedList,
    );
  },
};
