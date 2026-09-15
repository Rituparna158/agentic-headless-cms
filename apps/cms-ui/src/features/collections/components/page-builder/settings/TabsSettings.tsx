/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Settings, Plus, X, FolderOpen, PaintBucket } from 'lucide-react';
import {
  usePageBuilderStore,
  TabItem,
  TABS_DEFAULTS,
} from '../stores/pageBuilderStore';

export const TabsSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.tabs[targetComponentId] ?? TABS_DEFAULTS,
  );
  const setTabs = usePageBuilderStore((state) => state.setTabs);

  const [newTitle, setNewTitle] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setTabs(targetComponentId, { [field]: value });
  };

  const handleAddItem = () => {
    if (!newTitle.trim()) return;
    const newItem: TabItem = {
      id: Math.random().toString(36).substring(7),
      title: newTitle,
      content: 'New tab content goes here...',
    };
    handleChange('items', [...settings.items, newItem]);
    setNewTitle('');
  };

  const handleRemoveItem = (id: string) => {
    handleChange(
      'items',
      settings.items.filter((i) => i.id !== id),
    );
  };

  const handleItemChange = (
    id: string,
    field: keyof TabItem,
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
        <h3 className="font-medium text-foreground">Tabs Settings</h3>
      </div>

      {/* Items Manager */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          Tab Items
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {settings.items.map((item, index) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Tab {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tab Title
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    handleItemChange(item.id, 'title', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                  placeholder="Tab Title"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Tab Content (Text)
                </label>
                <textarea
                  value={item.content}
                  onChange={(e) =>
                    handleItemChange(item.id, 'content', e.target.value)
                  }
                  className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                  placeholder="Tab content here..."
                  rows={4}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="New Tab Title"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <button
            onClick={handleAddItem}
            disabled={!newTitle.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Tab
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
              Active Tab Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.activeColor}
                onChange={(e) => handleChange('activeColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.activeColor}
                onChange={(e) => handleChange('activeColor', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Inactive Tab Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.inactiveColor}
                onChange={(e) => handleChange('inactiveColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.inactiveColor}
                onChange={(e) => handleChange('inactiveColor', e.target.value)}
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
        </div>
      </div>
    </div>
  );
};
