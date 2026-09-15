import type {
  PluginHooks,
  ContentBeforeCreateEvent,
  ContentAfterCreateEvent,
  ContentBeforeUpdateEvent,
  ContentAfterUpdateEvent,
  ContentBeforeDeleteEvent,
  ContentAfterDeleteEvent,
  SchemaBeforeCreateEvent,
  SchemaAfterCreateEvent,
  SchemaBeforeUpdateEvent,
  SchemaAfterUpdateEvent,
  SchemaBeforeDeleteEvent,
  SchemaAfterDeleteEvent,
} from '@repo/plugin-sdk';
import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/types';
import { logger } from '@repo/logger';

interface RegisteredHook<T> {
  pluginId: string;
  handler: T;
}

export class HookDispatcherService {
  private hooksMap = new Map<keyof PluginHooks, RegisteredHook<unknown>[]>();

  public registerHooks(pluginId: string, hooks?: PluginHooks): void {
    if (!hooks) return;

    for (const [key, handler] of Object.entries(hooks)) {
      const hookName = key as keyof PluginHooks;
      if (typeof handler === 'function') {
        const list = this.hooksMap.get(hookName) ?? [];
        list.push({ pluginId, handler });
        this.hooksMap.set(hookName, list);
      }
    }
  }

  public unregisterHooks(pluginId: string): void {
    for (const [hookName, list] of this.hooksMap.entries()) {
      const filtered = list.filter((item) => item.pluginId !== pluginId);
      if (filtered.length === 0) {
        this.hooksMap.delete(hookName);
      } else {
        this.hooksMap.set(hookName, filtered);
      }
    }
  }

  public clear(): void {
    this.hooksMap.clear();
  }

  public getRegisteredHookNames(): string[] {
    return Array.from(this.hooksMap.keys());
  }

  public async dispatchContentBeforeCreate(
    event: ContentBeforeCreateEvent,
  ): Promise<Record<string, unknown>> {
    const handlers =
      (this.hooksMap.get('content.beforeCreate') as
        | RegisteredHook<
            (
              e: ContentBeforeCreateEvent,
            ) => Promise<Record<string, unknown> | void>
          >[]
        | undefined) ?? [];

    let currentData = { ...event.data };

    for (const { pluginId, handler } of handlers) {
      try {
        const result = await handler({ ...event, data: currentData });
        if (result && typeof result === 'object') {
          currentData = result;
        }
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.beforeCreate', err: error },
          `Plugin "${pluginId}" aborted content.beforeCreate`,
        );
        throw error;
      }
    }

