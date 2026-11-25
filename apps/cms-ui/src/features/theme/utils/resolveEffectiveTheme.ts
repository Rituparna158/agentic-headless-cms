import type {
  ThemeConfig,
  PageThemeSettings,
  ThemeTokens,
  BuiltinPresetId,
  CustomThemeTemplate,
} from '../types/theme.types';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
} from '../constants/theme.constants';

/**
 * Resolves the final effective theme tokens for a given page by merging
 * the global site theme with any per-page overrides or custom templates.
 */
export function resolveEffectiveTheme(
  globalTheme: ThemeConfig | null | undefined,
  pageTheme?: PageThemeSettings | null,
  customTemplates?: CustomThemeTemplate[],
): ThemeTokens {
  const baseTheme = globalTheme || DEFAULT_THEME_CONFIG;

  if (!pageTheme || pageTheme.mode === 'inherit') {
    return baseTheme.tokens;
  }

  if (pageTheme.mode === 'preset' && pageTheme.presetId) {
    const builtin = THEME_PRESETS[pageTheme.presetId as BuiltinPresetId];
    if (builtin) return builtin.tokens;

    const list = customTemplates || baseTheme.customTemplates;
    const customMatch = list?.find((t) => t.id === pageTheme.presetId);
    if (customMatch) return customMatch.tokens;

    return baseTheme.tokens;
  }

  if (pageTheme.mode === 'custom' && pageTheme.overrides) {
    const o = pageTheme.overrides;
    return {
      colors: {
        ...baseTheme.tokens.colors,
        ...(o.colors || {}),
      },
      typography: {
        ...baseTheme.tokens.typography,
        ...(o.typography || {}),
      },
      layout: {
        ...baseTheme.tokens.layout,
        ...(o.layout || {}),
      },
      customCss: [baseTheme.tokens.customCss, o.customCss]
        .filter(Boolean)
        .join('\n'),
    };
  }

  return baseTheme.tokens;
}
