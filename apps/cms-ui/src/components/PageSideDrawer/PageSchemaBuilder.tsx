import React from 'react';
import { ArrowLeft, Check, Plus, Sliders, Trash2 } from 'lucide-react';
import { FIELD_TYPE_GROUPS } from '@/constants/content-field-types.constants';
import { slugify } from '@/utils/slugify.util';
import { FieldEditorModal } from './FieldEditorModal';
import type { PageSchemaBuilderProps } from './drawer.types';
import type { DynamicFieldDataType } from '@/types/content.types';

export const PageSchemaBuilder: React.FC<PageSchemaBuilderProps> = ({
  editingSchemaId,
  builderName,
  setBuilderName,
  builderSlug,
  setBuilderSlug,
  builderDesc,
  setBuilderDesc,
  builderFields,
  builderInitialValues,
  editingFieldData,
  setEditingFieldData,
  newFieldName,
  setNewFieldName,
  newFieldApiId,
  setNewFieldApiId,
  newFieldType,
  setNewFieldType,
  newFieldRequired,
  setNewFieldRequired,
  newFieldInitialValue,
  setNewFieldInitialValue,
  isSaving,
  onBackToOverview,
  onStartEditField,
  onRemoveField,
  onSaveEditedField,
  onAddField,
  onSaveSchema,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Schemas Overview</span>
        </button>

        <span className="text-xs font-bold text-zinc-200">
          {editingSchemaId
            ? `Edit Schema: ${builderName || 'Untitled'}`
            : 'Create New Schema'}
        </span>
      </div>

      {/* Schema Basic Info Card */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          1. Schema Information
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Schema Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={builderName}
              onChange={(e) => {
                setBuilderName(e.target.value);
                if (!editingSchemaId) {
                  setBuilderSlug(
                    slugify(e.target.value).replace(/[^a-z0-9_]/g, '_'),
                  );
                }
              }}
              placeholder="e.g. Hero Section, Product Specifications"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Schema API Key (Slug) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={builderSlug}
              onChange={(e) =>
                setBuilderSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                )
              }
              placeholder="e.g. hero_section"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Description (Optional)
          </label>
          <input
            type="text"
            value={builderDesc}
            onChange={(e) => setBuilderDesc(e.target.value)}
            placeholder="Brief note on what content this schema represents..."
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Schema Fields List & Management */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div>
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              2. Schema Fields ({builderFields.length})
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              These fields become bindable dynamic slots in the Visual Builder
            </p>
          </div>
        </div>

        {/* List of currently defined fields */}
        {builderFields.length === 0 ? (
          <div className="p-6 rounded-lg bg-zinc-950/50 border border-zinc-800/70 text-center text-xs text-zinc-500">
            No fields in this schema yet. Use the field adder below to define
            fields.
          </div>
        ) : (
          <div className="space-y-2">
            {builderFields.map((field) => {
              const isFieldEditing =
                editingFieldData?.originalApiId === field.apiId;
              const initialVal =
                builderInitialValues[field.apiId] !== undefined
                  ? String(builderInitialValues[field.apiId])
                  : '';

              if (isFieldEditing && editingFieldData) {
                return (
                  <FieldEditorModal
                    key={field.apiId}
                    editingFieldData={editingFieldData}
                    setEditingFieldData={setEditingFieldData}
                    onApplyChanges={onSaveEditedField}
                    onCancel={() => setEditingFieldData(null)}
                  />
                );
              }

              return (
                <div
                  key={field.apiId}
                  className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-100">
                      {field.displayName}
                    </span>
                    <span className="font-mono text-zinc-500 text-[11px]">
                      {field.apiId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] uppercase font-mono font-semibold text-zinc-300">
                      {field.dataType}
                    </span>
                    {field.isRequired && (
                      <span className="text-[10px] text-rose-400 font-medium">
                        *Required
                      </span>
                    )}
                    {initialVal ? (
                      <span className="text-[11px] text-zinc-500 italic max-w-xs truncate hidden sm:inline">
                        Default: &quot;{initialVal}&quot;
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onStartEditField(field)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit field name, API key, type, and default value"
                    >
                      <Sliders className="size-3 text-zinc-400" />
                      <span>Edit Field</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveField(field.apiId)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Remove Field"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Field Subform - Vast Selection of Field Types */}
        <form
          onSubmit={onAddField}
          className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
        >
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Plus className="size-3.5 text-indigo-400" />
            Add Field to Schema
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                Field Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newFieldName}
                onChange={(e) => {
                  setNewFieldName(e.target.value);
                  setNewFieldApiId(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  );
                }}
                placeholder="e.g. Headline, Price"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                API ID (snake_case) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newFieldApiId}
                onChange={(e) =>
                  setNewFieldApiId(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  )
                }
                placeholder="e.g. headline"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                Data Type
              </label>
              <select
                value={newFieldType}
                onChange={(e) =>
                  setNewFieldType(e.target.value as DynamicFieldDataType)
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
              >
                {FIELD_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.groupLabel} label={group.groupLabel}>
                    {group.options.map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                Initial Value (Optional)
              </label>
              <input
                type="text"
                value={newFieldInitialValue}
                onChange={(e) => setNewFieldInitialValue(e.target.value)}
                placeholder="Default value..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newFieldRequired}
                onChange={(e) => setNewFieldRequired(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-0"
              />
              <span>Required field</span>
            </label>

            <button
              type="submit"
              disabled={!newFieldName.trim() || !newFieldApiId.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Plus className="size-3" />
              <span>Add Field</span>
            </button>
          </div>
        </form>
      </div>

      {/* Save Schema Buttons */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onBackToOverview}
          className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSaveSchema}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Check className="size-3.5" />
          <span>
            {isSaving
              ? 'Saving...'
              : editingSchemaId
                ? 'Update Schema Details'
                : 'Save & Attach Schema'}
          </span>
        </button>
      </div>
    </div>
  );
};
