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

  return z.object(shape).passthrough();
}

function getBaseType(field: SchemaField): z.ZodTypeAny {
  switch (field.dataType) {
    case 'text':
    case 'richtext':
      return z.string();
    case 'number': {
      let num = z.number();

      const val = field.validation as { min?: number; max?: number } | null;
      if (val?.min !== undefined) {
        num = num.min(
          val.min,
          `${field.displayName} must be at least ${val.min}`,
        );
      }
      if (val?.max !== undefined) {
        num = num.max(
          val.max,
          `${field.displayName} must be at most ${val.max}`,
        );
      }

      return z.preprocess(
        (arg) => {
          if (arg === '' || arg === null || arg === undefined) {
            return undefined;
          }
          if (typeof arg === 'string') {
            const parsed = Number(arg);
            return Number.isNaN(parsed) ? arg : parsed;
          }
          return arg;
        },
        field.isRequired ? num : num.optional(),
      );
    }
    case 'boolean':
      return z.union([
        z.boolean(),
        z.string().transform((v) => v === 'true' || v === '1'),
      ]);
    case 'date':
    case 'datetime':
      return z.string();
    case 'media':
    case 'relation':
      return z.string();
    case 'email':
      return z.union([z.string().email(), z.literal('')]).optional();
    case 'url':
      return z.union([z.string().url(), z.literal('')]).optional();
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
  }

  return schema;
}
