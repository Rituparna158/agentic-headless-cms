import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  DynamicFieldDataType,
  DynamicFieldDefinition,
  PageCustomSchema,
  PageSchemaEntryType,
  ContentCollectionMeta,
  PageEntry,
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

// PageDrawer Orchastrator
export const PageSideDrawer: React.FC<PageSideDrawerProps> = ({
  isOpen,
  onClose,
  collection,
  page,
  collectionPages,
  onSavePage,
  isSaving,
  onOpenHistory,
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

  // Active item index when editing values for a multi-entry schema
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

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
  const [builderEntryType, setBuilderEntryType] =
    useState<PageSchemaEntryType>('single');
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

  const safeCollection: ContentCollectionMeta = useMemo(() => {
    const now = new Date().toISOString();
    if (collection) {
      return {
        id: collection.id || 'collection',
        name: collection.name || 'Collection',
        slug: collection.slug || 'collection',
        description: collection.description,
        type: collection.type || 'collection',
        entryCount: collection.entryCount || 0,
        linkedPagesCount: collection.linkedPagesCount || 0,
        fields: Array.isArray(collection.fields) ? collection.fields : [],
        createdAt: collection.createdAt || now,
        updatedAt: collection.updatedAt || now,
      };
    }
    return {
      id: 'collection',
      name: 'Collection',
      slug: 'collection',
      type: 'collection',
      entryCount: 0,
      linkedPagesCount: 0,
      fields: [],
      createdAt: now,
      updatedAt: now,
    };
  }, [collection]);

  const safePage: PageEntry = useMemo(() => {
    const raw = (page || {}) as unknown as Record<string, unknown>;
    const rawDataRecord =
      typeof raw.data === 'object' &&
      raw.data !== null &&
      !Array.isArray(raw.data)
        ? (raw.data as Record<string, unknown>)
        : undefined;

    // Guard against custom fields named "data" (e.g. date or string fields) masquerading as double-wrapped payloads
    const rawNested =
      typeof rawDataRecord?.data === 'object' &&
      rawDataRecord.data !== null &&
      !Array.isArray(rawDataRecord.data)
        ? (rawDataRecord.data as Record<string, unknown>)
        : undefined;

    const hasDataWrapper =
      rawNested !== undefined &&
      ('_schemas' in rawNested || 'title' in rawNested || 'body' in rawNested);

    const innerData = hasDataWrapper ? rawNested : rawDataRecord || raw;

    const pageId = String(raw.id || rawDataRecord?.id || 'page');
    const pageStatus = String(raw.status || rawDataRecord?.status || 'draft');

    const resolvedTitle =
      (typeof innerData.title === 'string' && innerData.title.trim()) ||
      (typeof raw.title === 'string' && raw.title.trim()) ||
      (typeof rawDataRecord?.title === 'string' &&
        rawDataRecord.title.trim()) ||
      '';

    const resolvedSlug =
      (typeof innerData.slug === 'string' && innerData.slug.trim()) ||
      (typeof raw.slug === 'string' && raw.slug.trim()) ||
      (typeof rawDataRecord?.slug === 'string' && rawDataRecord.slug.trim()) ||
      pageId;

    const resolvedSchemas =
      (Array.isArray(innerData._schemas) &&
        (innerData._schemas as PageCustomSchema[])) ||
      (Array.isArray(rawDataRecord?._schemas) &&
        (rawDataRecord._schemas as PageCustomSchema[])) ||
      (Array.isArray(raw._schemas) && (raw._schemas as PageCustomSchema[])) ||
      [];

    return {
      id: pageId,
      status: pageStatus === 'published' ? 'published' : 'draft',
      data: {
        title: resolvedTitle,
        slug: resolvedSlug,
        description:
          typeof innerData.description === 'string'
            ? innerData.description
            : typeof raw.description === 'string'
              ? raw.description
              : typeof rawDataRecord?.description === 'string'
                ? rawDataRecord.description
                : undefined,
        body: innerData.body || rawDataRecord?.body || raw.body,
        _schemas: resolvedSchemas,
      },
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    };
  }, [page]);

  // Sync state whenever the page prop changes
  useEffect(() => {
    const isDifferentPage = prevPageIdRef.current !== safePage.id;
    prevPageIdRef.current = safePage.id;

    setPageTitle(safePage.data?.title || '');
    setPageSlug(safePage.data?.slug || '');
    const rawSchemas = (safePage.data?._schemas as PageCustomSchema[]) || [];
    setPageSchemas(
      Array.isArray(rawSchemas)
        ? rawSchemas.map((s) => ({
            ...s,
            id: s.id || `schema_${Date.now()}`,
            name: s.name || s.slug || 'Untitled Schema',
            slug: s.slug || s.name || 'schema',
            entryType: s.entryType || 'single',
            fields: Array.isArray(s.fields) ? s.fields : [],
            values:
              s.values && typeof s.values === 'object'
                ? (s.values as Record<string, unknown>)
                : {},
            items: Array.isArray(s.items)
              ? s.items
              : s.values && Object.keys(s.values).length > 0
                ? [s.values]
                : [{}],
          }))
        : [],
    );
    if (isDifferentPage) {
      setCurrentView('table');
      setSelectedSchemaId(null);
      setEditingSchemaId(null);
      setActiveItemIndex(0);
    }
  }, [safePage]);

  // Schemas available from other pages in the same collection
  const collectionSchemas = useMemo(() => {
    if (!Array.isArray(collectionPages)) return [];
    const list: Array<{
      pageId: string;
      pageTitle: string;
      schema: PageCustomSchema;
    }> = [];

    for (const otherPage of collectionPages) {
      if (!otherPage) continue;
      const rawOther = otherPage as unknown as Record<string, unknown>;
      const otherDataRecord =
        typeof rawOther.data === 'object' &&
        rawOther.data !== null &&
        !Array.isArray(rawOther.data)
          ? (rawOther.data as Record<string, unknown>)
          : undefined;

      const otherId = String(rawOther.id || otherDataRecord?.id || '');
      if (!otherId || otherId === safePage.id) continue;

      const otherNestedData =
        typeof otherDataRecord?.data === 'object' &&
        otherDataRecord.data !== null &&
        !Array.isArray(otherDataRecord.data)
          ? (otherDataRecord.data as Record<string, unknown>)
          : undefined;

      const hasOtherWrapper =
        otherNestedData !== undefined &&
        ('_schemas' in otherNestedData ||
          'title' in otherNestedData ||
          'body' in otherNestedData);

      const otherData = hasOtherWrapper
        ? otherNestedData
        : otherDataRecord || rawOther;

      const otherTitle =
        (typeof otherData.title === 'string' && otherData.title.trim()) ||
        (typeof rawOther.title === 'string' && rawOther.title.trim()) ||
        (typeof otherDataRecord?.title === 'string' &&
          otherDataRecord.title.trim()) ||
        otherId;

      const rawSchemas =
        (Array.isArray(otherData._schemas) &&
          (otherData._schemas as PageCustomSchema[])) ||
        (Array.isArray(otherDataRecord?._schemas) &&
          (otherDataRecord._schemas as PageCustomSchema[])) ||
        (Array.isArray(rawOther._schemas) &&
          (rawOther._schemas as PageCustomSchema[])) ||
        [];

      if (Array.isArray(rawSchemas)) {
        for (const s of rawSchemas) {
          if (s && (s.name || s.slug || s.id)) {
            list.push({
              pageId: otherId,
              pageTitle: otherTitle,
              schema: {
                ...s,
                id: s.id || `schema_${Date.now()}`,
                name: s.name || s.slug || 'Untitled Schema',
                slug: s.slug || s.name || 'schema',
                entryType: s.entryType || 'single',
                fields: Array.isArray(s.fields) ? s.fields : [],
                values:
                  s.values && typeof s.values === 'object'
                    ? (s.values as Record<string, unknown>)
                    : {},
                items: Array.isArray(s.items) ? s.items : undefined,
              },
            });
          }
        }
      }
    }
    return list;
  }, [collectionPages, safePage.id]);

  const drawerRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
    initialFocusSelector: 'button[title="Close Drawer"]',
  });

  if (!isOpen) return null;

  const handleSchemaFieldValueChange = (fieldApiId: string, value: unknown) => {
    if (!selectedSchemaId) return;
    setPageSchemas((prev) =>
      prev.map((s) => {
        if (s.id === selectedSchemaId) {
          if (s.entryType === 'multi') {
            const currentItems =
              Array.isArray(s.items) && s.items.length > 0
                ? [...s.items]
                : [{ ...(s.values || {}) }];
            const safeIdx = Math.max(
              0,
              Math.min(activeItemIndex, currentItems.length - 1),
            );
            const updatedItem = {
              ...(currentItems[safeIdx] || {}),
              [fieldApiId]: value,
            };
            currentItems[safeIdx] = updatedItem;
            return {
              ...s,
              items: currentItems,
              values: safeIdx === 0 ? updatedItem : s.values || updatedItem,
            };
          }

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

  const handleAddItemToSchema = () => {
    if (!selectedSchemaId) return;
    setPageSchemas((prev) =>
      prev.map((s) => {
        if (s.id === selectedSchemaId) {
          const currentItems = Array.isArray(s.items)
            ? [...s.items]
            : [{ ...(s.values || {}) }];
          const newItem: Record<string, unknown> = {};
          (s.fields || []).forEach((f) => {
            if (f.dataType === 'boolean') newItem[f.apiId] = false;
            else if (f.dataType === 'number') newItem[f.apiId] = 0;
            else newItem[f.apiId] = '';
          });
          currentItems.push(newItem);
          setActiveItemIndex(currentItems.length - 1);
          return {
            ...s,
            items: currentItems,
          };
        }
        return s;
      }),
    );
    toast.success('New item added to list!');
  };

  const handleDeleteItemFromSchema = (indexToDelete: number) => {
    if (!selectedSchemaId) return;
    setPageSchemas((prev) =>
      prev.map((s) => {
        if (s.id === selectedSchemaId) {
          const currentItems = Array.isArray(s.items)
            ? [...s.items]
            : [{ ...(s.values || {}) }];
          if (currentItems.length <= 1) {
            toast.error('Cannot delete the only item in the list.');
            return s;
          }
          currentItems.splice(indexToDelete, 1);
          setActiveItemIndex((prevIdx) =>
            Math.max(0, Math.min(prevIdx, currentItems.length - 1)),
          );
          return {
            ...s,
            items: currentItems,
            values: currentItems[0] || {},
          };
        }
        return s;
      }),
    );
    toast.success('Item removed.');
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
    setBuilderEntryType('single');
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
    setBuilderEntryType(schema.entryType || 'single');
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

          const existingItems =
            Array.isArray(s.items) && s.items.length > 0
              ? s.items
              : [mergedValues];
          const updatedItems = existingItems.map((item) => {
            const migrated = { ...item };
            for (const [oldKey, newKey] of Object.entries(renamedFieldsMap)) {
              if (migrated[oldKey] !== undefined) {
                migrated[newKey] = migrated[oldKey];
                delete migrated[oldKey];
              }
            }
            return migrated;
          });

          return {
            ...s,
            name: builderName.trim(),
            slug: cleanBuilderSlug,
            description: builderDesc.trim() || undefined,
            entryType: builderEntryType,
            fields: builderFields,
            values: mergedValues,
            items: builderEntryType === 'multi' ? updatedItems : undefined,
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
        entryType: builderEntryType,
        fields: builderFields,
        values: { ...builderInitialValues },
        items:
          builderEntryType === 'multi'
            ? [{ ...builderInitialValues }]
            : undefined,
        createdAt: new Date().toISOString(),
      };
      updatedSchemas = [...pageSchemas, newSchema];
    }

    setPageSchemas(updatedSchemas);

    const updatedData = {
      ...(safePage.data || {}),
      title: pageTitle.trim() || safePage.data?.title || 'Untitled',
      slug: pageSlug.trim() || safePage.data?.slug || 'page',
      _schemas: updatedSchemas,
    };

    await onSavePage(safePage.id, updatedData, false);
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
      ...(safePage.data || {}),
      title: pageTitle.trim() || safePage.data?.title || 'Untitled',
      slug: pageSlug.trim() || safePage.data?.slug || 'page',
      _schemas: updatedSchemas,
    };

    await onSavePage(safePage.id, updatedData, false);
    toast.success(`Schema "${schemaName}" removed.`);
  };

  // Use / copy a schema from another page in the collection to this page
  const handleUseCollectionSchema = async (
    sourceSchema: PageCustomSchema,
    sourcePageTitle: string,
  ) => {
    const existing = pageSchemas.find(
      (s) => s.slug === sourceSchema.slug || s.name === sourceSchema.name,
    );
    if (existing) {
      toast.error(
        `This page already has a schema named "${sourceSchema.name}" (${sourceSchema.slug}).`,
      );
      return;
    }

    const newSchema: PageCustomSchema = {
      id: `schema_${Date.now()}`,
      name: sourceSchema.name,
      slug: sourceSchema.slug,
      description: sourceSchema.description,
      entryType: sourceSchema.entryType || 'single',
      fields: Array.isArray(sourceSchema.fields)
        ? sourceSchema.fields.map((f) => ({ ...f }))
        : [],
      values: { ...(sourceSchema.values || {}) },
      items: Array.isArray(sourceSchema.items)
        ? sourceSchema.items.map((it) => ({ ...it }))
        : undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedSchemas = [...pageSchemas, newSchema];
    setPageSchemas(updatedSchemas);

    const updatedData = {
      ...(safePage.data || {}),
      title: pageTitle.trim() || safePage.data?.title || 'Untitled',
      slug: pageSlug.trim() || safePage.data?.slug || 'page',
      _schemas: updatedSchemas,
    };

    await onSavePage(safePage.id, updatedData, false);
    toast.success(
      `Schema "${sourceSchema.name}" from "${sourcePageTitle}" copied to this page!`,
    );
  };

  // Save filled values for the active schema specifically
  const handleSaveSchemaForm = async () => {
    const titleVal = pageTitle.trim() || safePage.data?.title || 'Untitled';
    const slugVal = pageSlug.trim() || safePage.data?.slug || 'page';

    const updatedData = {
      ...(safePage.data || {}),
      title: titleVal,
      slug: slugVal,
      _schemas: pageSchemas,
    };

    await onSavePage(safePage.id, updatedData, false);
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
      ...(safePage.data || {}),
      title: titleVal,
      slug: pageSlug.trim() || slugify(titleVal),
      _schemas: pageSchemas,
    };

    await onSavePage(safePage.id, submission, publishImmediately);
  };

  const isPublished = safePage.status === 'published';
  const cleanSlug = String(
    pageSlug || safePage.data?.slug || safePage.id || 'page',
  ).replace(/^\/+/, '');

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Page settings and schema editor for ${pageTitle || safePage.data?.title || 'page'}`}
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
            collectionName={safeCollection.name}
            collectionSlug={safeCollection.slug}
            cleanSlug={cleanSlug}
            pageId={safePage.id}
            pageTitle={pageTitle}
            onPageTitleChange={setPageTitle}
            isPublished={isPublished}
            onOpenPreview={() =>
              window.open(
                `/collections/${safeCollection.slug}/preview/${cleanSlug}`,
                '_blank',
              )
            }
            onOpenCanvas={() =>
              navigate(`/collections/${safeCollection.slug}/${safePage.id}`)
            }
            onOpenHistory={onOpenHistory}
            onClose={onClose}
          />

          {/* 2. Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* VIEW A: Schemas Table (Default View) */}
            {currentView === 'table' && (
              <PageSchemaList
                pageSchemas={pageSchemas}
                collectionSchemas={collectionSchemas}
                onStartCreateSchema={handleStartCreateSchema}
                onStartEditSchema={handleStartEditSchema}
                onSelectFillContent={(schemaId) => {
                  setSelectedSchemaId(schemaId);
                  setActiveItemIndex(0);
                  setCurrentView('form');
                }}
                onDeleteSchema={handleDeleteSchema}
                onUseCollectionSchema={handleUseCollectionSchema}
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
                builderEntryType={builderEntryType}
                setBuilderEntryType={setBuilderEntryType}
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
                activeItemIndex={activeItemIndex}
                onSelectActiveItem={setActiveItemIndex}
                onAddItem={handleAddItemToSchema}
                onDeleteItem={handleDeleteItemFromSchema}
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
