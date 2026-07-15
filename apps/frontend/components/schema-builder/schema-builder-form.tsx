'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlusIcon } from 'lucide-react';
import {
  createSchemaSchema,
  schemaTypeValues,
  type CreateSchemaInput,
} from '@repo/shared-types';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSchema } from '@/lib/api/schemas';
import { ApiError } from '@/lib/api-client';
import { FieldListItem } from './field-list-item';
import { FieldSettingsPanel } from './field-settings-panel';

// createSchemaSchema's nested field entries have `.default()` on several
// booleans (isRequired, isUnique, ...), so Zod's *input* type (what the
// form actually manipulates — those fields optional) differs from its
// *output* type (CreateSchemaInput, defaults resolved). useForm's third
// generic tells RHF "the form holds input-shaped values, but handleSubmit's
// callback receives the resolver's output" — same fix as login-form.tsx's
// rememberMe, just via RHF's explicit transform generic instead of dropping
// .default() from the schema (can't do that here without weakening the
// backend's own validation, since this schema is shared).
export type SchemaBuilderFieldValues = z.input<typeof createSchemaSchema>;

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

export function SchemaBuilderForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Master-detail layout (wireframe S-07): the field list on the left
  // selects which field's full config shows in the settings panel on the
  // right, rather than every field's config being expanded inline at once.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);

  const form = useForm<SchemaBuilderFieldValues, unknown, CreateSchemaInput>({
    resolver: zodResolver(createSchemaSchema),
    defaultValues: {
      name: '',
      slug: '',
      type: 'collection',
      fields: [emptyField()],
    },
  });

  const fieldArray = useFieldArray({ control: form.control, name: 'fields' });
  // useFieldArray's own `field.id` is stable across reorders, which is
  // exactly what dnd-kit's SortableContext needs as a drag identity — no
  // separate id-tracking state required.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const mutation = useMutation({
    mutationFn: createSchema,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['schemas'] });
      router.push(`/content-types?created=${created.slug}`);
    },
  });

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

  function handleAddField() {
    fieldArray.append(emptyField(), { shouldFocus: false });
    setSelectedIndex(fieldArray.fields.length);
  }

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

  async function onSubmit(values: CreateSchemaInput) {
    setSubmitError(null);
    try {
      // sortOrder mirrors the field list's current visual order — the
      // backend stores it verbatim rather than re-deriving it, so it has to
      // be kept in sync with every drag-reorder, not just set once at
      // field-creation time.
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
          : 'Failed to create schema. Please try again.',
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="grid gap-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Blog Post" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
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
                  Add field
                </Button>
              </div>

              {form.formState.errors.fields?.root?.message ? (
                <p role="alert" className="text-destructive text-sm">
                  {form.formState.errors.fields.root.message}
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
                    {fieldArray.fields.map((field, index) => (
                      <FieldListItem
                        key={field.id}
                        id={field.id}
                        index={index}
                        control={form.control}
                        isSelected={selectedIndex === index}
                        onSelect={setSelectedIndex}
                        onRemove={handleRemoveField}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Type options</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. blog-post" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kind</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schemaTypeValues.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
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
            {form.formState.isSubmitting ? 'Creating…' : 'Create schema'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
