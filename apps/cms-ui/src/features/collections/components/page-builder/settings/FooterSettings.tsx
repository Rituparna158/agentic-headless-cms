/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  Type,
  Link as LinkIcon,
  AlignLeft,
  PaintBucket,
} from 'lucide-react';
import {
  usePageBuilderStore,
  NavbarLink,
  FOOTER_DEFAULTS,
} from '../stores/pageBuilderStore';

export const FooterSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.footer[targetComponentId] ?? FOOTER_DEFAULTS,
  );
  const setFooter = usePageBuilderStore((state) => state.setFooter);

  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setFooter(targetComponentId, { [field]: value });
  };

  const handleAddLink = () => {
    if (!newLinkLabel.trim()) return;
    const newLink: NavbarLink = {
      id: Math.random().toString(36).substring(7),
      label: newLinkLabel,
      url: newLinkUrl || '#',
    };
    handleChange('links', [...settings.links, newLink]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (id: string) => {
    handleChange(
      'links',
      settings.links.filter((l) => l.id !== id),
    );
  };

  const handleLinkChange = (
    id: string,
    field: keyof NavbarLink,
    value: string,
  ) => {
    handleChange(
      'links',
      settings.links.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Footer Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Brand */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            Brand/Logo Text
          </label>
          <input
            type="text"
            value={settings.brandText}
            onChange={(e) => handleChange('brandText', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
            placeholder="e.g. MyBrand"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-muted-foreground" />
            Description
          </label>
          <textarea
            value={settings.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
            placeholder="A short tagline or description..."
            rows={3}
          />
        </div>

        {/* Copyright */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Type className="w-4 h-4 text-muted-foreground" />
            Copyright Text
          </label>
          <input
            type="text"
            value={settings.copyrightText}
            onChange={(e) => handleChange('copyrightText', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
            placeholder="e.g. © 2026 MyBrand."
          />
        </div>
      </div>

      {/* Links Manager */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-muted-foreground" />
          Footer Links
        </h4>

        <div className="space-y-2">
          {settings.links.map((link) => (
            <div
              key={link.id}
              className="flex gap-2 items-center bg-muted/50 p-2 rounded-md"
            >
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) =>
                    handleLinkChange(link.id, 'label', e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs border border-input rounded bg-background"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) =>
                    handleLinkChange(link.id, 'url', e.target.value)
                  }
                  className="w-full px-2 py-1 text-xs border border-input rounded bg-background"
                  placeholder="URL (e.g. /about)"
                />
              </div>
              <button
                onClick={() => handleRemoveLink(link.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                title="Remove Link"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background text-foreground"
            placeholder="New Link Label"
            onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
          />
          <button
            onClick={handleAddLink}
            disabled={!newLinkLabel.trim()}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <PaintBucket className="w-4 h-4 text-muted-foreground" />
          Appearance
        </h4>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Background Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) =>
                  handleChange('backgroundColor', e.target.value)
                }
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) =>
                  handleChange('backgroundColor', e.target.value)
                }
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => handleChange('textColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Divider Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.dividerColor}
                onChange={(e) => handleChange('dividerColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.dividerColor}
                onChange={(e) => handleChange('dividerColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
