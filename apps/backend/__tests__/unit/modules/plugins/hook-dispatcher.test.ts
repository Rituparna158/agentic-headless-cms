import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookDispatcherService } from '../../../../src/modules/plugins/hook-dispatcher.service.js';
import { ApiError } from '@repo/utils';
import type { ContentEntryRecord } from '@repo/types';
import type {
  ContentBeforeCreateEvent,
  SchemaBeforeCreateEvent,
  SchemaBeforeDeleteEvent,
} from '@repo/plugin-sdk';

describe('HookDispatcherService', () => {
  let dispatcher: HookDispatcherService;

  beforeEach(() => {
    dispatcher = new HookDispatcherService();
  });

  describe('Content Hooks', () => {
    it('should sequentially mutate data in content.beforeCreate pipeline', async () => {
      // Plugin A adds a slug
      dispatcher.registerHooks('plugin-a', {
        'content.beforeCreate': (event: ContentBeforeCreateEvent) => {
          return {
            ...event.data,
            slug: 'auto-generated-slug',
          };
        },
      });

      // Plugin B uppercases title and receives mutated slug from Plugin A
      dispatcher.registerHooks('plugin-b', {
        'content.beforeCreate': (event: ContentBeforeCreateEvent) => {
          return {
            ...event.data,
            title: String(event.data.title).toUpperCase(),
          };
        },
      });

      const finalData = await dispatcher.dispatchContentBeforeCreate({
        schemaId: 'schema-1',
        data: { title: 'hello world' },
        userId: 'user-1',
        locale: 'en',
      });

      expect(finalData).toEqual({
        title: 'HELLO WORLD',
        slug: 'auto-generated-slug',
      });
    });

    it('should merge partial modifications in content.beforeCreate without wiping other fields', async () => {
      dispatcher.registerHooks('partial-mutator', {
        'content.beforeCreate': () => {
          return { slug: 'only-slug' };
        },
      });

      const finalData = await dispatcher.dispatchContentBeforeCreate({
        schemaId: 'schema-1',
        data: { title: 'Keep Me', author: 'Alice' },
        userId: 'user-1',
        locale: 'en',
      });

      expect(finalData).toEqual({
        title: 'Keep Me',
        author: 'Alice',
        slug: 'only-slug',
      });
    });

    it('should inject persisted pluginConfig into hook execution context', async () => {
      let receivedConfig: Record<string, unknown> | undefined;

      dispatcher.registerHooks(
        'configured-plugin',
        {
          'content.beforeCreate': (event: ContentBeforeCreateEvent) => {
            receivedConfig = event.pluginConfig;
            return event.data;
          },
        },
        { apiKey: 'sk-test-12345', maxRetries: 3 },
      );

      await dispatcher.dispatchContentBeforeCreate({
        schemaId: 'schema-1',
        data: { title: 'Test' },
        userId: 'user-1',
        locale: 'en',
      });

      expect(receivedConfig).toEqual({
        apiKey: 'sk-test-12345',
        maxRetries: 3,
      });
    });

    it('should abort content.beforeCreate when a plugin throws an error', async () => {
      dispatcher.registerHooks('strict-validator', {
        'content.beforeCreate': (event: ContentBeforeCreateEvent) => {
          if (!event.data.title) {
            throw new ApiError(400, 'Title is strictly required by plugin');
          }
        },
      });

      await expect(
        dispatcher.dispatchContentBeforeCreate({
          schemaId: 'schema-1',
          data: {},
          userId: 'user-1',
          locale: 'en',
        }),
      ).rejects.toThrow('Title is strictly required by plugin');
    });

    it('should isolate errors in content.afterCreate without breaking execution', async () => {
      const errorPlugin = vi.fn().mockImplementation(() => {
        throw new Error('Third-party webhook failed');
      });
      const safePlugin = vi.fn();

      dispatcher.registerHooks('bad-plugin', {
        'content.afterCreate': errorPlugin,
      });
      dispatcher.registerHooks('good-plugin', {
        'content.afterCreate': safePlugin,
      });

      const mockEntry: ContentEntryRecord = {
        id: 'entry-1',
        status: 'draft',
        data: {},
        publishedData: null,
      };

      await expect(
        dispatcher.dispatchContentAfterCreate({
          schemaId: 'schema-1',
          entry: mockEntry,
          userId: 'user-1',
          locale: 'en',
        }),
      ).resolves.toBeUndefined();

      expect(errorPlugin).toHaveBeenCalled();
      expect(safePlugin).toHaveBeenCalled();
    });

    it('should dispatch content.beforePublish and content.afterPublish hooks', async () => {
      const beforePublishMock = vi.fn();
      const afterPublishMock = vi.fn();

      dispatcher.registerHooks('publisher-plugin', {
        'content.beforePublish': beforePublishMock,
        'content.afterPublish': afterPublishMock,
      });

      await dispatcher.dispatchContentBeforePublish({
        entryId: 'e-1',
        userId: 'u-1',
        locale: 'en',
        beforeState: null,
      });

      const mockEntry: ContentEntryRecord = {
        id: 'e-1',
        status: 'published',
        data: {},
        publishedData: {},
      };

      await dispatcher.dispatchContentAfterPublish({
        entryId: 'e-1',
        entry: mockEntry,
        userId: 'u-1',
        locale: 'en',
      });

      expect(beforePublishMock).toHaveBeenCalled();
      expect(afterPublishMock).toHaveBeenCalled();
    });

    it('should dispatch content.beforeUnpublish and content.afterUnpublish hooks', async () => {
      const beforeUnpublishMock = vi.fn();
      const afterUnpublishMock = vi.fn();

      dispatcher.registerHooks('unpublisher-plugin', {
        'content.beforeUnpublish': beforeUnpublishMock,
        'content.afterUnpublish': afterUnpublishMock,
      });

      await dispatcher.dispatchContentBeforeUnpublish({
        entryId: 'e-1',
        userId: 'u-1',
        locale: 'en',
        beforeState: null,
      });

      const mockEntry: ContentEntryRecord = {
        id: 'e-1',
        status: 'draft',
        data: {},
        publishedData: {},
      };

      await dispatcher.dispatchContentAfterUnpublish({
        entryId: 'e-1',
        entry: mockEntry,
        userId: 'u-1',
        locale: 'en',
      });

      expect(beforeUnpublishMock).toHaveBeenCalled();
      expect(afterUnpublishMock).toHaveBeenCalled();
    });
  });

  describe('Schema Hooks', () => {
    it('should allow schema.beforeCreate to transform schema input and merge changes', async () => {
      dispatcher.registerHooks('schema-plugin', {
        'schema.beforeCreate': (event: SchemaBeforeCreateEvent) => {
          return {
            ...event.input,
            slug: `prefix-${event.input.slug}`,
          };
        },
      });

      const transformed = await dispatcher.dispatchSchemaBeforeCreate({
        input: {
          name: 'Blog Post',
          slug: 'blog-post',
          type: 'collection',
          fields: [],
        },
      });

      expect(transformed.slug).toBe('prefix-blog-post');
      expect(transformed.name).toBe('Blog Post');
    });

    it('should dispatch schema.beforeDelete and allow cancellation via throw', async () => {
      dispatcher.registerHooks('lock-plugin', {
        'schema.beforeDelete': (event: SchemaBeforeDeleteEvent) => {
          if (event.schemaId === 'locked-schema') {
            throw new ApiError(403, 'Cannot delete locked system schema');
          }
        },
      });

      await expect(
        dispatcher.dispatchSchemaBeforeDelete({
          schemaId: 'locked-schema',
          beforeState: null,
        }),
      ).rejects.toThrow('Cannot delete locked system schema');
    });
  });
});
