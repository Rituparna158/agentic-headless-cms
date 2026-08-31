import { describe, it, expect } from 'vitest';
import { definePlugin } from '../src/index.js';

describe('Plugin Definition', () => {
  it('should return the plugin configuration exactly as passed', () => {
    const config = {
      config: {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A mock plugin for definition testing',
        author: 'Developer',
      },
    };

    const plugin = definePlugin(config);

    expect(plugin).toEqual(config);
    expect(plugin.config.id).toBe('test-plugin');
    expect(plugin.config.name).toBe('Test Plugin');
    expect(plugin.config.version).toBe('1.0.0');
    expect(plugin.config.description).toBe(
      'A mock plugin for definition testing',
    );
    expect(plugin.config.author).toBe('Developer');
  });

  it('should allow optional fields in configuration to be omitted', () => {
    const config = {
      config: {
        id: 'minimal-plugin',
        name: 'Minimal Plugin',
        version: '0.1.0',
      },
    };

    const plugin = definePlugin(config);

    expect(plugin.config.description).toBeUndefined();
    expect(plugin.config.author).toBeUndefined();
  });
});
