import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HookDispatcherService } from '../../../../src/modules/plugins/hook-dispatcher.service.js';
import { ApiError } from '@repo/utils';
import type { ContentEntryRecord } from '@repo/types';

describe('HookDispatcherService', () => {
  let dispatcher: HookDispatcherService;

  beforeEach(() => {
    dispatcher = new HookDispatcherService();
  });

  describe('Content Hooks', () => {
    it('should sequentially mutate data in content.beforeCreate pipeline', async () => {
      // Plugin A adds a slug
      dispatcher.registerHooks('plugin-a', {
        'content.beforeCreate': (event) => {
          return {
            ...event.data,
            slug: 'auto-generated-slug',
          };
        },
      });

      // Plugin B uppercases title and receives mutated slug from Plugin A
      dispatcher.registerHooks('plugin-b', {
        'content.beforeCreate': (event) => {
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

    it('should abort content.beforeCreate when a plugin throws an error', async () => {
      dispatcher.registerHooks('strict-validator', {
        'content.beforeCreate': (event) => {
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
  });

  describe('Schema Hooks', () => {
    it('should allow schema.beforeCreate to transform schema input', async () => {
      dispatcher.registerHooks('schema-plugin', {
        'schema.beforeCreate': (event) => {
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
    });

    it('should dispatch schema.beforeDelete and allow cancellation via throw', async () => {
      dispatcher.registerHooks('lock-plugin', {
        'schema.beforeDelete': (event) => {
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
