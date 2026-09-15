/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  Settings,
  Plus,
  X,
  LayoutTemplate,
  PaintBucket,
  Star,
  User,
} from 'lucide-react';
import {
  usePageBuilderStore,
  ReviewItem,
  TESTIMONIAL_DEFAULTS,
} from '../stores/pageBuilderStore';

export const TestimonialsSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.testimonials[targetComponentId] ?? TESTIMONIAL_DEFAULTS,
  );
  const setTestimonial = usePageBuilderStore((state) => state.setTestimonial);

  const [newName, setNewName] = useState('');

  const handleChange = (
    field: keyof typeof settings,
    value: string | number | boolean | any[],
  ) => {
    setTestimonial(targetComponentId, { [field]: value });
  };

  const handleAddReview = () => {
    if (!newName.trim()) return;
    const newReview: ReviewItem = {
      id: Math.random().toString(36).substring(7),
      name: newName,
      role: 'Customer',
      quote: 'Great service!',
      avatar: `https://i.pravatar.cc/150?u=${Math.random()}`,
      rating: 5,
    };
    handleChange('reviews', [...settings.reviews, newReview]);
    setNewName('');
  };

  const handleRemoveReview = (id: string) => {
    handleChange(
      'reviews',
      settings.reviews.filter((r) => r.id !== id),
    );
  };

  const handleReviewChange = (
    id: string,
    field: keyof ReviewItem,
    value: string | number | boolean | any[],
  ) => {
    handleChange(
      'reviews',
      settings.reviews.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Testimonials Settings</h3>
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
          <option value="grid">Responsive Grid</option>
          <option value="slider">Horizontal Slider</option>
        </select>
      </div>

      {/* Reviews Manager */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Reviews
        </h4>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {settings.reviews.map((review, index) => (
            <div
              key={review.id}
              className="flex flex-col gap-2 bg-muted/30 p-3 rounded-md border border-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  Review {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveReview(review.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={review.name}
                onChange={(e) =>
                  handleReviewChange(review.id, 'name', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background font-medium"
                placeholder="Reviewer Name"
              />
              <input
                type="text"
                value={review.role}
                onChange={(e) =>
                  handleReviewChange(review.id, 'role', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Role / Title"
              />
              <textarea
                value={review.quote}
                onChange={(e) =>
                  handleReviewChange(review.id, 'quote', e.target.value)
                }
                className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
                placeholder="Quote"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-1">
                <label className="text-xs text-muted-foreground">Rating:</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={review.rating}
                  onChange={(e) =>
                    handleReviewChange(
                      review.id,
                      'rating',
                      parseInt(e.target.value),
                    )
                  }
                  className="w-16 px-2 py-1 text-xs border border-input rounded bg-background"
                />
                <Star className="w-3 h-3 text-yellow-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="flex flex-col gap-2 mt-4 p-3 bg-muted/50 rounded-md border border-border border-dashed">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-input rounded bg-background"
            placeholder="Reviewer Name"
            onKeyDown={(e) => e.key === 'Enter' && handleAddReview()}
          />
          <button
            onClick={handleAddReview}
            disabled={!newName.trim()}
            className="w-full py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Review
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
            <label className="text-xs text-muted-foreground">Card Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={settings.cardColor}
                onChange={(e) => handleChange('cardColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.cardColor}
                onChange={(e) => handleChange('cardColor', e.target.value)}
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
