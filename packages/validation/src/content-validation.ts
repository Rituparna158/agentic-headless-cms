import { z } from 'zod';
import type { SchemaDefinition, SchemaField } from '@repo/types';

export function compileZodSchema(
  definition: SchemaDefinition,
): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of definition.fields) {
    let fieldSchema = getBaseType(field);

    if (field.validation) {
      fieldSchema = applyValidations(fieldSchema, field);
    }

    if (
      field.isRequired &&
      (field.dataType === 'text' || field.dataType === 'richtext') &&
      (field.validation as { min?: number } | null)?.min === undefined
    ) {
      fieldSchema = (fieldSchema as z.ZodString).min(
        1,
        `${field.displayName} is required`,
      );
    }

    if (field.isRepeatable) {
      fieldSchema = z.array(fieldSchema);
    }

    if (!field.isRequired) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.apiId] = fieldSchema;
  }

  return z.object(shape).strict();
}

function getBaseType(field: SchemaField): z.ZodTypeAny {
  switch (field.dataType) {
    case 'text':
    case 'richtext':
      return z.string();
    case 'number':
      return z.number();
    case 'boolean':
      return z.boolean();
    case 'date':
    case 'datetime':
      return z.string().datetime();
    case 'media':
    case 'relation':
      return z.string().uuid();
    case 'email':
      return z.string().email();
    case 'url':
      return z.string().url();
    case 'enum': {
      const options = (field.config as { options?: unknown } | null)?.options;
      return Array.isArray(options) &&
        options.every((o) => typeof o === 'string') &&
        options.length > 0
        ? z.enum(options as [string, ...string[]])
        : z.string();
    }
    case 'json':
      return z.any();
    default:
      return z.any();
  }
}

function applyValidations(
  baseSchema: z.ZodTypeAny,
  field: SchemaField,
): z.ZodTypeAny {
  let schema = baseSchema;

  if (field.dataType === 'text' || field.dataType === 'richtext') {
    const s = schema as z.ZodString;
    let stringSchema = s;

    const val = field.validation as {
      min?: number;
      max?: number;
      regex?: string;
    } | null;
    if (val?.min !== undefined) {
      stringSchema = stringSchema.min(val.min);
    }
    if (val?.max !== undefined) {
      stringSchema = stringSchema.max(val.max);
    }
    if (val?.regex) {
      stringSchema = stringSchema.regex(new RegExp(val.regex));
    }
    schema = stringSchema;
  } else if (field.dataType === 'number') {
    const s = schema as z.ZodNumber;
    let numberSchema = s;

    const val = field.validation as { min?: number; max?: number } | null;
    if (val?.min !== undefined) {
      numberSchema = numberSchema.min(val.min);
    }
    if (val?.max !== undefined) {
      numberSchema = numberSchema.max(val.max);
    }
    schema = numberSchema;
  }

  return schema;
}
