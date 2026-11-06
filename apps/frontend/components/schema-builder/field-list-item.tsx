'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  Calendar,
  Code,
  FileText,
  GripVertical,
  Hash,
  Image,
  Link2,
  Pencil,
  ToggleLeft,
  Trash2,
  Type,
} from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { Button, Badge } from '@repo/shared-ui';
import { cn } from '@/lib/utils';

import type {
  FieldListItemProps,
  SchemaBuilderFieldValues,
} from '@/types/component.types';

function getFieldTypeIcon(dataType: string) {
  switch (dataType) {
    case 'richtext':
      return FileText;
    case 'number':
      return Hash;
    case 'boolean':
      return ToggleLeft;
    case 'date':
      return Calendar;
    case 'media':
      return Image;
    case 'relation':
      return Link2;
    case 'json':
      return Code;
    case 'text':
    default:
      return Type;
  }
}

/**
 * Compact sleek row for the field list.
 * Fixed height (~44px) prevents layout expansion.
 * Clicking the row or the edit button opens the field in the slide-over Drawer.
 */
export function FieldListItem({
  id,
  index,
  control,
  isSelected,
  hasError = false,
  onSelect,
  onRemove,
}: FieldListItemProps<SchemaBuilderFieldValues>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const displayName = useWatch({
    control,
    name: `fields.${index}.displayName`,
  });
  const apiId = useWatch({
    control,
    name: `fields.${index}.apiId`,
  });
  const dataType = useWatch({ control, name: `fields.${index}.dataType` });
  const isRequired = useWatch({ control, name: `fields.${index}.isRequired` });
  const isUnique = useWatch({ control, name: `fields.${index}.isUnique` });
  const isLocalized = useWatch({
    control,
    name: `fields.${index}.isLocalized`,
  });
  const isRepeatable = useWatch({
    control,
    name: `fields.${index}.isRepeatable`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getFieldTypeIcon(dataType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-slot="field-list-item"
      data-dragging={isDragging || undefined}
      className={cn(
        'group flex h-11 min-h-[44px] max-h-[44px] items-center justify-between gap-2 rounded-lg border px-3 text-sm transition-colors',
        hasError
          ? isSelected
            ? 'border-destructive bg-destructive/10 ring-1 ring-destructive'
            : 'border-destructive/60 bg-destructive/5'
          : isSelected
            ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
            : 'border-border bg-card hover:bg-accent/40',
      )}
    >
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing p-0.5 rounded shrink-0"
          aria-label={`Reorder field ${index + 1}`}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelect(index)}
          className="flex flex-1 items-center gap-2 truncate text-left cursor-pointer"
        >
          {hasError ? (
            <AlertCircle
              className="size-4 text-destructive shrink-0"
              aria-label="Field has errors"
            />
          ) : (
            <Icon className="size-4 text-muted-foreground shrink-0" />
          )}

          <span
            data-slot="field-name"
            className={cn(
              'font-medium truncate',
              hasError && 'text-destructive',
              !displayName && 'italic text-muted-foreground font-normal',
            )}
          >
            {displayName || `Field ${index + 1}`}
          </span>

          {apiId ? (
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline truncate">
              ({apiId})
            </span>
          ) : null}

          {/* Only render type badge if display name is set to avoid confusing default "text" badge on empty fields */}
          {displayName && dataType ? (
            <Badge
              variant="outline"
              size="sm"
              className="font-mono text-xs capitalize shrink-0"
            >
              {dataType}
            </Badge>
          ) : null}

          {hasError ? (
            <Badge variant="destructive" size="sm" className="shrink-0">
              invalid
            </Badge>
          ) : null}
          {isRequired ? (
            <Badge variant="secondary" size="sm" className="shrink-0">
              *required
            </Badge>
          ) : null}
          {isUnique ? (
            <Badge variant="secondary" size="sm" className="shrink-0">
              unique
            </Badge>
          ) : null}
          {isLocalized ? (
            <Badge variant="secondary" size="sm" className="shrink-0">
              localized
            </Badge>
          ) : null}
          {isRepeatable ? (
            <Badge variant="secondary" size="sm" className="shrink-0">
              repeatable
            </Badge>
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onSelect(index)}
          aria-label={`Edit field ${index + 1}`}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
          aria-label={`Remove field ${index + 1}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