    return currentData;
  }

  public async dispatchContentBeforeUpdate(
    event: ContentBeforeUpdateEvent,
  ): Promise<Record<string, unknown>> {
    const handlers =
      (this.hooksMap.get('content.beforeUpdate') as
        | RegisteredHook<
            (
              e: ContentBeforeUpdateEvent,
            ) => Promise<Record<string, unknown> | void>
          >[]
        | undefined) ?? [];

    let currentData = { ...event.data };

    for (const { pluginId, handler } of handlers) {
      try {
        const result = await handler({ ...event, data: currentData });
        if (result && typeof result === 'object') {
          currentData = result;
        }
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.beforeUpdate', err: error },
          `Plugin "${pluginId}" aborted content.beforeUpdate`,
        );
        throw error;
      }
    }

    return currentData;
  }

  public async dispatchContentBeforeDelete(
    event: ContentBeforeDeleteEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('content.beforeDelete') as
        | RegisteredHook<(e: ContentBeforeDeleteEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.beforeDelete', err: error },
          `Plugin "${pluginId}" aborted content.beforeDelete`,
        );
        throw error;
      }
    }
  }

  public async dispatchContentAfterCreate(
    event: ContentAfterCreateEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('content.afterCreate') as
        | RegisteredHook<(e: ContentAfterCreateEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.afterCreate', err: error },
          `Plugin "${pluginId}" error in content.afterCreate`,
        );
      }
    }
  }

  public async dispatchContentAfterUpdate(
    event: ContentAfterUpdateEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('content.afterUpdate') as
        | RegisteredHook<(e: ContentAfterUpdateEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.afterUpdate', err: error },
          `Plugin "${pluginId}" error in content.afterUpdate`,
        );
      }
    }
  }

  public async dispatchContentAfterDelete(
    event: ContentAfterDeleteEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('content.afterDelete') as
        | RegisteredHook<(e: ContentAfterDeleteEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'content.afterDelete', err: error },
          `Plugin "${pluginId}" error in content.afterDelete`,
        );
      }
    }
  }

  public async dispatchSchemaBeforeCreate(
    event: SchemaBeforeCreateEvent,
  ): Promise<CreateSchemaInput> {
    const handlers =
      (this.hooksMap.get('schema.beforeCreate') as
        | RegisteredHook<
            (e: SchemaBeforeCreateEvent) => Promise<CreateSchemaInput | void>
          >[]
        | undefined) ?? [];

    let currentInput = { ...event.input };

    for (const { pluginId, handler } of handlers) {
      try {
        const result = await handler({ ...event, input: currentInput });
        if (result && typeof result === 'object') {
          currentInput = result;
        }
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.beforeCreate', err: error },
          `Plugin "${pluginId}" aborted schema.beforeCreate`,
        );
        throw error;
      }
    }

    return currentInput;
  }

  public async dispatchSchemaBeforeUpdate(
    event: SchemaBeforeUpdateEvent,
  ): Promise<UpdateSchemaInput> {
    const handlers =
      (this.hooksMap.get('schema.beforeUpdate') as
        | RegisteredHook<
            (e: SchemaBeforeUpdateEvent) => Promise<UpdateSchemaInput | void>
          >[]
        | undefined) ?? [];

    let currentInput = { ...event.input };

    for (const { pluginId, handler } of handlers) {
      try {
        const result = await handler({ ...event, input: currentInput });
        if (result && typeof result === 'object') {
          currentInput = result;
        }
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.beforeUpdate', err: error },
          `Plugin "${pluginId}" aborted schema.beforeUpdate`,
        );
        throw error;
      }
    }

    return currentInput;
  }

  public async dispatchSchemaBeforeDelete(
    event: SchemaBeforeDeleteEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('schema.beforeDelete') as
        | RegisteredHook<(e: SchemaBeforeDeleteEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.beforeDelete', err: error },
          `Plugin "${pluginId}" aborted schema.beforeDelete`,
        );
        throw error;
      }
    }
  }

  public async dispatchSchemaAfterCreate(
    event: SchemaAfterCreateEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('schema.afterCreate') as
        | RegisteredHook<(e: SchemaAfterCreateEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.afterCreate', err: error },
          `Plugin "${pluginId}" error in schema.afterCreate`,
        );
      }
    }
  }

  public async dispatchSchemaAfterUpdate(
    event: SchemaAfterUpdateEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('schema.afterUpdate') as
        | RegisteredHook<(e: SchemaAfterUpdateEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.afterUpdate', err: error },
          `Plugin "${pluginId}" error in schema.afterUpdate`,
        );
      }
    }
  }

  public async dispatchSchemaAfterDelete(
    event: SchemaAfterDeleteEvent,
  ): Promise<void> {
    const handlers =
      (this.hooksMap.get('schema.afterDelete') as
        | RegisteredHook<(e: SchemaAfterDeleteEvent) => Promise<void>>[]
        | undefined) ?? [];

    for (const { pluginId, handler } of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(
          { pluginId, hook: 'schema.afterDelete', err: error },
          `Plugin "${pluginId}" error in schema.afterDelete`,
        );
      }
    }
  }
}

export const hookDispatcher = new HookDispatcherService();
