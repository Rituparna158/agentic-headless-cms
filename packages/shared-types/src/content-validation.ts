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

    // `isRequired` only controls whether the field is wrapped in
    // `.optional()` below — for strings that isn't enough, since an empty
    // string is still a valid, present value as far as Zod is concerned. A
    // "required" text/richtext field with no explicit min-length validation
    // would otherwise silently accept ''. Only apply when the field didn't
    // already specify its own min (respect an explicit, possibly larger,
    // minimum instead of overriding it).
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
    case 'datetime':
      return z.string().datetime(); // ISO-8601 strings
    case 'media':
    case 'relation':
      return z.string().uuid();
    case 'email':
      return z.string().email();
    case 'url':
      return z.string().url();
    case 'enum': {
      // `config.options` is the schema builder's convention for an enum
      // field's allowed values — see field-settings-panel.tsx (issue #20).
      // No options configured means the field can't validate anything
      // meaningful yet; fall back to a plain string rather than silently
      // accepting arbitrary values via z.any().
      const options = (field.config as { options?: unknown } | null)?.options;
      return Array.isArray(options) &&
        options.every((o) => typeof o === 'string') &&
        options.length > 0
        ? z.enum(options as [string, ...string[]])
        : z.string();
    }
    case 'json':
      // Deliberately permissive — json fields are meant to hold arbitrary
      // JSON-compatible structures, unlike the other cases above where
      // falling through to z.any() was an unintentional validation gap.
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
