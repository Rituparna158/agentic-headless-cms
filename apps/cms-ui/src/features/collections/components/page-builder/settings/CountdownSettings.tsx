/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Settings, Clock, PaintBucket } from 'lucide-react';
import {
  usePageBuilderStore,
  COUNTDOWN_DEFAULTS,
} from '../stores/pageBuilderStore';

export const CountdownSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.countdown[targetComponentId] ?? COUNTDOWN_DEFAULTS,
  );
  const setCountdown = usePageBuilderStore((state) => state.setCountdown);

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setCountdown(targetComponentId, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Countdown Settings</h3>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Target Date
        </h4>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date and Time</label>
          {/* Use datetime-local input type and map to/from ISO string */}
          <input
            type="datetime-local"
            value={
              settings.targetDate
                ? new Date(settings.targetDate).toISOString().slice(0, 16)
                : ''
            }
            onChange={(e) => {
              if (e.target.value) {
                handleChange(
                  'targetDate',
                  new Date(e.target.value).toISOString(),
                );
              }
            }}
            className="w-full px-2 py-1.5 text-sm border border-input rounded bg-background"
          />
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground">Labels</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">
              Days Label
            </label>
            <input
              type="text"
              value={settings.labelDays}
              onChange={(e) => handleChange('labelDays', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">
              Hours Label
            </label>
            <input
              type="text"
              value={settings.labelHours}
              onChange={(e) => handleChange('labelHours', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">
              Minutes Label
            </label>
            <input
              type="text"
              value={settings.labelMinutes}
              onChange={(e) => handleChange('labelMinutes', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">
              Seconds Label
            </label>
            <input
              type="text"
              value={settings.labelSeconds}
              onChange={(e) => handleChange('labelSeconds', e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            />
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
            <label className="text-xs text-muted-foreground">
              Number Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.numberColor}
                onChange={(e) => handleChange('numberColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.numberColor}
                onChange={(e) => handleChange('numberColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Label Text Color
            </label>
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
        </div>
      </div>
    </div>
  );
};
