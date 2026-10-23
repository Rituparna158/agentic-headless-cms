import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  FileEdit,
  Star,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import type { PageSchemaFormProps } from './drawer.types';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import { SchemaMediaField } from './SchemaMediaField';
import { SchemaRichTextEditor } from './SchemaRichTextEditor';

export const PageSchemaForm: React.FC<PageSchemaFormProps> = ({
  schema,
  copiedToken,
  activeItemIndex = 0,
  onSelectActiveItem,
  onAddItem,
  onDeleteItem,
  isSaving,
  onCopyToken,
  onFieldValueChange,
  onBackToSchemas,
  onSaveForm,
}) => {
  const [activeMediaFieldApiId, setActiveMediaFieldApiId] = useState<
    string | null
  >(null);
  const isMulti = schema.entryType === 'multi';
  const items =
    Array.isArray(schema.items) && schema.items.length > 0
      ? schema.items
      : [schema.values || {}];
  const safeItemIndex = Math.max(
    0,
    Math.min(activeItemIndex, items.length - 1),
  );
  const currentValues = isMulti
    ? items[safeItemIndex] || {}
    : schema.values || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          type="button"
          onClick={onBackToSchemas}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Schemas Table</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-200">
            {schema.name || schema.slug || 'Schema'}
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
            /{schema.slug || 'schema'}
          </span>
          {isMulti && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Multi-Entry ({items.length})
            </span>
          )}
        </div>
      </div>

      {/* Multi-Item Selector & Controls */}
      {isMulti && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-indigo-400" />
              <span className="text-xs font-bold text-zinc-200">
                Dynamic List Items ({items.length})
              </span>
            </div>
            {onAddItem && (
              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add Item</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {items.map((item, idx) => {
              const itemTitle =
                typeof item.title === 'string' && item.title.trim()
                  ? item.title
                  : typeof item.name === 'string' && item.name.trim()
                    ? item.name
                    : `Item ${idx + 1}`;
              const isSelected = idx === safeItemIndex;

              return (
                <div
                  key={idx}
                  className={`flex items-center rounded-lg border text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-xs'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSelectActiveItem && onSelectActiveItem(idx)
                    }
                    className="px-3 py-1.5 cursor-pointer max-w-[160px] truncate"
                    title={itemTitle}
                  >
                    {itemTitle}
                  </button>
                  {items.length > 1 && onDeleteItem && isSelected && (
                    <button
                      type="button"
                      onClick={() => onDeleteItem(idx)}
                      className="pr-2 pl-1 py-1.5 text-indigo-200 hover:text-white transition-colors cursor-pointer"
                      title="Delete this item"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400">
            Editing{' '}
            <strong className="text-zinc-200">Item {safeItemIndex + 1}</strong>{' '}
            of {items.length}. In repeating feeds (
            <code className="text-indigo-300">[data-cms-repeat]</code>), each
            item renders as its own card automatically.
          </p>
        </div>
      )}

      {/* Dynamic Slot Tokens Bar */}
      <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
          Dynamic Token Shortcuts (Click to copy):
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(schema.fields || []).map((f) => (
            <button
              key={f.apiId}
              type="button"
              onClick={() => onCopyToken(f.apiId)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-mono transition-all cursor-pointer ${
                copiedToken === f.apiId
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 text-zinc-300'
              }`}
              title={`Click to copy {{${f.apiId}}}`}
            >
              <span>{`{{${f.apiId}}}`}</span>
              {copiedToken === f.apiId ? (
                <Check className="size-2.5 text-emerald-400" />
              ) : (
                <Copy className="size-2.5 text-zinc-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Inputs for this specific schema */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <FileEdit className="size-3.5 text-indigo-400" />
            <span>
              {schema.name || schema.slug || 'Schema'} Content Values{' '}
              {isMulti ? `(Item ${safeItemIndex + 1})` : ''}
            </span>
          </h4>
          <span className="text-xs text-zinc-500">
            Values automatically hydrate live in the visual canvas and preview
          </span>
        </div>

        <div className="space-y-4">
          {(schema.fields || []).map((field) => {
            const value = currentValues[field.apiId];

            return (
              <div
                key={field.apiId}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-200">
                    {field.displayName || field.apiId}
                    {field.isRequired && (
                      <span className="text-rose-400 ml-0.5">*</span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {field.dataType}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {field.apiId}
                    </span>
                  </div>
                </div>

                {/* Dynamic Specialized Input Controls */}
                {field.dataType === 'boolean' ? (
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onFieldValueChange(field.apiId, !value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        value ? 'bg-indigo-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-zinc-400 font-medium">
                      {value ? 'Enabled / True' : 'Disabled / False'}
                    </span>
                  </div>
                ) : field.dataType === 'color' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={
                        typeof value === 'string' &&
                        /^#[0-9a-f]{6}$/i.test(value)
                          ? value
                          : '#6366f1'
                      }
                      onChange={(e) =>
                        onFieldValueChange(field.apiId, e.target.value)
                      }
                      className="size-9 rounded-lg border border-zinc-800 bg-zinc-900 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={String(value || '')}
                      onChange={(e) =>
                        onFieldValueChange(field.apiId, e.target.value)
                      }
                      placeholder="#6366f1"
                      className="w-36 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                ) : field.dataType === 'rating' ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => onFieldValueChange(field.apiId, star)}
                        className="p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`size-5 ${
                            Number(value || 0) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-zinc-400 ml-2">
                      {Number(value || 0)} / 5 stars
                    </span>
                  </div>
                ) : field.dataType === 'media' ||
                  field.apiId === 'cover_image_url' ? (
                  <SchemaMediaField
                    value={typeof value === 'string' ? value : ''}
                    fieldApiId={field.apiId}
                    fieldDisplayName={field.displayName || field.apiId}
                    onChange={(newUrl) =>
                      onFieldValueChange(field.apiId, newUrl)
                    }
                    onOpenMediaPicker={() =>
                      setActiveMediaFieldApiId(field.apiId)
                    }
                  />
                ) : field.dataType === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) =>
                      onFieldValueChange(field.apiId, e.target.value)
                    }
                    placeholder={`Enter multi-line ${field.displayName}...`}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs leading-relaxed focus:outline-none focus:border-zinc-500"
                  />
                ) : field.dataType === 'richtext' ? (
                  <SchemaRichTextEditor
                    value={typeof value === 'string' ? value : ''}
                    fieldApiId={field.apiId}
                    fieldDisplayName={field.displayName || field.apiId}
                    onChange={(newVal) =>
                      onFieldValueChange(field.apiId, newVal)
                    }
                  />
                ) : field.dataType === 'code' || field.dataType === 'json' ? (
                  <textarea
                    rows={4}
                    value={
                      typeof value === 'object' && value !== null
                        ? JSON.stringify(value, null, 2)
                        : String(value || '')
                    }
                    onChange={(e) =>
                      onFieldValueChange(field.apiId, e.target.value)
                    }
                    placeholder="// Code snippet or raw JSON..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs font-mono focus:outline-none focus:border-zinc-500"
                  />
                ) : field.dataType === 'number' ? (
                  <input
                    type="number"
                    value={
                      value !== undefined && value !== null ? String(value) : ''
                    }
                    onChange={(e) =>
                      onFieldValueChange(
                        field.apiId,
                        e.target.value === '' ? '' : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                ) : field.dataType === 'date' ? (
                  <input
                    type="date"
                    value={String(value || '')}
                    onChange={(e) =>
                      onFieldValueChange(field.apiId, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                ) : field.dataType === 'datetime' ? (
                  <input
                    type="datetime-local"
                    value={String(value || '')}
                    onChange={(e) =>
                      onFieldValueChange(field.apiId, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(value || '')}
                    onChange={(e) =>
                      onFieldValueChange(field.apiId, e.target.value)
                    }
                    placeholder={`Enter ${field.displayName || field.apiId}...`}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onBackToSchemas}
          className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
        >
          Back to Schemas
        </button>

        <button
          type="button"
          onClick={onSaveForm}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Check className="size-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save & Apply to Page'}</span>
        </button>
      </div>

      {/* Centralized Media Asset Picker Modal */}
      <MediaAssetPickerModal
        isOpen={!!activeMediaFieldApiId}
        onClose={() => setActiveMediaFieldApiId(null)}
        onSelect={(asset) => {
          if (activeMediaFieldApiId) {
            const fullUrl = getMediaFileUrl(asset.url);
            onFieldValueChange(activeMediaFieldApiId, fullUrl);
            setActiveMediaFieldApiId(null);
          }
        }}
        title="Visual Asset Manager - Choose Field Image"
      />
    </div>
  );
};
