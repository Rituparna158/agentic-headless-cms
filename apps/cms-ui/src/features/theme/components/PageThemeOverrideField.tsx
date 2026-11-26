import React from 'react';
import { Palette, Sparkles, Sliders, Globe } from 'lucide-react';
import type {
  PageThemeSettings,
  ThemePresetId,
  CustomThemeTemplate,
} from '../types/theme.types';
import { THEME_PRESETS } from '../constants/theme.constants';

interface PageThemeOverrideFieldProps {
  value?: PageThemeSettings;
  globalPresetName?: string;
  customTemplates?: CustomThemeTemplate[];
  onChange: (value: PageThemeSettings) => void;
}

export const PageThemeOverrideField: React.FC<PageThemeOverrideFieldProps> = ({
  value = { mode: 'inherit' },
  globalPresetName = 'Modern Minimal',
  customTemplates = [],
  onChange,
}) => {
  const currentMode = value.mode || 'inherit';

  const handleModeChange = (mode: PageThemeSettings['mode']) => {
    if (mode === 'inherit') {
      onChange({ mode: 'inherit' });
    } else if (mode === 'preset') {
      onChange({
        mode: 'preset',
        presetId: value.presetId || 'dark-tech',
      });
    } else {
      onChange({
        mode: 'custom',
        overrides: value.overrides || {
          colors: {
            primary: '#18181b',
            accent: '#2563eb',
            background: '#ffffff',
          },
        },
      });
    }
  };

  const updateColor = (
    key: 'primary' | 'accent' | 'background' | 'surface',
    color: string,
  ) => {
    onChange({
      ...value,
      mode: 'custom',
      overrides: {
        ...(value.overrides || {}),
        colors: {
          ...(value.overrides?.colors || {}),
          [key]: color,
        },
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Palette size={15} />
        </span>
        <div>
          <h4 className="text-xs font-semibold text-foreground">
            Theme & Page Styling
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Configure how this specific page looks.
          </p>
        </div>
      </div>

      {/* Mode Switcher Segmented Control */}
      <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-lg text-[11px]">
        <button
          type="button"
          onClick={() => handleModeChange('inherit')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            currentMode === 'inherit'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe size={12} />
          <span>Inherit Site</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('preset')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            currentMode === 'preset'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={12} />
          <span>Template</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('custom')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            currentMode === 'custom'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders size={12} />
          <span>Custom</span>
        </button>
      </div>

      {/* Mode 1: Inherit View */}
      {currentMode === 'inherit' && (
        <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center justify-between text-foreground font-medium">
            <span>Global Site Theme:</span>
            <span className="text-indigo-400 font-semibold">
              {globalPresetName}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            This page inherits all typography, layout margins, and colors set in
            Site Theme.
          </p>
        </div>
      )}

      {/* Mode 2: Preset / Template View */}
      {currentMode === 'preset' && (
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-foreground block">
            Select Theme Template for This Page
          </label>
          <select
            value={value.presetId || 'dark-tech'}
            onChange={(e) =>
              onChange({
                mode: 'preset',
                presetId: e.target.value as ThemePresetId,
              })
            }
            className="w-full text-xs p-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {customTemplates.length > 0 && (
              <optgroup label="My Custom Templates">
                {customTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    ⭐ {t.name} (Custom)
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Curated Presets">
              {Object.values(THEME_PRESETS)
                .filter((p) => p.presetId !== 'custom')
                .map((p) => (
                  <option key={p.presetId} value={p.presetId}>
                    {p.name} — {p.description?.slice(0, 40)}...
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      )}

      {/* Mode 3: Custom View */}
      {currentMode === 'custom' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Primary Accent Color */}
            <div className="p-2.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Primary Accent
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.overrides?.colors?.primary || '#18181b'}
                  onChange={(e) => updateColor('primary', e.target.value)}
                  className="h-6 w-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-foreground uppercase">
                  {value.overrides?.colors?.primary || '#18181b'}
                </span>
              </div>
            </div>

            {/* Accent Color */}
            <div className="p-2.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Secondary Accent
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.overrides?.colors?.accent || '#2563eb'}
                  onChange={(e) => updateColor('accent', e.target.value)}
                  className="h-6 w-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-foreground uppercase">
                  {value.overrides?.colors?.accent || '#2563eb'}
                </span>
              </div>
            </div>

            {/* Background Color */}
            <div className="p-2.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Canvas Background
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.overrides?.colors?.background || '#ffffff'}
                  onChange={(e) => updateColor('background', e.target.value)}
                  className="h-6 w-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-foreground uppercase">
                  {value.overrides?.colors?.background || '#ffffff'}
                </span>
              </div>
            </div>

            {/* Surface Color */}
            <div className="p-2.5 rounded-lg border border-border bg-background/50 space-y-1">
              <span className="text-[10px] text-muted-foreground block font-medium">
                Card Surface
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value.overrides?.colors?.surface || '#f4f4f5'}
                  onChange={(e) => updateColor('surface', e.target.value)}
                  className="h-6 w-8 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="text-[11px] font-mono text-foreground uppercase">
                  {value.overrides?.colors?.surface || '#f4f4f5'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
