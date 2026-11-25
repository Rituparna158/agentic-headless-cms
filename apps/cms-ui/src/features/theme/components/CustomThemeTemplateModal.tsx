import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Type,
  Maximize2,
  Code2,
  Save,
  Eye,
} from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import {
  THEME_PRESETS,
  DEFAULT_THEME_CONFIG,
} from '../constants/theme.constants';
import type {
  CustomThemeTemplate,
  ThemeCategory,
  ThemeTokens,
  BuiltinPresetId,
} from '../types/theme.types';

interface CustomThemeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: CustomThemeTemplate | null;
  baseTokens?: ThemeTokens;
  onSave: (template: CustomThemeTemplate, applyLive: boolean) => void;
  onPreviewTemp?: (tokens: ThemeTokens) => void;
}

export const CustomThemeTemplateModal: React.FC<
  CustomThemeTemplateModalProps
> = ({
  isOpen,
  onClose,
  initialTemplate,
  baseTokens,
  onSave,
  onPreviewTemp,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ThemeCategory>('custom');
  const [tokens, setTokens] = useState<ThemeTokens>(
    baseTokens || DEFAULT_THEME_CONFIG.tokens,
  );
  const [activeTab, setActiveTab] = useState<
    'colors' | 'typography' | 'layout' | 'css'
  >('colors');
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description || '');
      setCategory(initialTemplate.category || 'custom');
      setTokens(initialTemplate.tokens);
    } else {
      setName('');
      setDescription('');
      setCategory('custom');
      setTokens(baseTokens || DEFAULT_THEME_CONFIG.tokens);
    }
    setPreviewing(false);
  }, [initialTemplate, baseTokens, isOpen]);

  if (!isOpen) return null;

  const handleCloneFromPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey as BuiltinPresetId];
    if (preset) {
      setTokens(JSON.parse(JSON.stringify(preset.tokens)));
      if (!name) {
        setName(`${preset.name} (Custom)`);
      }
      if (!description) {
        setDescription(`Customized version of ${preset.name}`);
      }
      if (preset.category) {
        setCategory(preset.category);
      }
    }
  };

  const updateColor = (key: keyof ThemeTokens['colors'], val: string) => {
    setTokens((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: val,
      },
    }));
  };

  const updateTypography = (
    key: keyof ThemeTokens['typography'],
    val: string,
  ) => {
    setTokens((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: val,
      },
    }));
  };

  const updateLayout = (key: keyof ThemeTokens['layout'], val: string) => {
    setTokens((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: val,
      },
    }));
  };

  const handlePreview = () => {
    if (onPreviewTemp) {
      onPreviewTemp(tokens);
      setPreviewing(true);
    }
  };

  const handleSubmit = (applyLive: boolean) => {
    const templateName = name.trim() || 'My Custom Template';
    const now = new Date().toISOString();
    const finalTemplate: CustomThemeTemplate = {
      id:
        initialTemplate?.id ||
        `custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: templateName,
      description: description.trim() || 'Custom user created theme template',
      category,
      tokens,
      createdAt: initialTemplate?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalTemplate, applyLive);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {initialTemplate
                  ? 'Edit Custom Template'
                  : 'Create Custom Theme Template'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Design your personalized theme template, customize colors,
                fonts, and spacing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Swatch Mini Preview Bar */}
        <div className="px-6 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px] font-medium">
              Palette Preview:
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="h-5 w-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: tokens.colors.primary }}
                title={`Primary: ${tokens.colors.primary}`}
              />
              <span
                className="h-5 w-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: tokens.colors.accent }}
                title={`Accent: ${tokens.colors.accent}`}
              />
              <span
                className="h-5 w-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: tokens.colors.background }}
                title={`Background: ${tokens.colors.background}`}
              />
              <span
                className="h-5 w-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: tokens.colors.surface }}
                title={`Surface: ${tokens.colors.surface}`}
              />
              <span
                className="h-5 w-5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: tokens.colors.text }}
                title={`Text: ${tokens.colors.text}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">
              Clone from:
            </span>
            <select
              onChange={(e) => handleCloneFromPreset(e.target.value)}
              defaultValue=""
              className="text-xs py-1 px-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="" disabled>
                Select Starter Preset...
              </option>
              {Object.values(THEME_PRESETS)
                .filter((p) => p.presetId !== 'custom')
                .map((p) => (
                  <option key={p.presetId} value={p.presetId}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Section: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Midnight Sapphire, Warm Autumn, Neo-Brand"
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Style Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ThemeCategory)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="custom">Custom</option>
                <option value="minimal">Minimal</option>
                <option value="editorial">Editorial</option>
                <option value="dark">Dark Mode</option>
                <option value="vibrant">Vibrant</option>
                <option value="corporate">Corporate</option>
                <option value="luxury">Luxury</option>
                <option value="creative">Creative</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground block">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clean typography with subtle shadows for product launch pages"
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-border gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-1.5 pb-2.5 px-2 font-medium border-b-2 transition-all ${
                activeTab === 'colors'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette size={13} />
              <span>Colors (6)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('typography')}
              className={`flex items-center gap-1.5 pb-2.5 px-2 font-medium border-b-2 transition-all ${
                activeTab === 'typography'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Type size={13} />
              <span>Typography</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-1.5 pb-2.5 px-2 font-medium border-b-2 transition-all ${
                activeTab === 'layout'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Maximize2 size={13} />
              <span>Layout & Geometry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('css')}
              className={`flex items-center gap-1.5 pb-2.5 px-2 font-medium border-b-2 transition-all ${
                activeTab === 'css'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 size={13} />
              <span>Custom CSS</span>
            </button>
          </div>

          {/* TAB 1: COLORS */}
          {activeTab === 'colors' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'primary' as const,
                  label: 'Primary Brand Color',
                  desc: 'Main buttons and key accents',
                },
                {
                  key: 'accent' as const,
                  label: 'Secondary Accent',
                  desc: 'Highlights, badges, and links',
                },
                {
                  key: 'background' as const,
                  label: 'Page Background',
                  desc: 'Base canvas and body tone',
                },
                {
                  key: 'surface' as const,
                  label: 'Card Surface',
                  desc: 'Cards, headers, and navbar blocks',
                },
                {
                  key: 'text' as const,
                  label: 'Primary Text',
                  desc: 'High-contrast headings and body',
                },
                {
                  key: 'muted' as const,
                  label: 'Muted Text',
                  desc: 'Subtitles, dates, and captions',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block">
                      {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="color"
                      value={tokens.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="h-7 w-9 rounded border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={tokens.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-20 text-[11px] font-mono px-2 py-1 rounded border border-border bg-background text-foreground uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Headings Font Family
                </label>
                <select
                  value={tokens.typography.fontHeading}
                  onChange={(e) =>
                    updateTypography('fontHeading', e.target.value)
                  }
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
                    Modern Sans-Serif (Inter / System)
                  </option>
                  <option value="'Merriweather', Georgia, serif">
                    Literary Serif (Merriweather)
                  </option>
                  <option value="'Playfair Display', Georgia, serif">
                    Display Luxury Serif (Playfair)
                  </option>
                  <option value="'JetBrains Mono', monospace">
                    Monospace Tech (JetBrains Mono)
                  </option>
                  <option value="'Roboto', sans-serif">
                    Roboto Clean Sans
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Body Font Family
                </label>
                <select
                  value={tokens.typography.fontBody}
                  onChange={(e) => updateTypography('fontBody', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground"
                >
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">
                    System Sans-Serif
                  </option>
                  <option value="'Source Serif 4', Georgia, serif">
                    Source Serif 4 (Longform Reading)
                  </option>
                  <option value="'Roboto', sans-serif">Roboto Clean</option>
                  <option value="'Inter', system-ui, sans-serif">
                    Inter Sans
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Base Font Sizing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['14px', '16px', '18px'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => updateTypography('baseFontSize', sz)}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        tokens.typography.baseFontSize === sz
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {sz}{' '}
                      {sz === '16px'
                        ? '(Standard)'
                        : sz === '14px'
                          ? '(Compact)'
                          : '(Comfortable)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Corner Rounding (Border Radius)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { val: '0px', label: '0px (Sharp)' },
                    { val: '4px', label: '4px (Subtle)' },
                    { val: '8px', label: '8px (Medium)' },
                    { val: '12px', label: '12px (Smooth)' },
                    { val: '9999px', label: 'Pill (Full)' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        updateLayout(
                          'borderRadius',
                          val as ThemeTokens['layout']['borderRadius'],
                        )
                      }
                      className={`py-2 rounded-xl border text-[11px] font-medium transition-all ${
                        tokens.layout.borderRadius === val
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Max Container Width
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '1024px', label: '1024px (Narrow / Focus)' },
                    { val: '1200px', label: '1200px (Standard Modern)' },
                    { val: '1440px', label: '1440px (Wide Screen)' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        updateLayout(
                          'containerWidth',
                          val as ThemeTokens['layout']['containerWidth'],
                        )
                      }
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        tokens.layout.containerWidth === val
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM CSS */}
          {activeTab === 'css' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Additional CSS Rules
              </label>
              <p className="text-[11px] text-muted-foreground">
                Injected globally. You can reference variables like{' '}
                <code>var(--theme-color-primary)</code> or{' '}
                <code>var(--theme-radius)</code>.
              </p>
              <textarea
                value={tokens.customCss || ''}
                onChange={(e) =>
                  setTokens((prev) => ({ ...prev, customCss: e.target.value }))
                }
                rows={8}
                placeholder="/* Custom CSS */&#10;.custom-card-glow {&#10;  box-shadow: 0 10px 30px -10px var(--theme-color-accent);&#10;}"
                className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-2">
            {onPreviewTemp && (
              <button
                type="button"
                onClick={handlePreview}
                className="px-3 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Eye
                  size={13}
                  className={previewing ? 'text-indigo-400' : ''}
                />
                <span>
                  {previewing
                    ? 'Preview Active in Frame'
                    : 'Live Preview on Site'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Save size={13} />
              <span>Save Template</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className={`${CMS_THEME_CLASSES.buttons.primary} text-xs font-semibold shadow-sm`}
            >
              <Sparkles size={13} />
              <span>Save & Apply Live</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
