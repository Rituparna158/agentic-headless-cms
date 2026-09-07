/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  Video,
  LayoutTemplate,
  PaintBucket,
} from 'lucide-react';
import {
  usePageBuilderStore,
  VideoItem,
  VIDEO_SHOWCASE_DEFAULTS,
} from '../stores/pageBuilderStore';

export const VideoShowcaseSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) =>
      state.videoShowcase[targetComponentId] ?? VIDEO_SHOWCASE_DEFAULTS,
  );
  const setVideoShowcase = usePageBuilderStore(
    (state) => state.setVideoShowcase,
  );

  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setVideoShowcase(targetComponentId, { [field]: value });
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) return;
    const newVideo: VideoItem = {
      id: Math.random().toString(36).substring(7),
      url: newVideoUrl,
      title: newVideoTitle,
      description: 'Enter a description for this video...',
    };
    handleChange('videos', [...settings.videos, newVideo]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  const handleRemoveVideo = (id: string) => {
    handleChange(
      'videos',
      settings.videos.filter((v) => v.id !== id),
    );
  };

  const handleVideoChange = (
    id: string,
    field: keyof VideoItem,
    value: string,
  ) => {
    handleChange(
      'videos',
      settings.videos.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Video Showcase Settings</h3>
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
          <option value="single">Single Video (Focal)</option>
          <option value="grid">Video Grid (Gallery)</option>
          <option value="hero">Hero Background (Autoplay Overlay)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {settings.layout === 'hero'
            ? 'The first video will loop automatically in the background.'
            : 'Videos will be rendered with standard play controls.'}
        </p>
      </div>

      {/* Video Manager */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Video className="w-4 h-4 text-muted-foreground" />
          Videos
        </h4>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {settings.videos.map((video, index) => (
            <div
              key={video.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Video {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveVideo(video.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Remove Video"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={video.url}
                onChange={(e) =>
                  handleVideoChange(video.id, 'url', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="YouTube URL or .mp4 link"
              />
              <input
                type="text"
                value={video.title}
                onChange={(e) =>
                  handleVideoChange(video.id, 'title', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                placeholder="Video Title"
              />
              <textarea
                value={video.description}
                onChange={(e) =>
                  handleVideoChange(video.id, 'description', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Video Description"
                rows={2}
              />
            </div>
          ))}
        </div>

        {/* Add New Video Form */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <span className="text-xs font-medium text-muted-foreground">
            Add New Video
          </span>
          <input
            type="text"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="Title"
          />
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="URL (YouTube or MP4)"
            onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
          />
          <button
            onClick={handleAddVideo}
            disabled={!newVideoUrl.trim() || !newVideoTitle.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Video
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
        </div>
      </div>
    </div>
  );
};
