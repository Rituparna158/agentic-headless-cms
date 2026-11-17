import React from 'react';
import { Check } from 'lucide-react';
import { BLOG_TYPES } from '../constants/blogTypes';
import type { BlogTypePickerProps } from '../types/blog.types';

export const BlogTypePicker: React.FC<BlogTypePickerProps> = ({
  selected,
  onChange,
  existingIds = [],
}) => {
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  return (
    <div
      role="group"
      aria-label="Blog types"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {BLOG_TYPES.map((t) => {
        const exists = existingIds.includes(t.id);
        const isSelected = selected.includes(t.id);
        const required = t.fields.filter((f) => f.isRequired).length;
        return (
          <button
            key={t.id}
            type="button"
            disabled={exists}
            aria-pressed={isSelected || exists}
            onClick={() => toggle(t.id)}
            className={`text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
              exists
                ? 'border-border bg-muted/40 opacity-70 cursor-not-allowed'
                : isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/40'
            }`}
          >
            <span className="text-xl leading-none mt-0.5" aria-hidden>
              {t.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {t.name}
                </span>
                {(isSelected || exists) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                    <Check size={11} />
                    {exists ? 'Added' : 'Selected'}
                  </span>
                )}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                {t.description}
              </span>
              <span className="block text-[11px] text-muted-foreground/80 mt-1">
                {t.fields.length} fields · {required} required
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
