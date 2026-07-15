import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import type { SchemaField } from '@repo/shared-types';
import { jsonScalarConfig } from './json-scalar.js';

/**
 * Maps a schema field's dataType to the GraphQL type used both for the
 * generated content type's fields and (via isRequired/isRepeatable) its
 * nullability/list wrapping. Dates are represented as ISO-8601 strings
 * rather than a custom Date scalar — the REST API already returns them the
 * same way, so this keeps the two delivery surfaces consistent without
 * introducing a scalar with its own parsing edge cases.
 */
function baseTypeName(field: SchemaField): string {
  switch (field.dataType) {
    case 'number':
      return GraphQLFloat.name;
    case 'boolean':
      return GraphQLBoolean.name;
    case 'media':
    case 'relation':
      return GraphQLID.name;
    case 'json':
      return jsonScalarConfig.name;
    case 'text':
    case 'richtext':
    case 'date':
    case 'datetime':
    case 'email':
    case 'url':
    case 'enum':
    default:
      return GraphQLString.name;
  }
}

/** graphql-compose accepts type specs as strings like 'String!' / '[String]'. */
export function fieldTypeSpec(field: SchemaField): string {
  const base = baseTypeName(field);
  const withList = field.isRepeatable ? `[${base}]` : base;
  return field.isRequired ? `${withList}!` : withList;
}
