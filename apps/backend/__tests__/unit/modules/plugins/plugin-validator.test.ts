import { describe, it, expect } from 'vitest';
import { validatePluginDefinition } from '../../../../src/modules/plugins/plugin-validator.js';
import { ApiError } from '@repo/utils';
import type { HttpMethod, PluginRoute, PluginHooks } from '@repo/plugin-sdk';

describe('validatePluginDefinition', () => {
  it('should accept a valid plugin definition', () => {
    const validPlugin = {
      config: {
        id: 'seo-optimizer',
        name: 'SEO Optimizer',
        version: '1.0.0',
        description: 'Auto-calculates SEO score and meta titles',
      },
      hooks: {
        'content.beforeCreate': () => {},
        'content.afterCreate': () => {},
      },
      routes: [
        {
          path: '/analyze',
          method: 'post',
          handler: () => {},
        },
      ],
    };

    const validated = validatePluginDefinition(validPlugin);
    expect(validated.config.id).toBe('seo-optimizer');
    expect(validated.config.version).toBe('1.0.0');
  });

  it('should reject non-object plugin definitions', () => {
    expect(() => validatePluginDefinition(null)).toThrow(ApiError);
    expect(() => validatePluginDefinition('invalid')).toThrow(ApiError);
  });

  it('should reject missing or malformed config', () => {
    expect(() => validatePluginDefinition({})).toThrow(
      'Plugin configuration (config) is required',
    );
    expect(() =>
      validatePluginDefinition({
        config: { id: '', name: 'Test', version: '1.0.0' },
      }),
    ).toThrow('Plugin config.id must be a non-empty string');
  });

  it('should reject non-kebab-case plugin IDs', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'Invalid ID', name: 'Test', version: '1.0.0' },
      }),
    ).toThrow('Plugin id must be kebab-case');

    expect(() =>
      validatePluginDefinition({
        config: { id: 'UPPERCASE', name: 'Test', version: '1.0.0' },
      }),
    ).toThrow('Plugin id must be kebab-case');
  });

  it('should reject invalid SemVer versions', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: '1.0' },
      }),
    ).toThrow('Plugin version must follow SemVer format');

    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: 'alpha' },
      }),
    ).toThrow('Plugin version must follow SemVer format');
  });

  it('should reject routes without leading slash', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        routes: [
          {
            path: 'no-leading-slash',
            method: 'get',
            handler: () => {},
          },
        ],
      }),
    ).toThrow('Route at index 0 must have a path starting with "/"');
  });

  it('should reject invalid HTTP methods in routes', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        routes: [
          {
            path: '/test',
            method: 'INVALID' as unknown as HttpMethod,
            handler: () => {},
          },
        ],
      }),
    ).toThrow('Route at index 0 has invalid HTTP method');
  });

  it('should reject non-function route handlers', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        routes: [
          {
            path: '/test',
            method: 'get',
            handler: 'not-a-function' as unknown as PluginRoute['handler'],
          },
        ],
      }),
    ).toThrow('Route at index 0 handler must be a function');
  });

  it('should reject unknown hook event names', () => {
    expect(() =>
      validatePluginDefinition({
        config: { id: 'test-plugin', name: 'Test', version: '1.0.0' },
        hooks: {
          'invalid.hookName': () => {},
        } as unknown as PluginHooks,
      }),
    ).toThrow('Unknown plugin hook event "invalid.hookName"');
  });
});
