import { SchemaComposer } from 'graphql-compose';
import type { GraphQLSchema } from 'graphql';
import type { SchemaDefinition } from '@repo/types';
import type { SchemaRecord } from '@repo/shared-db';
import { ContentService } from '../content/content.service.js';
import { parseContentQuery } from '../content/query/content-query.util.js';
import { fieldTypeSpec } from './type-mapper.js';
import { toCamelCase, toPascalCase, toPluralCamelCase } from './naming.js';
import { jsonScalarConfig } from './json-scalar.js';
import { GraphQLContext } from '../../types/graphql.types.js';
import { assertPermission } from './graphql.context.js';
const contentService = new ContentService();
interface EntryPayload {
  id: string;
  status: string;
  data: unknown;
  publishedData: unknown;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}
// Normalize backend entry
function toEntryPayload(raw: {
  entryId?: string;
  id?: string;
  status: string;
  data: unknown;
  publishedData?: unknown;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}): EntryPayload {
  return {
    id: raw.entryId ?? raw.id!,
    status: raw.status,
    data: raw.data,
    publishedData: raw.publishedData ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}
// Build GraphQL schema
export function buildGraphQLSchema(schemas: SchemaRecord[]): GraphQLSchema {
  const composer = new SchemaComposer<GraphQLContext>();
  composer.createScalarTC(jsonScalarConfig);
  const paginationMetaTC = composer.createObjectTC({
    name: 'PaginationMeta',
    fields: {
      page: 'Int!',
      pageSize: 'Int!',
      total: 'Int!',
      pageCount: 'Int!',
    },
  });
  // Add default root query
  composer.Query.addFields({
    _ping: {
      type: 'String!',
      resolve: () => 'pong',
    },
  });
  for (const schema of schemas) {
    registerSchemaTypes(composer, paginationMetaTC, schema);
  }
  return composer.buildSchema();
}
function registerSchemaTypes(
  composer: SchemaComposer<GraphQLContext>,
  paginationMetaTC: ReturnType<SchemaComposer['createObjectTC']>,
  schema: SchemaRecord,
): void {
  const { fields } = schema.definition as SchemaDefinition;
  const typeName = toPascalCase(schema.slug);
  const singularField = toCamelCase(schema.slug);
  const pluralField = toPluralCamelCase(schema.slug);
  const entryTC = composer.createObjectTC({
    name: typeName,
    fields: {
      id: 'ID!',
      status: 'String!',
      createdAt: 'String',
      updatedAt: 'String',
      publishedData: 'JSON',
    },
  });
  for (const field of fields) {
    entryTC.addFields({
      [field.apiId]: {
        type: fieldTypeSpec(field),
        resolve: (source: { data?: Record<string, unknown> }) =>
          source.data?.[field.apiId] ?? null,
      },
    });
  }
  const connectionTC = composer.createObjectTC({
    name: `${typeName}Connection`,
    fields: {
      data: entryTC.NonNull.List.NonNull,
      meta: paginationMetaTC.NonNull,
    },
  });
  composer.Query.addFields({
    [singularField]: {
      type: entryTC,
      args: { id: 'ID!', locale: 'String' },
      resolve: async (
        _src,
        args: { id: string; locale?: string },
        context: GraphQLContext,
      ) => {
        await assertPermission(context, 'read', schema.id);
        return contentService.getEntryById(args.id, args.locale, schema.id);
      },
    },
    [pluralField]: {
      type: connectionTC.NonNull,
      args: {
        filters: 'JSON',
        sort: 'String',
        search: 'String',
        page: 'Int',
        pageSize: 'Int',
        locale: 'String',
      },
      resolve: async (
        _src,
        args: {
          filters?: unknown;
          sort?: string;
          search?: string;
          page?: number;
          pageSize?: number;
          locale?: string;
        },
        context: GraphQLContext,
      ) => {
        await assertPermission(context, 'read', schema.id);
        const contentQuery = parseContentQuery(
          {
            filters: args.filters,
            sort: args.sort,
            search: args.search,
            page: args.page?.toString(),
            pageSize: args.pageSize?.toString(),
          },
          fields,
        );
        const [entries, total] = await Promise.all([
          contentService.listEntries(schema.id, args.locale, contentQuery),
          contentService.countEntries(schema.id, args.locale, contentQuery),
        ]);
        return {
          data: entries,
          meta: {
            page: contentQuery.page,
            pageSize: contentQuery.pageSize,
            total,
            pageCount: Math.ceil(total / contentQuery.pageSize),
          },
        };
      },
    },
  });
  composer.Mutation.addFields({
    [`create${typeName}`]: {
      type: entryTC.NonNull,
      args: { data: 'JSON!', locale: 'String' },
      resolve: async (
        _src,
        args: { data: Record<string, unknown>; locale?: string },
        context: GraphQLContext,
      ) => {
        await assertPermission(context, 'create', schema.id);
        const result = await contentService.createDraft(
          schema.id,
          args.data,
          context.user!.id,
          args.locale,
        );
        return toEntryPayload(result);
      },
    },
    [`update${typeName}`]: {
      type: entryTC.NonNull,
      args: {
        id: 'ID!',
        data: 'JSON!',
        locale: 'String',
      },
      resolve: async (
        _src,
        args: { id: string; data: Record<string, unknown>; locale?: string },
        context: GraphQLContext,
      ) => {
        await assertPermission(context, 'update', schema.id);
        const result = await contentService.updateDraft(
          args.id,
          args.data,
          context.user!.id,
          args.locale,
        );
        return toEntryPayload(result);
      },
    },
    [`publish${typeName}`]: {
      type: entryTC.NonNull,
      args: { id: 'ID!', locale: 'String' },
      resolve: async (
        _src,
        args: { id: string; locale?: string },
        context: GraphQLContext,
      ) => {
        await assertPermission(context, 'publish', schema.id);
        const result = await contentService.publishEntry(
          args.id,
          context.user!.id,
          args.locale,
        );
        return toEntryPayload(result);
      },
    },
    [`delete${typeName}`]: {
      type: 'Boolean!',
      args: { id: 'ID!' },
      resolve: async (_src, args: { id: string }, context: GraphQLContext) => {
        await assertPermission(context, 'delete', schema.id);
        await contentService.deleteEntry(args.id);
        return true;
      },
    },
  });
}
