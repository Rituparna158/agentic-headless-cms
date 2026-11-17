'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSchemaSchema, schemaTypeValues } from '@repo/validation';
import { type CreateSchemaInput, type SchemaRecord } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  ChevronDown,
  Layers,
  PlusIcon,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  useFieldArray,
  useForm,
  FormProvider,
  Controller,
  type FieldErrors,
} from 'react-hook-form';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  Input,
  Dropdown,
  DropdownItem,
  Typography,
} from '@repo/shared-ui';
import { createSchema, updateSchema } from '@/lib/api/schemas';
import { ApiError } from '@/lib/api-client';
import type { SchemaBuilderFieldValues } from '@/types/component.types';
import { FieldListItem } from './field-list-item';
import { FieldSettingsPanel } from './field-settings-panel';

function emptyField() {
  return {
    apiId: '',
    displayName: '',
    dataType: 'text' as const,
    isRequired: false,
    isUnique: false,
    isLocalized: false,
    isRepeatable: false,
    sortOrder: 0,
  };
}

export interface SchemaBuilderFormProps {
  /** Present when editing an existing content type; omit when creating one. */
  schema?: SchemaRecord;
}

export function SchemaBuilderForm({ schema }: SchemaBuilderFormProps = {}) {
  const isEditing = !!schema;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Controls which field's config is opened in the slide-over drawer.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    schema && schema.definition.fields.length > 0 ? 0 : null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;
  const canCreate =
    isAdmin ||
    user?.permissions?.some(
      (p) =>
        (p.schemaId === null || p.schemaId === '*') &&
        ['create', '*'].includes(p.action),
    );

  const form = useForm<SchemaBuilderFieldValues, unknown, CreateSchemaInput>({
    resolver: zodResolver(createSchemaSchema),
    mode: 'onChange',
    defaultValues: schema
      ? {
          name: schema.name,
          slug: schema.slug,
          type: schema.type,
          fields: schema.definition.fields,
        }
      : {
          name: '',
          slug: '',
          type: 'collection',
          fields: [],
        },
  });

  const { errors } = form.formState;

  // Clear top-level submission error as soon as the user starts editing any field
  useEffect(() => {
    if (!submitError) return;
    const subscription = form.watch(() => {
      setSubmitError(null);
    });
    return () => subscription.unsubscribe();
  }, [submitError, form]);

  const fieldArray = useFieldArray({ control: form.control, name: 'fields' });
  // useFieldArray's `field.id` serves as a stable drag identity for dnd-kit.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const mutation = useMutation({
    mutationFn: (input: CreateSchemaInput) =>
      isEditing
        ? updateSchema(schema.id, {
            name: input.name,
            fields: input.fields,
          })
        : createSchema(input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['schemas'] });
      router.push(
        `/content-types?${isEditing ? 'updated' : 'created'}=${saved.slug}`,
      );
    },
  });

  /**
   * Reorders fields after a drag-and-drop action completes.
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fieldArray.fields.findIndex(
      (field) => field.id === active.id,
    );
    const newIndex = fieldArray.fields.findIndex(
      (field) => field.id === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) return;

    fieldArray.move(oldIndex, newIndex);
    if (selectedIndex === oldIndex) setSelectedIndex(newIndex);
  }

  /**
   * Appends a new empty field and opens the slide-over drawer to configure it.
   */
  async function handleAddField() {
    // 1. If there's an active field currently being edited, validate it first
    if (
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < fieldArray.fields.length
    ) {
      const isDisplayNameValid = await form.trigger(
        `fields.${selectedIndex}.displayName`,
      );
      const isApiIdValid = await form.trigger(`fields.${selectedIndex}.apiId`);
      const isDataTypeValid = await form.trigger(
        `fields.${selectedIndex}.dataType`,
      );

      if (!isDisplayNameValid || !isApiIdValid || !isDataTypeValid) {
        toast.error(
          `Please complete the required details for Field ${selectedIndex + 1} before adding a new field.`,
        );
        setIsDrawerOpen(true);
        return;
      }
    }

    // 2. Also ensure all existing fields are valid before appending a new one
    if (fieldArray.fields.length > 0) {
      const isAllFieldsValid = await form.trigger('fields');
      if (!isAllFieldsValid) {
        const fieldsErrors = form.formState.errors.fields;
        if (fieldsErrors && Array.isArray(fieldsErrors)) {
          const firstInvalidIdx = fieldsErrors.findIndex(
            (f) => !!f && typeof f === 'object' && Object.keys(f).length > 0,
          );
          if (firstInvalidIdx !== -1) {
            setSelectedIndex(firstInvalidIdx);
            setIsDrawerOpen(true);
            toast.error(
              `Please complete Field ${firstInvalidIdx + 1} before adding a new field.`,
            );
            return;
          }
        }
        toast.error(
          'Please complete all existing fields before adding a new field.',
        );
        setIsDrawerOpen(true);
        return;
      }
    }

    const newIdx = fieldArray.fields.length;
    fieldArray.append(emptyField(), { shouldFocus: false });
    setSelectedIndex(newIdx);
    setIsDrawerOpen(true);
  }

  /**
   * Selects a field and opens the drawer to edit it.
   */
  function handleSelectField(index: number) {
    setSelectedIndex(index);
    setIsDrawerOpen(true);
  }

  /**
   * Removes a field at the given index and updates the selected field index.
   */
  function handleRemoveField(index: number) {
    fieldArray.remove(index);
    setSelectedIndex((current) => {
      if (current === null) return null;
      if (fieldArray.fields.length <= 1) {
        setIsDrawerOpen(false);
        return null;
      }
      if (index < current) return current - 1;
      if (index === current) {
        const nextIdx = Math.min(index, fieldArray.fields.length - 2);
        return nextIdx >= 0 ? nextIdx : null;
      }
      return current;
    });
  }

  /**
   * Submits the schema form, normalizing field sort orders before API creation.
   */
  async function onSubmit(values: CreateSchemaInput) {
    setSubmitError(null);
    try {
      // sortOrder must be synced with the field list's current visual order.
      const payload: CreateSchemaInput = {
        ...values,
        fields: values.fields.map((field, index) => ({
          ...field,
          sortOrder: index,
        })),
      };
      await mutation.mutateAsync(payload);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : `Failed to ${isEditing ? 'update' : 'create'} content type. Please try again.`,
      );
    }
  }

  /**
   * Handles validation errors when form submission is attempted.
   * Auto-selects the first invalid field and opens the drawer so the user sees the error inline.
   */
  function onInvalid(errors: FieldErrors<SchemaBuilderFieldValues>) {
    if (errors.fields) {
      const fieldsErrors = errors.fields;
      let firstErrorIndex: number | null = null;

      if (Array.isArray(fieldsErrors)) {
        const idx = fieldsErrors.findIndex(
          (f) => !!f && typeof f === 'object' && Object.keys(f).length > 0,
        );
        if (idx !== -1) firstErrorIndex = idx;
      } else if (typeof fieldsErrors === 'object') {
        for (const key of Object.keys(fieldsErrors)) {
          const num = Number(key);
          if (!isNaN(num) && (fieldsErrors as Record<string, unknown>)[key]) {
            firstErrorIndex = num;
            break;
          }
        }
      }

      if (firstErrorIndex !== null) {
        setSelectedIndex(firstErrorIndex);
        setIsDrawerOpen(true);
        const fieldErrorObj = (
          fieldsErrors as Record<string, Record<string, { message?: string }>>
        )[firstErrorIndex];
        const errorMsg =
          fieldErrorObj?.displayName?.message ||
          fieldErrorObj?.apiId?.message ||
          `Validation failed for Field ${firstErrorIndex + 1}.`;
        const fullMsg = `Field ${firstErrorIndex + 1}: ${errorMsg}`;
        toast.error(fullMsg);
        return;
      }
    }

    if (errors.name?.message) {
      toast.error(errors.name.message);
      return;
    }

    if (errors.slug?.message) {
      toast.error(errors.slug.message);
      return;
    }

    toast.error('Please fix all validation errors before submitting.');
  }

  if (!isEditing && !canCreate && status === 'authenticated') {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10">
        <Card className="max-w-md text-center border-dashed p-4">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <ShieldAlert className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle>Permission Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You do not have permission to define or create content types. Only
              administrators can build new schemas.
            </p>
            <Button asChild variant="outline">
              <Link href="/content-types">Back to Content Types</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit, onInvalid)(event)}
        className="space-y-6 w-full min-w-0"
      >
        {/* Model Configuration Card */}
        <Card className="border border-border/70 shadow-xs overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Boxes className="size-4 text-muted-foreground" />
              General Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 min-w-0">
            {/* Name */}
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <label htmlFor="name">
                    <Typography as="span" variant="label">
                      Name
                    </Typography>
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g. Blog Post"
                    variant="default"
                    {...field}
                    value={field.value ?? ''}
                  />
                  {fieldState.error?.message ? (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            {/* Slug */}
            <Controller
              control={form.control}
              name="slug"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <label htmlFor="slug">
                    <Typography as="span" variant="label">
                      Slug
                    </Typography>
                  </label>
                  <Input
                    id="slug"
                    placeholder="e.g. blog-post"
                    disabled={isEditing}
                    variant="default"
                    {...field}
                    value={field.value ?? ''}
                  />
                  {fieldState.error?.message ? (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            {/* Type */}
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Typography as="span" variant="label">
                    Type
                  </Typography>
                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        disabled={isEditing}
                      >
                        <span className="capitalize">
                          {field.value || 'Select…'}
                        </span>
                        <ChevronDown className="size-4 text-muted-foreground opacity-60 ml-1 shrink-0" />
                      </button>
                    }
                  >
                    {schemaTypeValues.map((type) => (
                      <DropdownItem
                        key={type}
                        onSelect={() => field.onChange(type)}
                        className="capitalize text-xs cursor-pointer"
                      >
                        {type}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                  {fieldState.error?.message ? (
                    <p className="text-sm font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Fields Architecture Card */}
        <Card className="border border-border/70 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate">Fields Architecture</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure data attributes, validation rules, and schema types
                for this model.
              </p>
            </div>
            {fieldArray.fields.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs font-medium shrink-0 self-start sm:self-auto"
                onClick={handleAddField}
              >
                <PlusIcon className="size-3.5" />
                Add Field
              </Button>
            )}
          </CardHeader>

          <CardContent className="space-y-3 min-w-0">
            {errors.fields?.root?.message ? (
              <p
                role="alert"
                className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-3"
              >
                {errors.fields.root.message}
              </p>
            ) : null}

            {fieldArray.fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-10 px-4 text-center bg-muted/15">
                <div className="rounded-xl bg-muted p-3 mb-3 text-muted-foreground ring-1 ring-border">
                  <Layers className="size-5" />
                </div>
                <p className="font-semibold text-sm text-foreground">
                  No fields added yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
                  Define the data structure of your content type by adding your
                  first field.
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddField}
                >
                  <PlusIcon className="size-4 mr-1.5" />
                  Add Field
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fieldArray.fields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="w-full overflow-x-auto min-w-0 pb-1.5 -mx-1 px-1">
                    <div className="min-w-[540px] sm:min-w-0 grid gap-2">
                      {fieldArray.fields.map((field, index) => {
                        const fieldErrors = errors.fields?.[index];
                        const hasError = !!(
                          fieldErrors &&
                          typeof fieldErrors === 'object' &&
                          Object.keys(fieldErrors).length > 0
                        );

                        return (
                          <FieldListItem
                            key={field.id}
                            id={field.id}
                            index={index}
                            control={form.control}
                            isSelected={selectedIndex === index && isDrawerOpen}
                            hasError={hasError}
                            onSelect={handleSelectField}
                            onRemove={handleRemoveField}
                          />
                        );
                      })}
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {submitError ? (
          <p
            role="alert"
            className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-xl p-3"
          >
            {submitError}
          </p>
        ) : null}

        {/* Form Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/content-types">Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
            className="min-w-[130px] shadow-xs"
          >
            {form.formState.isSubmitting
              ? isEditing
                ? 'Saving…'
                : 'Creating…'
              : isEditing
                ? 'Save Changes'
                : 'Create'}
          </Button>
        </div>

        {/* Slide-over Drawer for Field Configuration */}
        <Drawer
          isOpen={
            isDrawerOpen &&
            selectedIndex !== null &&
            selectedIndex >= 0 &&
            selectedIndex < fieldArray.fields.length
          }
          onClose={() => setIsDrawerOpen(false)}
          position="right"
          size="min(480px, 100vw)"
          className="w-full max-w-[100vw] sm:max-w-[480px]"
          title={
            selectedIndex !== null && selectedIndex < fieldArray.fields.length
              ? form.watch(`fields.${selectedIndex}.displayName`)
                ? `Edit Field: ${form.watch(`fields.${selectedIndex}.displayName`)}`
                : `Field ${selectedIndex + 1} Settings`
              : 'Field Settings'
          }
        >
          {selectedIndex !== null &&
            selectedIndex >= 0 &&
            selectedIndex < fieldArray.fields.length && (
              <FieldSettingsPanel
                index={selectedIndex}
                control={form.control}
                onRemove={handleRemoveField}
                onClose={() => setIsDrawerOpen(false)}
              />
            )}
        </Drawer>
      </form>
    </FormProvider>
  );
}
