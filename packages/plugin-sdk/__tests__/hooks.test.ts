import { describe, it, expect, vi } from 'vitest';
import type {
  ContentEntryRecord,
  SchemaRecord,
  CreateSchemaInput,
} from '@repo/types';
import {
  definePlugin,
  PluginError,
  PluginValidationError,
} from '../src/index.js';
import type {
  ContentBeforeCreateEvent,
  ContentAfterCreateEvent,
  ContentBeforePublishEvent,
  ContentAfterPublishEvent,
  SchemaBeforeCreateEvent,
  SchemaAfterCreateEvent,
} from '../src/index.js';

describe('Plugin Lifecycle Hooks', () => {
  it('should allow registering content beforeCreate and afterCreate hooks', async () => {
    const beforeCreateMock = vi.fn((event: ContentBeforeCreateEvent) => {
      return { ...event.data, modified: true };
    });

    const afterCreateMock = vi.fn((_event: ContentAfterCreateEvent) => {
      // Side effect
    });

    const plugin = definePlugin({
      config: {
        id: 'hooks-plugin',
        name: 'Hooks Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforeCreate': beforeCreateMock,
        'content.afterCreate': afterCreateMock,
      },
    });

    const mockBeforeEvent: ContentBeforeCreateEvent = {
      schemaId: 'schema-1',
      data: { title: 'Test' },
      userId: 'user-123',
      locale: 'en',
      applicationId: 'app-abc',
    };

    const mockEntry: ContentEntryRecord = {
      id: 'entry-1',
      status: 'draft',
      data: { title: 'Test', modified: true },
      publishedData: null,
    };

    const mockAfterEvent: ContentAfterCreateEvent = {
      schemaId: 'schema-1',
      entry: mockEntry,
      userId: 'user-123',
      locale: 'en',
      applicationId: 'app-abc',
    };

    const beforeResult =
      await plugin.hooks?.['content.beforeCreate']?.(mockBeforeEvent);
    await plugin.hooks?.['content.afterCreate']?.(mockAfterEvent);

    expect(beforeCreateMock).toHaveBeenCalledWith(mockBeforeEvent);
    expect(beforeResult).toEqual({ title: 'Test', modified: true });
    expect(afterCreateMock).toHaveBeenCalledWith(mockAfterEvent);
  });

  it('should allow registering content beforePublish and afterPublish hooks', async () => {
    const beforePublishMock = vi.fn((_event: ContentBeforePublishEvent) => {});
    const afterPublishMock = vi.fn((_event: ContentAfterPublishEvent) => {});

    const plugin = definePlugin({
      config: {
        id: 'publish-plugin',
        name: 'Publish Plugin',
        version: '1.0.0',
      },
      hooks: {
        'content.beforePublish': beforePublishMock,
        'content.afterPublish': afterPublishMock,
      },
    });

    const mockBeforePublish: ContentBeforePublishEvent = {
      entryId: 'entry-1',
      userId: 'user-123',
      locale: 'en',
      beforeState: null,
      applicationId: 'app-1',
    };

    const mockAfterPublish: ContentAfterPublishEvent = {
      entryId: 'entry-1',
      entry: {
        id: 'entry-1',
        status: 'published',
        data: {},
        publishedData: {},
      },
      userId: 'user-123',
      locale: 'en',
      applicationId: 'app-1',
    };

    await plugin.hooks?.['content.beforePublish']?.(mockBeforePublish);
    await plugin.hooks?.['content.afterPublish']?.(mockAfterPublish);

    expect(beforePublishMock).toHaveBeenCalledWith(mockBeforePublish);
    expect(afterPublishMock).toHaveBeenCalledWith(mockAfterPublish);
  });

  it('should allow registering schema beforeCreate and afterCreate hooks', async () => {
    const schemaInput: CreateSchemaInput = {
      name: 'Post',
      slug: 'posts',
      type: 'collection',
      fields: [],
    };

    const schemaRecord: SchemaRecord = {
      id: 'post-schema',
      name: 'Post',
      slug: 'posts',
      type: 'collection',
      definition: { fields: [] },
      status: 'draft',
      version: 1,
      createdAt: '2026-08-31T00:00:00Z',
      updatedAt: '2026-08-31T00:00:00Z',
    };

    const beforeSchemaMock = vi.fn((event: SchemaBeforeCreateEvent) => {
      return event.input;
    });

    const afterSchemaMock = vi.fn((_event: SchemaAfterCreateEvent) => {});

    const plugin = definePlugin({
      config: {
        id: 'schema-hooks-plugin',
        name: 'Schema Hooks Plugin',
        version: '1.0.0',
      },
      hooks: {
        'schema.beforeCreate': beforeSchemaMock,
        'schema.afterCreate': afterSchemaMock,
      },
    });

    const beforeResult = await plugin.hooks?.['schema.beforeCreate']?.({
      input: schemaInput,
    });
    await plugin.hooks?.['schema.afterCreate']?.({ schema: schemaRecord });

    expect(beforeSchemaMock).toHaveBeenCalledWith({ input: schemaInput });
    expect(beforeResult).toEqual(schemaInput);
    expect(afterSchemaMock).toHaveBeenCalledWith({ schema: schemaRecord });
  });

  it('should instantiate PluginError and PluginValidationError correctly', () => {
    const err = new PluginError('Custom error', 422);
    expect(err.message).toBe('Custom error');
    expect(err.statusCode).toBe(422);
    expect(err.isPluginError).toBe(true);

    const valErr = new PluginValidationError('Invalid data');
    expect(valErr.message).toBe('Invalid data');
    expect(valErr.statusCode).toBe(400);
    expect(valErr.isPluginError).toBe(true);
  });
});
