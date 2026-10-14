/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Settings, Plus, X, BarChart, PaintBucket } from 'lucide-react';
import {
  usePageBuilderStore,
  StatItem,
  STAT_COUNTER_DEFAULTS,
} from '../stores/pageBuilderStore';

export const StatCounterSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.statCounter[targetComponentId] ?? STAT_COUNTER_DEFAULTS,
  );
  const setStatCounter = usePageBuilderStore((state) => state.setStatCounter);

  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setStatCounter(targetComponentId, { [field]: value });
  };

  const handleAddItem = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    const newItem: StatItem = {
      id: Math.random().toString(36).substring(7),
      value: newValue,
      label: newLabel,
      prefix: '',
      suffix: '+',
    };
    handleChange('items', [...settings.items, newItem]);
    setNewValue('');
    setNewLabel('');
  };

  const handleRemoveItem = (id: string) => {
    handleChange(
      'items',
      settings.items.filter((i) => i.id !== id),
    );
  };

  const handleItemChange = (
    id: string,
    field: keyof StatItem,
    value: string,
  ) => {
    handleChange(
      'items',
      settings.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Stat Counter Settings</h3>
      </div>

      {/* Items Manager */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <BarChart className="w-4 h-4 text-muted-foreground" />
          Counters
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {settings.items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Counter {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Prefix
                  </label>
                  <input
                    type="text"
                    value={item.prefix}
                    onChange={(e) =>
                      handleItemChange(item.id, 'prefix', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Value
                  </label>
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) =>
                      handleItemChange(item.id, 'value', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium text-center"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={item.suffix}
                    onChange={(e) =>
                      handleItemChange(item.id, 'suffix', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                    placeholder="M+"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Label
                </label>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) =>
                    handleItemChange(item.id, 'label', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  placeholder="Users"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
              placeholder="Value (e.g. 100)"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
              placeholder="Label (e.g. Clients)"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
          </div>
          <button
            onClick={handleAddItem}
            disabled={!newValue.trim() || !newLabel.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Counter
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
            <label className="text-xs text-muted-foreground">
              Number Value Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.valueColor}
                onChange={(e) => handleChange('valueColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.valueColor}
                onChange={(e) => handleChange('valueColor', e.target.value)}
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
