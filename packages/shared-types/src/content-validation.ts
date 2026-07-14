import { z } from 'zod';
import { SchemaDefinition, SchemaField } from './schema-definition.js';

/**
 * Compiles a SchemaDefinition into a dynamic Zod schema.
 */
export function compileZodSchema(
  definition: SchemaDefinition,
): z.ZodObject<z.ZodRawShape> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of definition.fields) {
    let fieldSchema = getBaseType(field);

    if (field.validation) {
      fieldSchema = applyValidations(fieldSchema, field);
    }

    // Handle repeatability (arrays)
    if (field.isRepeatable) {
      fieldSchema = z.array(fieldSchema);
    }

    // Handle required/optional
    if (!field.isRequired) {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.apiId] = fieldSchema;
  }

  return z.object(shape).strict(); // Strict means no unknown fields allowed
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
      return z.string().datetime(); // ISO-8601 strings
    case 'media':
    case 'relation':
      return z.string().uuid();
    default:
      // Fallback for unknown types
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

    // validation is typed as Record<string, unknown> | nullish, so we need assertions
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
