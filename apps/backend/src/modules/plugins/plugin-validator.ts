import type { PluginDefinition } from '@repo/plugin-sdk';
import { ApiError } from '@repo/utils';

const PLUGIN_ID_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/;
const VALID_HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch']);
const VALID_HOOK_NAMES = new Set([
  'content.beforeCreate',
  'content.afterCreate',
  'content.beforeUpdate',
  'content.afterUpdate',
  'content.beforeDelete',
  'content.afterDelete',
  'schema.beforeCreate',
  'schema.afterCreate',
  'schema.beforeUpdate',
  'schema.afterUpdate',
  'schema.beforeDelete',
  'schema.afterDelete',
]);

export function validatePluginDefinition(input: unknown): PluginDefinition {
  if (!input || typeof input !== 'object') {
    throw new ApiError(400, 'Plugin definition must be a valid object');
  }

  const def = input as Partial<PluginDefinition>;

  if (!def.config || typeof def.config !== 'object') {
    throw new ApiError(400, 'Plugin configuration (config) is required');
  }

  const { id, name, version } = def.config;

  if (!id || typeof id !== 'string') {
    throw new ApiError(400, 'Plugin config.id must be a non-empty string');
  }

  if (!PLUGIN_ID_REGEX.test(id)) {
    throw new ApiError(
      400,
      `Invalid plugin id "${id}". Plugin id must be kebab-case (e.g. "seo-optimizer", "slug-generator")`,
    );
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ApiError(400, 'Plugin config.name must be a non-empty string');
  }

  if (!version || typeof version !== 'string' || !SEMVER_REGEX.test(version)) {
    throw new ApiError(
      400,
      `Invalid plugin version "${version}". Plugin version must follow SemVer format (e.g. "1.0.0")`,
    );
  }

  if (def.routes !== undefined) {
    if (!Array.isArray(def.routes)) {
      throw new ApiError(400, 'Plugin routes must be an array if provided');
    }

    for (const [index, route] of def.routes.entries()) {
      if (!route || typeof route !== 'object') {
        throw new ApiError(400, `Route at index ${index} must be an object`);
      }

      if (
        !route.path ||
        typeof route.path !== 'string' ||
        !route.path.startsWith('/')
      ) {
        throw new ApiError(
          400,
          `Route at index ${index} must have a path starting with "/" (e.g. "/analyze")`,
        );
      }

      if (
        !route.method ||
        !VALID_HTTP_METHODS.has(route.method.toLowerCase())
      ) {
        throw new ApiError(
          400,
          `Route at index ${index} has invalid HTTP method "${String(route.method)}"`,
        );
      }

      if (typeof route.handler !== 'function') {
        throw new ApiError(
          400,
          `Route at index ${index} handler must be a function`,
        );
      }

      if (route.middlewares !== undefined) {
        if (!Array.isArray(route.middlewares)) {
          throw new ApiError(
            400,
            `Route at index ${index} middlewares must be an array`,
          );
        }
        for (const [mIdx, mw] of route.middlewares.entries()) {
          if (typeof mw !== 'function') {
            throw new ApiError(
              400,
              `Route at index ${index} middleware at index ${mIdx} must be a function`,
            );
          }
        }
      }
    }
  }

  if (def.hooks !== undefined) {
    if (!def.hooks || typeof def.hooks !== 'object') {
      throw new ApiError(400, 'Plugin hooks must be an object if provided');
    }

    for (const [hookName, handler] of Object.entries(def.hooks)) {
      if (!VALID_HOOK_NAMES.has(hookName)) {
        throw new ApiError(400, `Unknown plugin hook event "${hookName}"`);
      }
      if (typeof handler !== 'function') {
        throw new ApiError(
          400,
          `Plugin hook handler for "${hookName}" must be a function`,
        );
      }
    }
  }

  return def as PluginDefinition;
}
