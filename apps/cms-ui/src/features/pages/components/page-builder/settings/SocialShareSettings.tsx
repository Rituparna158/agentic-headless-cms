/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Settings,
  Share2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LayoutGrid,
  PaintBucket,
} from 'lucide-react';
import {
  usePageBuilderStore,
  SOCIAL_SHARE_DEFAULTS,
} from '../stores/pageBuilderStore';

export const SocialShareSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.socialShare[targetComponentId] ?? SOCIAL_SHARE_DEFAULTS,
  );
  const setSocialShare = usePageBuilderStore((state) => state.setSocialShare);

  const handleChange = (field: keyof typeof settings, value: any) => {
    setSocialShare(targetComponentId, { [field]: value });
  };

  const handlePlatformChange = (platform: string, url: string) => {
    handleChange('platforms', { ...settings.platforms, [platform]: url });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Social Links Settings</h3>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Share2 className="w-4 h-4 text-muted-foreground" />
          Platform URLs
        </h4>
        <p className="text-xs text-muted-foreground">
          Leave URL blank to hide the icon.
        </p>

        {Object.entries(settings.platforms).map(([platform, url]) => (
          <div key={platform} className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {platform}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => handlePlatformChange(platform, e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
              placeholder={`https://${platform}.com/yourprofile`}
            />
          </div>
        ))}
      </div>

      {/* Layout */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          Layout
        </h4>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Style</label>
          <div className="flex bg-muted/50 p-1 rounded-md border border-border">
            {(['icons', 'buttons'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleChange('layout', l)}
                className={`flex-1 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                  settings.layout === l
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            Alignment
          </label>
          <div className="flex bg-muted/50 p-1 rounded-md border border-border">
            {[
              { id: 'left', icon: AlignLeft },
              { id: 'center', icon: AlignCenter },
              { id: 'right', icon: AlignRight },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleChange('alignment', id)}
                className={`flex-1 flex justify-center py-1.5 rounded transition-colors ${
                  settings.alignment === id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <PaintBucket className="w-4 h-4 text-muted-foreground" />
          Colors
        </h4>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Base Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.iconColor}
                onChange={(e) => handleChange('iconColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.iconColor}
                onChange={(e) => handleChange('iconColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Hover Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.hoverColor}
                onChange={(e) => handleChange('hoverColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.hoverColor}
                onChange={(e) => handleChange('hoverColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
