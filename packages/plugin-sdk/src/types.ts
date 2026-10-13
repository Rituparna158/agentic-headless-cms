import type { Request, Response, NextFunction } from 'express';
import type {
  ContentEntryRecord,
  SchemaRecord,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '@repo/types';

export interface ContentBeforeCreateEvent {
  schemaId: string;
  data: Record<string, unknown>;
  userId: string;
  locale: string;
  applicationId?: string;
}

export type ContentBeforeCreateHook = (
  event: ContentBeforeCreateEvent,
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;

export interface ContentBeforeUpdateEvent {
  entryId: string;
  data: Record<string, unknown>;
  userId: string;
  locale: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentBeforeUpdateHook = (
  event: ContentBeforeUpdateEvent,
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;

export interface ContentAfterCreateEvent {
  schemaId: string;
  entry: ContentEntryRecord;
  userId: string;
  locale: string;
  applicationId?: string;
}

export type ContentAfterCreateHook = (
  event: ContentAfterCreateEvent,
) => Promise<void> | void;

export interface ContentAfterUpdateEvent {
  entryId: string;
  entry: ContentEntryRecord;
  userId: string;
  locale: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentAfterUpdateHook = (
  event: ContentAfterUpdateEvent,
) => Promise<void> | void;

export interface ContentBeforeDeleteEvent {
  entryId: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentBeforeDeleteHook = (
  event: ContentBeforeDeleteEvent,
) => Promise<void> | void;

export interface ContentAfterDeleteEvent {
  entryId: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentAfterDeleteHook = (
  event: ContentAfterDeleteEvent,
) => Promise<void> | void;

export interface ContentBeforePublishEvent {
  entryId: string;
  userId: string;
  locale: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentBeforePublishHook = (
  event: ContentBeforePublishEvent,
) => Promise<void> | void;

export interface ContentAfterPublishEvent {
  entryId: string;
  entry: ContentEntryRecord;
  userId: string;
  locale: string;
  applicationId?: string;
}

export type ContentAfterPublishHook = (
  event: ContentAfterPublishEvent,
) => Promise<void> | void;

export interface ContentBeforeUnpublishEvent {
  entryId: string;
  userId: string;
  locale: string;
  beforeState: ContentEntryRecord | null;
  applicationId?: string;
}

export type ContentBeforeUnpublishHook = (
  event: ContentBeforeUnpublishEvent,
) => Promise<void> | void;

export interface ContentAfterUnpublishEvent {
  entryId: string;
  entry: ContentEntryRecord;
  userId: string;
  locale: string;
  applicationId?: string;
}

export type ContentAfterUnpublishHook = (
  event: ContentAfterUnpublishEvent,
) => Promise<void> | void;

export interface SchemaBeforeCreateEvent {
  input: CreateSchemaInput;
  applicationId?: string;
}

export type SchemaBeforeCreateHook = (
  event: SchemaBeforeCreateEvent,
) => Promise<CreateSchemaInput | void> | CreateSchemaInput | void;

export interface SchemaAfterCreateEvent {
  schema: SchemaRecord;
  applicationId?: string;
}

export type SchemaAfterCreateHook = (
  event: SchemaAfterCreateEvent,
) => Promise<void> | void;

export interface SchemaBeforeUpdateEvent {
  schemaId: string;
  input: UpdateSchemaInput;
  beforeState: SchemaRecord | null;
  applicationId?: string;
}

export type SchemaBeforeUpdateHook = (
  event: SchemaBeforeUpdateEvent,
) => Promise<UpdateSchemaInput | void> | UpdateSchemaInput | void;

export interface SchemaAfterUpdateEvent {
  schemaId: string;
  schema: SchemaRecord;
  beforeState: SchemaRecord | null;
  applicationId?: string;
}

export type SchemaAfterUpdateHook = (
  event: SchemaAfterUpdateEvent,
) => Promise<void> | void;

export interface SchemaBeforeDeleteEvent {
  schemaId: string;
  beforeState: SchemaRecord | null;
  applicationId?: string;
}

export type SchemaBeforeDeleteHook = (
  event: SchemaBeforeDeleteEvent,
) => Promise<void> | void;

export interface SchemaAfterDeleteEvent {
  schemaId: string;
  beforeState: SchemaRecord | null;
  applicationId?: string;
}

export type SchemaAfterDeleteHook = (
  event: SchemaAfterDeleteEvent,
) => Promise<void> | void;

export interface PluginHooks {
  'content.beforeCreate'?: ContentBeforeCreateHook;
  'content.afterCreate'?: ContentAfterCreateHook;
  'content.beforeUpdate'?: ContentBeforeUpdateHook;
  'content.afterUpdate'?: ContentAfterUpdateHook;
  'content.beforeDelete'?: ContentBeforeDeleteHook;
  'content.afterDelete'?: ContentAfterDeleteHook;
  'content.beforePublish'?: ContentBeforePublishHook;
  'content.afterPublish'?: ContentAfterPublishHook;
  'content.beforeUnpublish'?: ContentBeforeUnpublishHook;
  'content.afterUnpublish'?: ContentAfterUnpublishHook;

  'schema.beforeCreate'?: SchemaBeforeCreateHook;
  'schema.afterCreate'?: SchemaAfterCreateHook;
  'schema.beforeUpdate'?: SchemaBeforeUpdateHook;
  'schema.afterUpdate'?: SchemaAfterUpdateHook;
  'schema.beforeDelete'?: SchemaBeforeDeleteHook;
  'schema.afterDelete'?: SchemaAfterDeleteHook;
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface PluginRoute {
  path: string;
  method: HttpMethod;
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void> | void;
  middlewares?: Array<
    (req: Request, res: Response, next: NextFunction) => Promise<void> | void
  >;
  auth?: boolean;
}

export interface AdminUiMenuExtension {
  label: string;
  icon?: string;
  destination: string;
}

export interface AdminUiFieldExtension {
  name: string;
  dataType: string;
  componentName: string;
}

export interface AdminUiExtensions {
  menus?: AdminUiMenuExtension[];
  fields?: AdminUiFieldExtension[];
}

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface PluginDefinition {
  config: PluginConfig;
  hooks?: PluginHooks;
  routes?: PluginRoute[];
  uiExtensions?: AdminUiExtensions;
}
