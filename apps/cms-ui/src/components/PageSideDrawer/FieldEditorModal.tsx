import React from 'react';
import { Sliders, Check } from 'lucide-react';
import type { DynamicFieldDataType } from '@/types/content.types';
import { FIELD_TYPE_GROUPS } from '@/constants/content-field-types.constants';
import type { FieldEditorModalProps } from './drawer.types';

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  editingFieldData,
  setEditingFieldData,
  onApplyChanges,
  onCancel,
}) => {
  return (
    <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/60 shadow-lg space-y-4 my-2 animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-indigo-400" />
          <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
            Update Field Definition
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Current API: {editingFieldData.originalApiId}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Field Name */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
            Field Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={editingFieldData.displayName}
            onChange={(e) => {
              const val = e.target.value;
              setEditingFieldData((prev) =>
                prev ? { ...prev, displayName: val } : null,
              );
            }}
            placeholder="e.g. Headline, Price"
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
            API Key (snake_case) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={editingFieldData.apiId}
            onChange={(e) => {
              const val = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
              setEditingFieldData((prev) =>
                prev ? { ...prev, apiId: val } : null,
              );
            }}
            placeholder="e.g. headline"
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Data Type */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
            Data Type
          </label>
          <select
            value={editingFieldData.dataType}
            onChange={(e) => {
              const val = e.target.value as DynamicFieldDataType;
              setEditingFieldData((prev) =>
                prev ? { ...prev, dataType: val } : null,
              );
            }}
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

        {/* Initial / Default Value */}
        <div>
          <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
            Default / Initial Value
          </label>
          <input
            type="text"
            value={editingFieldData.initialValue}
            onChange={(e) => {
              const val = e.target.value;
              setEditingFieldData((prev) =>
                prev ? { ...prev, initialValue: val } : null,
              );
            }}
            placeholder="Enter default value..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={editingFieldData.isRequired}
            onChange={(e) =>
              setEditingFieldData((prev) =>
                prev ? { ...prev, isRequired: e.target.checked } : null,
              )
            }
            className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-0"
          />
          <span>Required field</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApplyChanges}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Check className="size-3.5" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
