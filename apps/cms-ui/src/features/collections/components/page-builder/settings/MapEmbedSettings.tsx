/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Settings, MapPin, Maximize } from 'lucide-react';
import {
  usePageBuilderStore,
  MAP_EMBED_DEFAULTS,
} from '../stores/pageBuilderStore';

export const MapEmbedSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.mapEmbed[targetComponentId] ?? MAP_EMBED_DEFAULTS,
  );
  const setMapEmbed = usePageBuilderStore((state) => state.setMapEmbed);

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setMapEmbed(targetComponentId, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Map Settings</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Address / Location
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Enter any valid address or location name to show on the map.
        </p>
        <textarea
          value={settings.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
          rows={3}
          placeholder="1600 Amphitheatre Parkway, Mountain View, CA"
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Maximize className="w-4 h-4 text-muted-foreground" />
          Display Options
        </h4>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Map Height (px)</span>
            <span>{settings.height}px</span>
          </label>
          <input
            type="range"
            min="200"
            max="1000"
            step="50"
            value={settings.height}
            onChange={(e) => handleChange('height', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Zoom Level</span>
            <span>{settings.zoom}</span>
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={settings.zoom}
            onChange={(e) => handleChange('zoom', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
