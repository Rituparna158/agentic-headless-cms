import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import type {
  DynamicFieldDefinition,
  DynamicFieldDataType,
} from '@/types/content.types';
import {
  CUSTOM_BLOG_BASE_FIELDS,
  BLOG_FIELD_TYPE_OPTIONS as FIELD_TYPE_OPTIONS,
  LOCKED_BLOG_FIELDS as LOCKED,
  BLOG_LAYOUT_OPTIONS,
  type BlogShowcaseLayout,
} from '../constants/blogTypes';
import { toApiId } from '@/utils/apiId.util';
import type { CustomBlogTypeDialogProps } from '../types/blog.types';

export const CustomBlogTypeDialog: React.FC<CustomBlogTypeDialogProps> = ({
  existingIds,
  isSaving,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [layout, setLayout] = useState<BlogShowcaseLayout>('grid');
  const [fields, setFields] = useState<DynamicFieldDefinition[]>(
    CUSTOM_BLOG_BASE_FIELDS.map((f) => ({ ...f })),
  );
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<DynamicFieldDataType>('text');
  const [newOptions, setNewOptions] = useState('');

  const id = toApiId(name).replace(/_/g, '-');
  const idTaken = existingIds.includes(id);

  const addField = () => {
    const label = newLabel.trim();
    const apiId = toApiId(label);
    if (!label || !apiId || fields.some((f) => f.apiId === apiId)) return;
    const options =
      newType === 'select'
        ? newOptions
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;
    setFields((prev) => [
      ...prev,
      {
        apiId,
        displayName: label,
        dataType: newType,
        isRequired: false,
        sortOrder: prev.length,
        options: options?.map((o) => ({ label: o, value: o })),
        config: options
          ? { options: options.map((o) => ({ label: o, value: o })) }
          : {},
      },
    ]);
    setNewLabel('');
    setNewOptions('');
    setNewType('text');
  };

  const canCreate =
    Boolean(name.trim()) && Boolean(id) && !idTaken && !isSaving;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create a custom blog type"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Create a custom blog type
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Posts of this type are connected to a ready-made blog page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label
              htmlFor="cbt-name"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Blog type name
            </label>
            <input
              id="cbt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recipes, Podcasts, Press releases"
              className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {idTaken && (
              <p role="alert" className="text-[11px] text-destructive mt-1">
                A blog type with this name already exists.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Showcase Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BLOG_LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                    layout === opt.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">
                      {opt.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Fields</p>
            <ul className="space-y-1.5">
              {fields.map((f, i) => (
                <li
                  key={f.apiId}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background text-xs"
                >
                  <span className="flex-1 min-w-0 truncate font-medium text-foreground">
                    {f.displayName}
                  </span>
                  <span className="text-muted-foreground">
                    {FIELD_TYPE_OPTIONS.find((o) => o.value === f.dataType)
                      ?.label ?? f.dataType}
                  </span>
                  <label className="flex items-center gap-1 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(f.isRequired)}
                      disabled={LOCKED.has(f.apiId)}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((x, xi) =>
                            xi === i
                              ? { ...x, isRequired: e.target.checked }
                              : x,
                          ),
                        )
                      }
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    disabled={LOCKED.has(f.apiId)}
                    onClick={() =>
                      setFields((prev) => prev.filter((_, xi) => xi !== i))
                    }
                    aria-label={`Remove ${f.displayName}`}
                    className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-2">
              Keep Title, Summary, Cover image, Article, Author and Publish date
              so the blog page can show your posts without extra setup.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-foreground">Add a field</p>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Field name"
                aria-label="Field name"
                className="flex-1 min-w-[140px] text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={newType}
                onChange={(e) =>
                  setNewType(e.target.value as DynamicFieldDataType)
                }
                aria-label="Field type"
                className="text-xs px-2 py-2 rounded-lg border border-border bg-background"
              >
                {FIELD_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addField}
                disabled={!newLabel.trim()}
                className="inline-flex items-center gap-1 px-3 text-xs font-medium rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <Plus size={13} /> Add
              </button>
            </div>
            {newType === 'select' && (
              <input
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                placeholder="Dropdown choices, separated by commas"
                aria-label="Dropdown choices"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={() =>
              onCreate({
                id,
                name: name.trim(),
                postLabel: name.trim(),
                fields: fields.map((f, i) => ({ ...f, sortOrder: i })),
                layout,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Create blog type
          </button>
        </div>
      </div>
    </div>
  );
};
