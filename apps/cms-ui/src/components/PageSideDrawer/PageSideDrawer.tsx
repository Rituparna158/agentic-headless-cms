import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  DynamicFieldDataType,
  DynamicFieldDefinition,
  PageCustomSchema,
} from '@/types/content.types';
import type {
  PageSideDrawerProps,
  EditingFieldFormData,
  PageSideDrawerView,
} from './drawer.types';
import { slugify } from '@/utils/slugify.util';
import { useToast } from '@repo/shared-ui';
import { PageMetaDrawerHeader } from './PageMetaDrawerHeader';
import { PageSchemaList } from './PageSchemaList';
import { PageSchemaBuilder } from './PageSchemaBuilder';
import { PageSchemaForm } from './PageSchemaForm';
import { PageDrawerFooter } from './PageDrawerFooter';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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

  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen && Boolean(page),
    onEscape: onClose,
    restoreFocus: true,
  });

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
      updatedSchemas = pageSchemas.map((s) => {
        if (s.id === editingSchemaId) {
          const mergedValues = { ...(s.values || {}) };
          for (const [oldKey, newKey] of Object.entries(renamedFieldsMap)) {
            if (mergedValues[oldKey] !== undefined) {
              mergedValues[newKey] = mergedValues[oldKey];
              delete mergedValues[oldKey];
            }
          }
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
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Page settings and schema editor for ${pageTitle || page.data?.title || 'page'}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - Expanded width for comfortable workstation editing */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div
          ref={drawerRef}
          tabIndex={-1}
          className="w-screen max-w-5xl bg-[#09090b] border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 text-zinc-100 outline-none"
        >
          {/* 1. Drawer Header */}
          <PageMetaDrawerHeader
            collectionName={collection.name}
            collectionSlug={collection.slug}
            cleanSlug={cleanSlug}
            pageId={page.id}
            pageTitle={pageTitle}
            onPageTitleChange={setPageTitle}
            isPublished={isPublished}
            onOpenPreview={() =>
              window.open(
                `/collections/${collection.slug}/preview/${cleanSlug}`,
                '_blank',
              )
            }
            onOpenCanvas={() =>
              navigate(`/collections/${collection.slug}/${page.id}`)
            }
            onClose={onClose}
          />

          {/* 2. Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* VIEW A: Schemas Table (Default View) */}
            {currentView === 'table' && (
              <PageSchemaList
                pageSchemas={pageSchemas}
                onStartCreateSchema={handleStartCreateSchema}
                onStartEditSchema={handleStartEditSchema}
                onSelectFillContent={(schemaId) => {
                  setSelectedSchemaId(schemaId);
                  setCurrentView('form');
                }}
                onDeleteSchema={handleDeleteSchema}
              />
            )}

            {/* VIEW B: Schema Builder (Create / Edit Schema & Fields) */}
            {currentView === 'builder' && (
              <PageSchemaBuilder
                editingSchemaId={editingSchemaId}
                builderName={builderName}
                setBuilderName={setBuilderName}
                builderSlug={builderSlug}
                setBuilderSlug={setBuilderSlug}
                builderDesc={builderDesc}
                setBuilderDesc={setBuilderDesc}
                builderFields={builderFields}
                builderInitialValues={builderInitialValues}
                editingFieldData={editingFieldData}
                setEditingFieldData={setEditingFieldData}
                newFieldName={newFieldName}
                setNewFieldName={setNewFieldName}
                newFieldApiId={newFieldApiId}
                setNewFieldApiId={setNewFieldApiId}
                newFieldType={newFieldType}
                setNewFieldType={setNewFieldType}
                newFieldRequired={newFieldRequired}
                setNewFieldRequired={setNewFieldRequired}
                newFieldInitialValue={newFieldInitialValue}
                setNewFieldInitialValue={setNewFieldInitialValue}
                isSaving={isSaving}
                onBackToOverview={() => setCurrentView('table')}
                onStartEditField={handleStartEditField}
                onRemoveField={handleRemoveFieldFromBuilder}
                onSaveEditedField={handleSaveEditedField}
                onAddField={handleAddFieldToBuilder}
                onSaveSchema={handleSaveSchema}
              />
            )}

            {/* VIEW C: Schema Content Form (Filling Values for Selected Schema) */}
            {currentView === 'form' && activeFormSchema && (
              <PageSchemaForm
                schema={activeFormSchema}
                copiedToken={copiedToken}
                isSaving={isSaving}
                onCopyToken={handleCopyToken}
                onFieldValueChange={handleSchemaFieldValueChange}
                onBackToSchemas={() => setCurrentView('table')}
                onSaveForm={handleSaveSchemaForm}
              />
            )}
          </div>

          {/* 3. Drawer Footer Actions */}
          <PageDrawerFooter
            isPublished={isPublished}
            isSaving={isSaving}
            onSaveDraft={() => handleSavePageData(false)}
            onPublishLive={() => handleSavePageData(true)}
          />
        </div>
      </div>
    </div>
  );
};
