import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  Eye,
  Palette,
  Check,
  Plus,
  Copy,
  Trash2,
  ArrowLeft,
  FileEdit,
  Sliders,
  CheckCircle2,
  Clock,
  Code2,
  Boxes,
  Star,
} from 'lucide-react';
import {
  DynamicFieldDataType,
  DynamicFieldDefinition,
  PageCustomSchema,
  PageSideDrawerProps,
  EditingFieldFormData,
  PageSideDrawerView,
} from '../types/posts.types';
import { FIELD_TYPE_GROUPS } from '../constants/posts.constants';
import { slugify } from '../../collections/utils/slugify.util';
import { useToast } from '@repo/shared-ui';

export const PageSideDrawer: React.FC<PageSideDrawerProps> = ({
  isOpen,
  onClose,
  collection,
  page,
  onSavePage,
  isSaving,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page title and slug (completely isolated from schema content forms)
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Active view inside the drawer: 'table' (schemas list), 'builder' (schema editor), 'form' (content values)
  const [currentView, setCurrentView] = useState<PageSideDrawerView>('table');

  // Selected schema for form filling or editing
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);

  // Schemas attached to this page with isolated values
  const [pageSchemas, setPageSchemas] = useState<PageCustomSchema[]>([]);

  // Active schema selected for form filling
  const activeFormSchema = useMemo(() => {
    if (!selectedSchemaId) return null;
    return pageSchemas.find((s) => s.id === selectedSchemaId) || null;
  }, [pageSchemas, selectedSchemaId]);

  // Schema Builder State (used when creating or editing a schema)
  const [builderName, setBuilderName] = useState('');
  const [builderSlug, setBuilderSlug] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderFields, setBuilderFields] = useState<DynamicFieldDefinition[]>(
    [],
  );
  // Optional initial values map set directly during schema definition
  const [builderInitialValues, setBuilderInitialValues] = useState<
    Record<string, unknown>
  >({});

  // Field currently being edited in the builder list (with full meta: name, type, apiId, initial value)
  const [editingFieldData, setEditingFieldData] =
    useState<EditingFieldFormData | null>(null);
  // Track renamed fields so existing saved values migrate smoothly to the new API key
  const [renamedFieldsMap, setRenamedFieldsMap] = useState<
    Record<string, string>
  >({});

  // Quick field adder inside builder
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldApiId, setNewFieldApiId] = useState('');
  const [newFieldType, setNewFieldType] =
    useState<DynamicFieldDataType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldInitialValue, setNewFieldInitialValue] = useState('');

  const prevPageIdRef = useRef<string | null>(null);

  // Sync state whenever the page prop changes
  useEffect(() => {
    if (page) {
      const isDifferentPage = prevPageIdRef.current !== page.id;
      prevPageIdRef.current = page.id;

      setPageTitle(page.data?.title || '');
      setPageSlug(page.data?.slug || '');
      const rawSchemas = (page.data?._schemas as PageCustomSchema[]) || [];
      setPageSchemas(
        Array.isArray(rawSchemas)
          ? rawSchemas.map((s) => ({
              ...s,
              values:
                s.values && typeof s.values === 'object'
                  ? (s.values as Record<string, unknown>)
                  : {},
            }))
          : [],
      );
      if (isDifferentPage) {
        setCurrentView('table');
        setSelectedSchemaId(null);
        setEditingSchemaId(null);
      }
    }
  }, [page]);

  if (!isOpen || !collection || !page) return null;

  const handleSchemaFieldValueChange = (fieldApiId: string, value: unknown) => {
    if (!selectedSchemaId) return;
    setPageSchemas((prev) =>
      prev.map((s) => {
        if (s.id === selectedSchemaId) {
          return {
            ...s,
            values: {
              ...(s.values || {}),
              [fieldApiId]: value,
            },
          };
        }
        return s;
      }),
    );
  };

  const handleCopyToken = (slot: string) => {
    navigator.clipboard.writeText(`{{${slot}}}`);
    setCopiedToken(slot);
    setTimeout(() => setCopiedToken(null), 1800);
    toast.success(`Copied {{${slot}}} to clipboard!`);
  };

  // Open Schema Builder for a NEW schema
  const handleStartCreateSchema = () => {
    setEditingSchemaId(null);
    setBuilderName('');
    setBuilderSlug('');
    setBuilderDesc('');
    setBuilderFields([]);
    setBuilderInitialValues({});
    setEditingFieldData(null);
    setRenamedFieldsMap({});
    setNewFieldName('');
    setNewFieldApiId('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldInitialValue('');
    setCurrentView('builder');
  };

  // Open Schema Builder to EDIT an existing schema
  const handleStartEditSchema = (schema: PageCustomSchema) => {
    setEditingSchemaId(schema.id);
    setBuilderName(schema.name);
    setBuilderSlug(schema.slug);
    setBuilderDesc(schema.description || '');
    setBuilderFields([...(schema.fields || [])]);
    setBuilderInitialValues({ ...(schema.values || {}) });
    setEditingFieldData(null);
    setRenamedFieldsMap({});
    setNewFieldName('');
    setNewFieldApiId('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldInitialValue('');
    setCurrentView('builder');
  };

  // Open Field Update Editor for a specific field in the builder
  const handleStartEditField = (field: DynamicFieldDefinition) => {
    setEditingFieldData({
      originalApiId: field.apiId,
      displayName: field.displayName,
      apiId: field.apiId,
      dataType: field.dataType,
      isRequired: !!field.isRequired,
      initialValue:
        builderInitialValues[field.apiId] !== undefined
          ? String(builderInitialValues[field.apiId])
          : '',
    });
  };

  // Apply updates to a field's definition and initial value
  const handleSaveEditedField = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingFieldData) return;
    if (
      !editingFieldData.displayName.trim() ||
      !editingFieldData.apiId.trim()
    ) {
      toast.error('Field name and API key cannot be empty.');
      return;
    }

    let cleanApiId = editingFieldData.apiId
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+/, '');
    if (!/^[a-z]/.test(cleanApiId)) {
      cleanApiId = `f_${cleanApiId}`;
    }

    // Check if new API ID conflicts with another field in this schema
    if (
      builderFields.some(
        (f) =>
          f.apiId === cleanApiId && f.apiId !== editingFieldData.originalApiId,
      )
    ) {
      toast.error(
        `A field with API ID "${cleanApiId}" already exists in this schema.`,
      );
      return;
    }

    const updatedField: DynamicFieldDefinition = {
      displayName: editingFieldData.displayName.trim(),
      apiId: cleanApiId,
      dataType: editingFieldData.dataType,
      isRequired: editingFieldData.isRequired,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder:
        builderFields.find((f) => f.apiId === editingFieldData.originalApiId)
          ?.sortOrder || 1,
    };

    // Update builderFields list
    setBuilderFields((prev) =>
      prev.map((f) =>
        f.apiId === editingFieldData.originalApiId ? updatedField : f,
      ),
    );

    // If API key was renamed, track in renamedFieldsMap for data migration
    if (editingFieldData.originalApiId !== cleanApiId) {
      setRenamedFieldsMap((prev) => ({
        ...prev,
        [editingFieldData.originalApiId]: cleanApiId,
      }));
    }

    // Update initial values map
    setBuilderInitialValues((prev) => {
      const next = { ...prev };
      if (editingFieldData.originalApiId !== cleanApiId) {
        delete next[editingFieldData.originalApiId];
      }
      const val = editingFieldData.initialValue.trim();
      if (val) {
        let parsed: unknown = val;
        if (editingFieldData.dataType === 'number') parsed = Number(val);
        if (editingFieldData.dataType === 'boolean')
          parsed = val.toLowerCase() === 'true';
        next[cleanApiId] = parsed;
      } else {
        delete next[cleanApiId];
      }
      return next;
    });

    setEditingFieldData(null);
    toast.success(`Field "${updatedField.displayName}" updated!`);
  };

  // Add a field to the schema currently being built
  const handleAddFieldToBuilder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldApiId.trim()) return;

    let cleanApiId = newFieldApiId
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+/, '');
    if (!/^[a-z]/.test(cleanApiId)) {
      cleanApiId = `f_${cleanApiId}`;
    }

    // Check if field apiId already exists in builder
    if (builderFields.some((f) => f.apiId === cleanApiId)) {
      toast.error(`Field with API ID "${cleanApiId}" already exists.`);
      return;
    }

    const fieldDef: DynamicFieldDefinition = {
      displayName: newFieldName.trim(),
      apiId: cleanApiId,
      dataType: newFieldType,
      isRequired: newFieldRequired,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: builderFields.length + 1,
    };

    setBuilderFields((prev) => [...prev, fieldDef]);

    // If an initial value was provided, set it in builder initial values
    if (newFieldInitialValue.trim()) {
      let parsedVal: unknown = newFieldInitialValue.trim();
      if (newFieldType === 'number') parsedVal = Number(newFieldInitialValue);
      if (newFieldType === 'boolean')
        parsedVal = newFieldInitialValue.toLowerCase() === 'true';
      setBuilderInitialValues((prev) => ({
        ...prev,
        [cleanApiId]: parsedVal,
      }));
    }

    setNewFieldName('');
    setNewFieldApiId('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldInitialValue('');
  };

  const handleRemoveFieldFromBuilder = (apiId: string) => {
    setBuilderFields((prev) => prev.filter((f) => f.apiId !== apiId));
    setBuilderInitialValues((prev) => {
      const next = { ...prev };
      delete next[apiId];
      return next;
    });
    if (editingFieldData?.originalApiId === apiId) {
      setEditingFieldData(null);
    }
  };

  // Save the Schema (either new or updated) to this page ONLY.
  // Schemas are stored inside page.data._schemas and do NOT pollute the collection level.
  const handleSaveSchema = async () => {
    if (!builderName.trim() || !builderSlug.trim()) {
      toast.error('Please enter a schema name and slug.');
      return;
    }

    if (builderFields.length === 0) {
      toast.error('Please add at least one field to this schema.');
      return;
    }

    const cleanBuilderSlug = builderSlug
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+/, '');

    let updatedSchemas: PageCustomSchema[] = [];

    if (editingSchemaId) {
      // Update existing schema: preserve existing filled values, migrating any renamed field keys
      updatedSchemas = pageSchemas.map((s) => {
        if (s.id === editingSchemaId) {
          const mergedValues = { ...(s.values || {}) };
          // Migrate values from renamed fields
          for (const [oldKey, newKey] of Object.entries(renamedFieldsMap)) {
            if (mergedValues[oldKey] !== undefined) {
              mergedValues[newKey] = mergedValues[oldKey];
              delete mergedValues[oldKey];
            }
          }
          // Merge builder initial values
          Object.assign(mergedValues, builderInitialValues);

          return {
            ...s,
            name: builderName.trim(),
            slug: cleanBuilderSlug,
            description: builderDesc.trim() || undefined,
            fields: builderFields,
            values: mergedValues,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    } else {
      // Create new schema with builderInitialValues
      const newSchema: PageCustomSchema = {
        id: `schema_${Date.now()}`,
        name: builderName.trim(),
        slug: cleanBuilderSlug,
        description: builderDesc.trim() || undefined,
        fields: builderFields,
        values: { ...builderInitialValues },
        createdAt: new Date().toISOString(),
      };
      updatedSchemas = [...pageSchemas, newSchema];
    }

    setPageSchemas(updatedSchemas);

    // Persist schemas inside page.data._schemas directly to PostgreSQL
    const updatedData = {
      ...page.data,
      title: pageTitle.trim() || page.data?.title || 'Untitled',
      slug: pageSlug.trim() || page.data?.slug || 'page',
      _schemas: updatedSchemas,
    };

    await onSavePage(page.id, updatedData, false);
    setCurrentView('table');
    toast.success(
      editingSchemaId
        ? `Schema "${builderName}" updated successfully!`
        : `Schema "${builderName}" created and attached to page!`,
    );
  };

  // Delete a schema from this page
  const handleDeleteSchema = async (schemaId: string, schemaName: string) => {
    if (!confirm(`Are you sure you want to remove schema "${schemaName}"?`))
      return;

    const updatedSchemas = pageSchemas.filter((s) => s.id !== schemaId);
    setPageSchemas(updatedSchemas);

    const updatedData = {
      ...page.data,
      title: pageTitle.trim() || page.data?.title || 'Untitled',
      slug: pageSlug.trim() || page.data?.slug || 'page',
      _schemas: updatedSchemas,
    };

    await onSavePage(page.id, updatedData, false);
    toast.success(`Schema "${schemaName}" removed.`);
  };

  // Save filled values for the active schema specifically
  const handleSaveSchemaForm = async () => {
    if (!page) return;
    const titleVal = pageTitle.trim() || page.data?.title || 'Untitled';
    const slugVal = pageSlug.trim() || page.data?.slug || 'page';

    const updatedData = {
      ...page.data,
      title: titleVal,
      slug: slugVal,
      _schemas: pageSchemas,
    };

    await onSavePage(page.id, updatedData, false);
    toast.success(
      activeFormSchema
        ? `Saved content for "${activeFormSchema.name}"!`
        : 'Schema values saved!',
    );
    setCurrentView('table');
  };

  // Save entire page (title, slug, and attached schemas)
  const handleSavePageData = async (publishImmediately: boolean) => {
    const titleVal = pageTitle.trim();
    if (!titleVal) {
      toast.error('Page title cannot be empty.');
      return;
    }

    const submission = {
      ...page.data,
      title: titleVal,
      slug: pageSlug.trim() || slugify(titleVal),
      _schemas: pageSchemas,
    };

    await onSavePage(page.id, submission, publishImmediately);
  };

  const isPublished = page.status === 'published';
  const cleanSlug = (pageSlug || page.data?.slug || page.id).replace(
    /^\/+/,
    '',
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel - Expanded width for comfortable workstation editing */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-5xl bg-[#09090b] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 text-zinc-100">
          {/* 1. Drawer Header */}
          <div className="px-6 py-3.5 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <span className="font-semibold text-zinc-300">
                  {collection.name}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="text-indigo-400 font-mono text-[11px]">
                  /{cleanSlug}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="Page Title"
                  className="text-base font-bold text-zinc-100 bg-transparent border-none outline-none focus:ring-1 focus:ring-zinc-600 rounded px-1 py-0.5"
                />
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                  }`}
                >
                  {isPublished ? (
                    <CheckCircle2 className="size-2.5" />
                  ) : (
                    <Clock className="size-2.5" />
                  )}
                  <span>{isPublished ? 'Live' : 'Draft'}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `/collections/${collection.slug}/preview/${cleanSlug}`,
                    '_blank',
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                title="Open Live Preview"
              >
                <Eye className="size-3.5 text-sky-400" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/collections/${collection.slug}/${page.id}`)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                title="Open Canvas Editor"
              >
                <Palette className="size-3.5 text-indigo-400" />
                <span>Canvas Editor</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ml-1"
                title="Close Drawer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* 2. Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* VIEW A: Schemas Table (Default View) */}
            {currentView === 'table' && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700/60 text-indigo-400">
                      <Boxes className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">
                        Page Schemas
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Custom schema sections defined for this page. Each
                        schema&apos;s fields become dynamic slots in the visual
                        canvas.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCreateSchema}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
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
                        Add a schema (such as Hero Section, Product Specs, Team
                        Members) to provide dynamic fields for your canvas
                        elements.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCreateSchema}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all"
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
                          <th className="py-3 px-4 font-semibold">
                            Schema Name & Key
                          </th>
                          <th className="py-3 px-4 font-semibold">
                            Fields Count
                          </th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {pageSchemas.map((schema) => {
                          const fields = schema.fields || [];
                          const filledCount = fields.filter((f) => {
                            const val = schema.values?.[f.apiId];
                            return (
                              val !== undefined && val !== null && val !== ''
                            );
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

                              {/* Fields count ONLY - no individual field name pills */}
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

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Configure / Edit Schema Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartEditSchema(schema)
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                                    title="Edit Schema Name, Slug & Fields"
                                  >
                                    <Sliders className="size-3 text-zinc-400" />
                                    <span>Edit Schema</span>
                                  </button>

                                  {/* Fill Form Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSchemaId(schema.id);
                                      setCurrentView('form');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold transition-colors"
                                    title="Fill Content Values"
                                  >
                                    <FileEdit className="size-3" />
                                    <span>Fill Content</span>
                                  </button>

                                  {/* Delete Schema Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSchema(schema.id, schema.name)
                                    }
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                                    title="Delete Schema"
                                  >
                                    <Trash2 className="size-3.5" />
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
            )}

            {/* VIEW B: Schema Builder (Create / Edit Schema & Fields) */}
            {currentView === 'builder' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Back Navigation Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCurrentView('table')}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
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
                              slugify(e.target.value).replace(
                                /[^a-z0-9_]/g,
                                '_',
                              ),
                            );
                          }
                        }}
                        placeholder="e.g. Hero Section, Product Specifications"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Schema API Key (Slug){' '}
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={builderSlug}
                        onChange={(e) =>
                          setBuilderSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, '_'),
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
                        These fields become bindable dynamic slots in the Visual
                        Builder
                      </p>
                    </div>
                  </div>

                  {/* List of currently defined fields */}
                  {builderFields.length === 0 ? (
                    <div className="p-6 rounded-lg bg-zinc-950/50 border border-zinc-800/70 text-center text-xs text-zinc-500">
                      No fields in this schema yet. Use the field adder below to
                      define fields.
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
                            <div
                              key={field.apiId}
                              className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/60 shadow-lg space-y-4 my-2 animate-in fade-in duration-150"
                            >
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
                                    Field Name{' '}
                                    <span className="text-rose-400">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={editingFieldData.displayName}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditingFieldData((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              displayName: val,
                                            }
                                          : null,
                                      );
                                    }}
                                    placeholder="e.g. Headline, Price"
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                                  />
                                </div>

                                {/* API Key */}
                                <div>
                                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                                    API Key (snake_case){' '}
                                    <span className="text-rose-400">*</span>
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
                                        prev
                                          ? {
                                              ...prev,
                                              apiId: val,
                                            }
                                          : null,
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
                                      const val = e.target
                                        .value as DynamicFieldDataType;
                                      setEditingFieldData((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              dataType: val,
                                            }
                                          : null,
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                                  >
                                    {FIELD_TYPE_GROUPS.map((group) => (
                                      <optgroup
                                        key={group.groupLabel}
                                        label={group.groupLabel}
                                      >
                                        {group.options.map((opt) => (
                                          <option
                                            key={opt.type}
                                            value={opt.type}
                                          >
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
                                        prev
                                          ? {
                                              ...prev,
                                              initialValue: val,
                                            }
                                          : null,
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
                                        prev
                                          ? {
                                              ...prev,
                                              isRequired: e.target.checked,
                                            }
                                          : null,
                                      )
                                    }
                                    className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-0"
                                  />
                                  <span>Required field</span>
                                </label>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldData(null)}
                                    className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditedField()}
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
                                  >
                                    <Check className="size-3.5" />
                                    <span>Apply Changes</span>
                                  </button>
                                </div>
                              </div>
                            </div>
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
                                onClick={() => handleStartEditField(field)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Edit field name, API key, type, and default value"
                              >
                                <Sliders className="size-3 text-zinc-400" />
                                <span>Edit Field</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFieldFromBuilder(field.apiId)
                                }
                                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
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
                    onSubmit={handleAddFieldToBuilder}
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
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, '_'),
                            );
                          }}
                          placeholder="e.g. Headline, Price"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                          API ID (snake_case){' '}
                          <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newFieldApiId}
                          onChange={(e) =>
                            setNewFieldApiId(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9_]/g, '_'),
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
                            setNewFieldType(
                              e.target.value as DynamicFieldDataType,
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                        >
                          {FIELD_TYPE_GROUPS.map((group) => (
                            <optgroup
                              key={group.groupLabel}
                              label={group.groupLabel}
                            >
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
                          onChange={(e) =>
                            setNewFieldInitialValue(e.target.value)
                          }
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
                          onChange={(e) =>
                            setNewFieldRequired(e.target.checked)
                          }
                          className="rounded bg-zinc-900 border-zinc-800 text-indigo-600 focus:ring-0"
                        />
                        <span>Required field</span>
                      </label>

                      <button
                        type="submit"
                        disabled={!newFieldName.trim() || !newFieldApiId.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
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
                    onClick={() => setCurrentView('table')}
                    className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSchema}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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
            )}

            {/* VIEW C: Schema Content Form (Filling Values for Selected Schema) */}
            {currentView === 'form' && activeFormSchema && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Back Navigation Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCurrentView('table')}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Schemas Table</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      {activeFormSchema.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                      /{activeFormSchema.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartEditSchema(activeFormSchema)}
                      className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                      title="Edit this schema's fields and definition"
                    >
                      <Sliders className="size-3" />
                      <span>Edit Schema Definition</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Slot Tokens Bar */}
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Dynamic Token Shortcuts (Click to copy):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeFormSchema.fields.map((f) => (
                      <button
                        key={f.apiId}
                        type="button"
                        onClick={() => handleCopyToken(f.apiId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-mono transition-all ${
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
                      <span>{activeFormSchema.name} Content Values</span>
                    </h4>
                    <span className="text-xs text-zinc-500">
                      Values automatically hydrate live in the visual canvas and
                      preview
                    </span>
                  </div>

                  <div className="space-y-4">
                    {activeFormSchema.fields.map((field) => {
                      const value = activeFormSchema.values?.[field.apiId];

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
                                onClick={() =>
                                  handleSchemaFieldValueChange(
                                    field.apiId,
                                    !value,
                                  )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
                                  handleSchemaFieldValueChange(
                                    field.apiId,
                                    e.target.value,
                                  )
                                }
                                className="size-9 rounded-lg border border-zinc-800 bg-zinc-900 cursor-pointer p-0.5"
                              />
                              <input
                                type="text"
                                value={String(value || '')}
                                onChange={(e) =>
                                  handleSchemaFieldValueChange(
                                    field.apiId,
                                    e.target.value,
                                  )
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
                                  onClick={() =>
                                    handleSchemaFieldValueChange(
                                      field.apiId,
                                      star,
                                    )
                                  }
                                  className="p-1 rounded hover:bg-zinc-800 transition-colors"
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
                          ) : field.dataType === 'media' ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={String(value || '')}
                                onChange={(e) =>
                                  handleSchemaFieldValueChange(
                                    field.apiId,
                                    e.target.value,
                                  )
                                }
                                placeholder="https://images.unsplash.com/... or asset URL"
                                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-500"
                              />
                              {typeof value === 'string' && value ? (
                                <div className="relative w-full h-36 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                                  <img
                                    src={value}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display =
                                        'none';
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : field.dataType === 'textarea' ? (
                            <textarea
                              rows={3}
                              value={typeof value === 'string' ? value : ''}
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
                              }
                              placeholder={`Enter multi-line ${field.displayName}...`}
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs leading-relaxed focus:outline-none focus:border-zinc-500"
                            />
                          ) : field.dataType === 'richtext' ? (
                            <textarea
                              rows={5}
                              value={typeof value === 'string' ? value : ''}
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
                              }
                              placeholder="Write formatted HTML, markdown, or article content..."
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs font-mono leading-relaxed focus:outline-none focus:border-zinc-500"
                            />
                          ) : field.dataType === 'code' ||
                            field.dataType === 'json' ? (
                            <textarea
                              rows={4}
                              value={
                                typeof value === 'object' && value !== null
                                  ? JSON.stringify(value, null, 2)
                                  : String(value || '')
                              }
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
                              }
                              placeholder="// Code snippet or raw JSON..."
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 text-xs font-mono focus:outline-none focus:border-zinc-500"
                            />
                          ) : field.dataType === 'number' ? (
                            <input
                              type="number"
                              value={
                                value !== undefined && value !== null
                                  ? String(value)
                                  : ''
                              }
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value === ''
                                    ? ''
                                    : Number(e.target.value),
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
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                            />
                          ) : field.dataType === 'datetime' ? (
                            <input
                              type="datetime-local"
                              value={String(value || '')}
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(value || '')}
                              onChange={(e) =>
                                handleSchemaFieldValueChange(
                                  field.apiId,
                                  e.target.value,
                                )
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
                    onClick={() => setCurrentView('table')}
                    className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-medium transition-colors"
                  >
                    Back to Schemas
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSchemaForm}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Check className="size-3.5" />
                    <span>
                      {isSaving ? 'Saving...' : 'Save & Apply to Page'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Drawer Footer Actions */}
          <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#121215] flex items-center justify-between shrink-0">
            <span className="text-xs text-zinc-400">
              Publication Status:{' '}
              <strong
                className={isPublished ? 'text-emerald-400' : 'text-zinc-300'}
              >
                {isPublished ? 'Published Live' : 'Draft Mode'}
              </strong>
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSavePageData(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSavePageData(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="size-3.5" />
                <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
