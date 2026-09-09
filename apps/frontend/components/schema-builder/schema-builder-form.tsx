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
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  // Controls which field's config is expanded in the settings panel.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

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
          fields: [emptyField()],
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
   * Appends a new empty field to the end of the schema after validating the current field.
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
        return;
      }
    }

    // 2. Also ensure all existing fields are valid before appending a new one
    const isAllFieldsValid = await form.trigger('fields');
    if (!isAllFieldsValid) {
      const fieldsErrors = form.formState.errors.fields;
      if (fieldsErrors && Array.isArray(fieldsErrors)) {
        const firstInvalidIdx = fieldsErrors.findIndex(
          (f) => !!f && typeof f === 'object' && Object.keys(f).length > 0,
        );
        if (firstInvalidIdx !== -1) {
          setSelectedIndex(firstInvalidIdx);
          toast.error(
            `Please complete Field ${firstInvalidIdx + 1} before adding a new field.`,
          );
          return;
        }
      }
      toast.error(
        'Please complete all existing fields before adding a new field.',
      );
      return;
    }

    fieldArray.append(emptyField(), { shouldFocus: false });
    setSelectedIndex(fieldArray.fields.length);
  }

  /**
   * Removes a field at the given index and updates the selected field index.
   */
  function handleRemoveField(index: number) {
    fieldArray.remove(index);
    setSelectedIndex((current) => {
      if (current === null) return null;
      if (fieldArray.fields.length <= 1) return null;
      if (index < current) return current - 1;
      if (index === current)
        return Math.min(index, fieldArray.fields.length - 2);
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
   * Auto-selects the first invalid field so the user sees the error inline.
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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit, onInvalid)(event)}
        className="grid gap-6"
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <div className="grid gap-2 max-w-sm">
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

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Fields</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                >
                  <PlusIcon className="size-4" />
                  Add Field
                </Button>
              </div>

              {errors.fields?.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.fields.root.message}
                </p>
              ) : null}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fieldArray.fields.map((field) => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-2">
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
                          isSelected={selectedIndex === index}
                          hasError={hasError}
                          onSelect={setSelectedIndex}
                          onRemove={handleRemoveField}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Type Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
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
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isEditing}
                          >
                            {field.value || 'Select…'}
                          </button>
                        }
                      >
                        {schemaTypeValues.map((type) => (
                          <DropdownItem
                            key={type}
                            onSelect={() => field.onChange(type)}
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
          </div>

          <FieldSettingsPanel
            index={selectedIndex}
            control={form.control}
            onRemove={handleRemoveField}
          />
        </div>

        {submitError ? (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? isEditing
                ? 'Saving…'
                : 'Creating…'
              : isEditing
                ? 'Save Changes'
                : 'Create Content Type'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
