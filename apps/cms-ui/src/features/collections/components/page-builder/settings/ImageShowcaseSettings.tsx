/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  Image as ImageIcon,
  LayoutTemplate,
  PaintBucket,
} from 'lucide-react';
import {
  usePageBuilderStore,
  ImageItem,
  IMAGE_SHOWCASE_DEFAULTS,
} from '../stores/pageBuilderStore';

export const ImageShowcaseSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) =>
      state.imageShowcase[targetComponentId] ?? IMAGE_SHOWCASE_DEFAULTS,
  );
  const setImageShowcase = usePageBuilderStore(
    (state) => state.setImageShowcase,
  );

  const [newImageUrl, setNewImageUrl] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setImageShowcase(targetComponentId, { [field]: value });
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const newImage: ImageItem = {
      id: Math.random().toString(36).substring(7),
      url: newImageUrl,
      alt: 'New Image',
      caption: '',
    };
    handleChange('images', [...settings.images, newImage]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (id: string) => {
    handleChange(
      'images',
      settings.images.filter((img) => img.id !== id),
    );
  };

  const handleImageChange = (
    id: string,
    field: keyof ImageItem,
    value: string,
  ) => {
    handleChange(
      'images',
      settings.images.map((img) =>
        img.id === id ? { ...img, [field]: value } : img,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Image Showcase Settings</h3>
      </div>

      {/* Layout Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
          Layout Type
        </label>
        <select
          value={settings.layout}
          onChange={(e) => handleChange('layout', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground"
        >
          <option value="grid">Standard Grid</option>
          <option value="masonry">Masonry (Pinterest-style)</option>
          <option value="slider">Horizontal Slider</option>
          <option value="hero">Hero Background (Overlay)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {settings.layout === 'hero'
            ? 'The first image will be used as the massive background hero.'
            : 'Images will be laid out dynamically based on this selection.'}
        </p>
      </div>

      {/* Image Manager */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          Images
        </h4>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {settings.images.map((img, index) => (
            <div
              key={img.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Image {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Remove Image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={img.url}
                onChange={(e) =>
                  handleImageChange(img.id, 'url', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Image URL"
              />
              <input
                type="text"
                value={img.caption}
                onChange={(e) =>
                  handleImageChange(img.id, 'caption', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder={
                  settings.layout === 'hero' ? 'Hero Title' : 'Caption / Title'
                }
              />
              <input
                type="text"
                value={img.alt}
                onChange={(e) =>
                  handleImageChange(img.id, 'alt', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder={
                  settings.layout === 'hero'
                    ? 'Hero Description'
                    : 'Alt text (for accessibility)'
                }
              />
            </div>
          ))}
        </div>

        {/* Add New Image Form */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <span className="text-xs font-medium text-muted-foreground">
            Add New Image
          </span>
          <input
            type="text"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="Direct Image URL (https://...)"
            onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
          />
          <button
            onClick={handleAddImage}
            disabled={!newImageUrl.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Image
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
          {settings.layout !== 'hero' && (
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
          )}

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

          {settings.layout === 'hero' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs text-muted-foreground">
                  Overlay Opacity
                </label>
                <span className="text-xs font-medium">
                  {settings.overlayOpacity}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.overlayOpacity}
                onChange={(e) =>
                  handleChange('overlayOpacity', parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>
          )}

          {settings.layout !== 'hero' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">
                    Border Radius (px)
                  </label>
                  <span className="text-xs font-medium">
                    {settings.borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={settings.borderRadius}
                  onChange={(e) =>
                    handleChange('borderRadius', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs text-muted-foreground">
                    Grid Spacing (Gap px)
                  </label>
                  <span className="text-xs font-medium">{settings.gap}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="4"
                  value={settings.gap}
                  onChange={(e) =>
                    handleChange('gap', parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
