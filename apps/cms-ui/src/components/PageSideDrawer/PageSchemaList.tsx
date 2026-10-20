import React from 'react';
import { Boxes, Plus, Code2, Check, Clock } from 'lucide-react';
import type { PageSchemaListProps } from './drawer.types';

export const PageSchemaList: React.FC<PageSchemaListProps> = ({
  pageSchemas,
  onStartCreateSchema,
  onStartEditSchema,
  onSelectFillContent,
  onDeleteSchema,
}) => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-indigo-400">
            <Boxes className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Page Schemas</h3>
            <p className="text-xs text-zinc-400">
              Custom schema sections defined for this page. Each schema&apos;s
              fields become dynamic slots in the visual canvas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartCreateSchema}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Create Schema</span>
        </button>
      </div>

      {/* Schemas Table or Empty State */}
      {pageSchemas.length === 0 ? (
        <div className="p-12 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="size-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-indigo-400 flex items-center justify-center">
            <Code2 className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">
              No custom schemas defined for this page
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mt-1">
              Add a schema (such as Hero Section, Product Specs, Team Members)
              to provide dynamic fields for your canvas elements.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartCreateSchema}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create First Schema</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Page Schemas ({pageSchemas.length})
            </span>
            <span className="text-xs text-zinc-500">
              Configure schemas or fill content values below
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/40 text-zinc-400 font-medium">
                <th className="py-3 px-4 font-semibold">Schema Name & Key</th>
                <th className="py-3 px-4 font-semibold">Fields Count</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {pageSchemas.map((schema) => {
                const fields = schema.fields || [];
                const filledCount = fields.filter((f) => {
                  const val = schema.values?.[f.apiId];
                  return val !== undefined && val !== null && val !== '';
                }).length;

                return (
                  <tr
                    key={schema.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Name & Slug */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {schema.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors">
                            {schema.name}
                          </span>
                          <p className="text-[11px] font-mono text-zinc-500">
                            /{schema.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Fields count */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-xs font-mono font-medium text-zinc-300">
                        <Boxes className="size-3 text-indigo-400" />
                        <span>
                          {fields.length}{' '}
                          {fields.length === 1 ? 'field' : 'fields'}
                        </span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          filledCount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                        }`}
                      >
                        {filledCount > 0 ? (
                          <Check className="size-2.5" />
                        ) : (
                          <Clock className="size-2.5" />
                        )}
                        <span>
                          {filledCount}/{fields.length} filled
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectFillContent(schema.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-xs font-medium border border-indigo-500/20 transition-colors cursor-pointer"
                        >
                          Fill Values
                        </button>

                        <button
                          type="button"
                          onClick={() => onStartEditSchema(schema)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteSchema(schema.id, schema.name)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Schema"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
