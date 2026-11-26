export interface ThemeTokens {
  colors: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  typography: {
    fontHeading: string;
    fontBody: string;
    baseFontSize: '14px' | '16px' | '18px';
  };
  layout: {
    borderRadius: '0px' | '4px' | '8px' | '12px' | '9999px';
    containerWidth: '1024px' | '1200px' | '1440px';
  };
  customCss?: string;
}

export type BuiltinPresetId =
  | 'minimal'
  | 'editorial'
  | 'dark-tech'
  | 'vibrant'
  | 'nordic-slate'
  | 'neo-brutalist'
  | 'luxury-gold'
  | 'midnight-neon'
  | 'fintech-corporate'
  | 'warm-journal';

export type ThemePresetId = BuiltinPresetId | 'custom' | (string & {});

export type ThemeCategory =
  | 'all'
  | 'minimal'
  | 'editorial'
  | 'dark'
  | 'vibrant'
  | 'corporate'
  | 'creative'
  | 'luxury'
  | 'custom';

export interface ThemeConfig {
  presetId: ThemePresetId;
  name: string;
  description?: string;
  category?: ThemeCategory;
  isCustom?: boolean;
  tokens: ThemeTokens;
  customTemplates?: CustomThemeTemplate[];
}

export interface CustomThemeTemplate {
  id: string;
  name: string;
  description?: string;
  category?: ThemeCategory;
  tokens: ThemeTokens;
  createdAt: string;
  updatedAt: string;
}

export type PageThemeMode = 'inherit' | 'preset' | 'custom';

export interface PageThemeSettings {
  mode: PageThemeMode;
  presetId?: ThemePresetId;
  overrides?: {
    colors?: Partial<ThemeTokens['colors']>;
    typography?: Partial<ThemeTokens['typography']>;
    layout?: Partial<ThemeTokens['layout']>;
    customCss?: string;
  };
}
