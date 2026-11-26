import type { ThemeConfig, BuiltinPresetId } from '../types/theme.types';

export const THEME_PRESETS: Record<BuiltinPresetId | 'custom', ThemeConfig> = {
  minimal: {
    presetId: 'minimal',
    name: 'Modern Minimal',
    description:
      'Clean, neutral aesthetics with sharp contrasts and modern sans-serif typography.',
    category: 'minimal',
    tokens: {
      colors: {
        primary: '#18181b',
        accent: '#2563eb',
        background: '#ffffff',
        surface: '#f4f4f5',
        text: '#09090b',
        muted: '#71717a',
      },
      typography: {
        fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '8px',
        containerWidth: '1200px',
      },
    },
  },
  editorial: {
    presetId: 'editorial',
    name: 'Editorial Serif',
    description:
      'Warm cream canvases with literary serif headings and refined amber accents.',
    category: 'editorial',
    tokens: {
      colors: {
        primary: '#78350f',
        accent: '#b45309',
        background: '#fefce8',
        surface: '#fef9c3',
        text: '#451a03',
        muted: '#92400e',
      },
      typography: {
        fontHeading: "'Merriweather', Georgia, serif",
        fontBody: "'Source Serif 4', Georgia, serif",
        baseFontSize: '18px',
      },
      layout: {
        borderRadius: '4px',
        containerWidth: '1024px',
      },
    },
  },
  'dark-tech': {
    presetId: 'dark-tech',
    name: 'Dark Tech',
    description:
      'Deep midnight surfaces, high-contrast crisp text, and neon emerald accents.',
    category: 'dark',
    tokens: {
      colors: {
        primary: '#10b981',
        accent: '#06b6d4',
        background: '#09090b',
        surface: '#18181b',
        text: '#fafafa',
        muted: '#a1a1aa',
      },
      typography: {
        fontHeading: "'Inter', system-ui, sans-serif",
        fontBody: "'Inter', system-ui, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '8px',
        containerWidth: '1200px',
      },
    },
  },
  vibrant: {
    presetId: 'vibrant',
    name: 'Vibrant Studio',
    description:
      'Bold indigo hues, rounded friendly components, and playful purple accents.',
    category: 'vibrant',
    tokens: {
      colors: {
        primary: '#6366f1',
        accent: '#ec4899',
        background: '#ffffff',
        surface: '#eef2ff',
        text: '#1e1b4b',
        muted: '#6b7280',
      },
      typography: {
        fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '12px',
        containerWidth: '1200px',
      },
    },
  },
  'nordic-slate': {
    presetId: 'nordic-slate',
    name: 'Nordic Slate',
    description:
      'Soft slate canvas, airy margins, calming sky blue accents, and clean modern readability.',
    category: 'minimal',
    tokens: {
      colors: {
        primary: '#0284c7',
        accent: '#38bdf8',
        background: '#f8fafc',
        surface: '#f1f5f9',
        text: '#0f172a',
        muted: '#64748b',
      },
      typography: {
        fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '8px',
        containerWidth: '1200px',
      },
    },
  },
  'neo-brutalist': {
    presetId: 'neo-brutalist',
    name: 'Neo-Brutalist',
    description:
      'Stark contrasts, high-energy canary accents, sharp geometric corners, and bold editorial impact.',
    category: 'creative',
    tokens: {
      colors: {
        primary: '#facc15',
        accent: '#f97316',
        background: '#ffffff',
        surface: '#fef08a',
        text: '#000000',
        muted: '#52525b',
      },
      typography: {
        fontHeading: "'JetBrains Mono', monospace",
        fontBody: 'system-ui, sans-serif',
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '0px',
        containerWidth: '1200px',
      },
    },
  },
  'luxury-gold': {
    presetId: 'luxury-gold',
    name: 'Luxury Atelier',
    description:
      'Opulent midnight obsidian canvas with champagne gold metallic highlights and refined serif headers.',
    category: 'luxury',
    tokens: {
      colors: {
        primary: '#d97706',
        accent: '#b45309',
        background: '#0f0f11',
        surface: '#1a1a1e',
        text: '#f4f4f5',
        muted: '#a1a1aa',
      },
      typography: {
        fontHeading: "'Playfair Display', Georgia, serif",
        fontBody: "'Source Serif 4', Georgia, serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '4px',
        containerWidth: '1200px',
      },
    },
  },
  'midnight-neon': {
    presetId: 'midnight-neon',
    name: 'Midnight Cyberpunk',
    description:
      'Deep space black with luminous electric violet and cyan glows for high-tech developer products.',
    category: 'dark',
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
        fontHeading: "'Inter', system-ui, sans-serif",
        fontBody: "'Inter', system-ui, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '12px',
        containerWidth: '1200px',
      },
    },
  },
  'fintech-corporate': {
    presetId: 'fintech-corporate',
    name: 'Fintech Enterprise',
    description:
      'Stripe-inspired corporate trust palette with crisp navy slate, royal blue actions, and enterprise polish.',
    category: 'corporate',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#4f46e5',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        muted: '#64748b',
      },
      typography: {
        fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '8px',
        containerWidth: '1440px',
      },
    },
  },
  'warm-journal': {
    presetId: 'warm-journal',
    name: 'Warm Journal',
    description:
      'Cozy artisanal coffee notes, warm sepia paper, terracotta accents, and relaxed reading ergonomics.',
    category: 'editorial',
    tokens: {
      colors: {
        primary: '#c2410c',
        accent: '#b45309',
        background: '#faf7f2',
        surface: '#f3ede2',
        text: '#292524',
        muted: '#78716c',
      },
      typography: {
        fontHeading: "'Merriweather', Georgia, serif",
        fontBody: "'Source Serif 4', Georgia, serif",
        baseFontSize: '18px',
      },
      layout: {
        borderRadius: '4px',
        containerWidth: '1024px',
      },
    },
  },
  custom: {
    presetId: 'custom',
    name: 'Custom Theme',
    description:
      'Fully personalized color palette and typography configuration.',
    category: 'custom',
    tokens: {
      colors: {
        primary: '#2563eb',
        accent: '#3b82f6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        muted: '#64748b',
      },
      typography: {
        fontHeading: 'system-ui, sans-serif',
        fontBody: 'system-ui, sans-serif',
        baseFontSize: '16px',
      },
      layout: {
        borderRadius: '8px',
        containerWidth: '1200px',
      },
    },
  },
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = THEME_PRESETS.minimal;
