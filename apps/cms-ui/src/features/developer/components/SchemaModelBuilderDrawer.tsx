import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Settings2,
  Layers,
  Check,
  AlertCircle,
  Loader2,
  Type,
} from 'lucide-react';
import { slugify } from '@/utils/slugify.util';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import type {
  DynamicFieldDefinition,
  DynamicFieldDataType,
} from '@/types/content.types';
import type {
  SchemaModelData,
  SchemaModelBuilderDrawerProps,
} from '../types/developer.types';
import { FIELD_TYPE_OPTIONS } from '../constants/developer.constants';

export type { SchemaModelData, SchemaModelBuilderDrawerProps };

export const SchemaModelBuilderDrawer: React.FC<
  SchemaModelBuilderDrawerProps
> = ({ isOpen, onClose, schema, onSave, isSaving }) => {
  const isEditing = Boolean(schema?.id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState<'single' | 'multi'>('single');
  const [fields, setFields] = useState<DynamicFieldDefinition[]>([]);

  // Field editing sub-form state
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null,
  );
  const [fieldDisplayName, setFieldDisplayName] = useState('');
  const [fieldApiId, setFieldApiId] = useState('');
  const [fieldDataType, setFieldDataType] =
    useState<DynamicFieldDataType>('text');
  const [fieldRequired, setFieldRequired] = useState(false);

  useEffect(() => {
    if (schema) {
      setName(schema.name || '');
      setSlug(schema.slug || '');
      setDescription(schema.description || '');
      setEntryType(schema.entryType || 'single');
      setFields(schema.fields || []);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setEntryType('single');
      setFields([
        {
          apiId: 'title',
          displayName: 'Title / Headline',
          dataType: 'text',
          isRequired: true,
        },
        {
          apiId: 'description',
          displayName: 'Description',
          dataType: 'textarea',
        },
      ]);
    }
  }, [schema, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val).replace(/[^a-z0-9_]/g, '_'));
    }
  };

  const handleOpenAddField = () => {
    setEditingFieldIndex(null);
    setFieldDisplayName('');
    setFieldApiId('');
    setFieldDataType('text');
    setFieldRequired(false);
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (index: number) => {
    const f = fields[index];
    if (!f) return;
    setEditingFieldIndex(index);
    setFieldDisplayName(f.displayName || f.apiId);
    setFieldApiId(f.apiId);
    setFieldDataType(f.dataType || 'text');
    setFieldRequired(Boolean(f.isRequired));
    setIsFieldModalOpen(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldDisplayName.trim() || !fieldApiId.trim()) return;

    const newField: DynamicFieldDefinition = {
      apiId: fieldApiId.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      displayName: fieldDisplayName.trim(),
      dataType: fieldDataType,
      isRequired: fieldRequired,
    };

    if (editingFieldIndex !== null) {
      setFields((prev) => {
        const next = [...prev];
        next[editingFieldIndex] = newField;
        return next;
      });
    } else {
      setFields((prev) => [...prev, newField]);
    }

    setIsFieldModalOpen(false);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    await onSave({
      id: schema?.id,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      entryType,
      fields,
      metadata: {
        ...(schema?.metadata || {}),
        entryType,
      },
    });
  };

  const getFieldTypeBadge = (dataType: DynamicFieldDataType) => {
    const found = FIELD_TYPE_OPTIONS.find((t) => t.type === dataType);
    const Icon = found?.icon || Type;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
        <Icon className="size-3 text-primary" />
        <span>{found?.label || dataType}</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl h-full bg-card border-l border-border flex flex-col text-card-foreground shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card/80">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-amber-500" />
              <h2 className="text-sm font-bold text-foreground">
                {isEditing
                  ? `Editing Schema: ${schema?.name || 'Untitled'}`
                  : 'Create New Content Schema'}
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define Single-Entry or Multi-Entry schemas for your page sections.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {/* 1. Basic Information */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3.5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              1. Schema Information
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Schema Display Name{' '}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Feature Cards Grid, CEO Statement"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Schema API Identifier (Slug){' '}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    )
                  }
                  placeholder="e.g. feature_cards_grid"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="schema-model-desc"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Description
                </label>
                <input
                  id="schema-model-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explains what content this schema represents"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Entry Type Selection */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              2. Schema Entry Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  entryType === 'single'
                    ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                    : 'bg-background border-border hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <input
                  id="entry-type-single"
                  type="radio"
                  name="entryType"
                  value="single"
                  checked={entryType === 'single'}
                  onChange={() => setEntryType('single')}
                  className="mt-0.5 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="entry-type-single"
                  aria-label="Single-Entry Section"
                  className="cursor-pointer"
                >
                  <span className="block text-xs font-semibold text-foreground">
                    Single-Entry Section
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    One fixed block per page (Hero, CEO Quote, Mission
                    statement).
                  </span>
                </label>
              </div>

              <div
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  entryType === 'multi'
                    ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                    : 'bg-background border-border hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <input
                  id="entry-type-multi"
                  type="radio"
                  name="entryType"
                  value="multi"
                  checked={entryType === 'multi'}
                  onChange={() => setEntryType('multi')}
                  className="mt-0.5 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="entry-type-multi"
                  aria-label="Multi-Entry (Repeatable)"
                  className="cursor-pointer"
                >
                  <span className="block text-xs font-semibold text-foreground">
                    Multi-Entry (Repeatable)
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                    Multiple repeatable items (Feature cards, FAQs, Team
                    members).
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 3. Fields in this Schema */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  3. Fields in this Schema
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Content fields presented to authors in the Post Publishing
                  Studio.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddField}
                className={CMS_THEME_CLASSES.buttons.secondary}
              >
                <Plus className="size-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-xl bg-background/50">
                <AlertCircle className="size-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  No fields defined yet
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddField}
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                >
                  + Add First Field
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div
                    key={`${field.apiId}-${idx}`}
                    className="p-3 bg-background rounded-xl border border-border flex items-center justify-between gap-3 shadow-2xs hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono text-muted-foreground font-semibold w-4">
                        {idx + 1}.
                      </span>
                      {getFieldTypeBadge(field.dataType)}
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate block">
                          &ldquo;{field.displayName || field.apiId}&rdquo;
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {field.apiId} {field.isRequired && '• (Required)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditField(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit Field"
                      >
                        <Settings2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Field"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Save & Cancel Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim() || !slug.trim()}
              className={CMS_THEME_CLASSES.buttons.primary}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>{isSaving ? 'Saving Schema...' : 'Save Schema'}</span>
            </button>
          </div>
        </form>

        {/* Sub-Modal: Add / Edit Field Dialog */}
        {isFieldModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl text-card-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <h4 className="text-xs font-bold text-foreground">
                  {editingFieldIndex !== null
                    ? 'Configure Field'
                    : 'Add Field to Schema'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveField} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="field-display-label-input"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    Display Label <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="field-display-label-input"
                    type="text"
                    required
                    value={fieldDisplayName}
                    onChange={(e) => {
                      setFieldDisplayName(e.target.value);
                      if (editingFieldIndex === null) {
                        setFieldApiId(
                          slugify(e.target.value).replace(/[^a-z0-9_]/g, '_'),
                        );
                      }
                    }}
                    placeholder="e.g. Card Title, Action Link"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-api-id-input"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    Field API ID <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="field-api-id-input"
                    type="text"
                    required
                    value={fieldApiId}
                    onChange={(e) =>
                      setFieldApiId(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, '_'),
                      )
                    }
                    placeholder="e.g. card_title, action_link"
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="field-data-type-select"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    Data Type
                  </label>
                  <select
                    id="field-data-type-select"
                    value={fieldDataType}
                    onChange={(e) =>
                      setFieldDataType(e.target.value as DynamicFieldDataType)
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="fieldRequired"
                    checked={fieldRequired}
                    onChange={(e) => setFieldRequired(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="fieldRequired"
                    className="text-xs text-foreground font-medium cursor-pointer"
                  >
                    Required field (cannot be empty)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsFieldModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Apply Field
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
