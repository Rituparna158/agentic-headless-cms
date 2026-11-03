import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import type { SchemaField } from '@repo/types';
import { jsonScalarConfig } from './json-scalar.js';
// Map schema field to GraphQL type
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
// Format field type spec
export function fieldTypeSpec(field: SchemaField): string {
  const base = baseTypeName(field);
  const withList = field.isRepeatable ? `[${base}]` : base;
  return field.isRequired ? `${withList}!` : withList;
}
