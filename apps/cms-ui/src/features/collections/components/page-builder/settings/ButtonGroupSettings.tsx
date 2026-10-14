/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  MousePointer2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from 'lucide-react';
import {
  usePageBuilderStore,
  ButtonItem,
  BUTTON_GROUP_DEFAULTS,
} from '../stores/pageBuilderStore';

export const ButtonGroupSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.buttonGroup[targetComponentId] ?? BUTTON_GROUP_DEFAULTS,
  );
  const setButtonGroup = usePageBuilderStore((state) => state.setButtonGroup);

  const [newText, setNewText] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setButtonGroup(targetComponentId, { [field]: value });
  };

  const handleAddItem = () => {
    if (!newText.trim()) return;
    const newItem: ButtonItem = {
      id: Math.random().toString(36).substring(7),
      text: newText,
      url: '#',
      variant: 'solid',
      color: '#2563eb',
    };
    handleChange('buttons', [...settings.buttons, newItem]);
    setNewText('');
  };

  const handleRemoveItem = (id: string) => {
    handleChange(
      'buttons',
      settings.buttons.filter((i) => i.id !== id),
    );
  };

  const handleItemChange = (
    id: string,
    field: keyof ButtonItem,
    value: string | number | boolean | any[],
  ) => {
    handleChange(
      'buttons',
      settings.buttons.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Button Group Settings</h3>
      </div>

      {/* Items Manager */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <MousePointer2 className="w-4 h-4 text-muted-foreground" />
          Buttons
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {settings.buttons.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Button {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Text
                  </label>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) =>
                      handleItemChange(item.id, 'text', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                    placeholder="Click Me"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    URL
                  </label>
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) =>
                      handleItemChange(item.id, 'url', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Style
                  </label>
                  <select
                    value={item.variant}
                    onChange={(e) =>
                      handleItemChange(item.id, 'variant', e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  >
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="ghost">Ghost</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={item.color}
                      onChange={(e) =>
                        handleItemChange(item.id, 'color', e.target.value)
                      }
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={item.color}
                      onChange={(e) =>
                        handleItemChange(item.id, 'color', e.target.value)
                      }
                      className="flex-1 px-2 py-1 text-xs border border-input rounded bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="New Button Text"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <button
            onClick={handleAddItem}
            disabled={!newText.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Button
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          Container Layout
        </h4>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            Direction
          </label>
          <div className="flex bg-muted/50 p-1 rounded-md border border-border">
            {(['row', 'column'] as const).map((l) => (
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

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Gap (px)</label>
          <input
            type="number"
            value={settings.gap}
            onChange={(e) => handleChange('gap', Number(e.target.value))}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
          />
        </div>
      </div>
    </div>
  );
};
