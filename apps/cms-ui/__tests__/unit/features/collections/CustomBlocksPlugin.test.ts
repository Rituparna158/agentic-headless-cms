import { describe, it, expect, vi } from 'vitest';
import {
  register_universal_cms_traits,
  type CustomBlocksPluginOptions,
} from '@/features/collections/components/grapesjs-plugins/CustomBlocksPlugin';

describe('CustomBlocksPlugin - register_universal_cms_traits & hydration', () => {
  it('hydrates canvas components with matching data-cms-slot and schemaValues on load', () => {
    const mockComponent = {
      attributes: {
        'data-cms-slot': 'question',
        'data-cms-schema': 'faq-section',
      },
      content: '{{question}}',
      getAttributes() {
        return this.attributes;
      },
      is(type: string) {
        return type === 'text';
      },
      get(key: string) {
        if (key === 'tagName') return 'h3';
        return undefined;
      },
      components(newVal: string) {
        this.content = newVal;
      },
      addAttributes(attrs: Record<string, unknown>) {
        Object.assign(this.attributes, attrs);
      },
    };

    const mockImageComponent = {
      attributes: {
        'data-cms-slot': 'cover_image',
        'data-cms-schema': 'hero-section',
        src: '',
      },
      src: '',
      getAttributes() {
        return this.attributes;
      },
      is(type: string) {
        return type === 'image';
      },
      get(key: string) {
        if (key === 'tagName') return 'img';
        return undefined;
      },
      addAttributes(attrs: Record<string, unknown>) {
        Object.assign(this.attributes, attrs);
        if (attrs.src) this.src = attrs.src as string;
      },
    };

    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    const mockEditor = {
      DomComponents: {
        getType: vi.fn().mockReturnValue(null),
        addType: vi.fn(),
      },
      getWrapper: () => ({
        find: (selector: string) => {
          if (selector.includes('data-cms-slot')) {
            return [mockComponent, mockImageComponent];
          }
          return [];
        },
      }),
      getSelected: vi.fn().mockReturnValue(null),
      on: (event: string, fn: (...args: unknown[]) => void) => {
        (listeners[event] ??= []).push(fn);
      },
      trigger: (event: string, ...args: unknown[]) => {
        for (const fn of listeners[event] || []) {
          fn(...args);
        }
      },
    };

    const opts: CustomBlocksPluginOptions = {
      schemaFields: [
        {
          id: 'question',
          name: 'Question',
          apiId: 'question',
          dataType: 'text',
        },
        {
          id: 'cover_image',
          name: 'Cover Image',
          apiId: 'cover_image',
          dataType: 'media',
        },
      ],
      availableSchemas: [
        {
          id: 'faq-section',
          name: 'FAQ',
          slug: 'faq-section',
          fields: [
            {
              id: 'question',
              name: 'Question',
              apiId: 'question',
              dataType: 'text',
            },
          ],
        },
      ],
      schemaValues: {
        question: 'What is your return policy?',
        'hero-section.cover_image': 'https://example.com/hero.jpg',
      },
    };

    // Calling register_universal_cms_traits should immediately trigger canvas-wide hydration
    register_universal_cms_traits(mockEditor as any, opts);

    expect(mockComponent.content).toBe('What is your return policy?');
    expect(mockImageComponent.attributes.src).toBe(
      'https://example.com/hero.jpg',
    );
  });

  it('updates component live when data-cms-slot attribute changes', () => {
    let slotValue = '';
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

    const mockTextComponent = {
      attributes: {
        'data-cms-slot': 'section_title',
        'data-cms-schema': 'faq-section',
      },
      getAttributes() {
        return this.attributes;
      },
      is(type: string) {
        return type === 'text';
      },
      get(key: string) {
        if (key === 'tagName') return 'h1';
        return undefined;
      },
      components(newVal: string) {
        slotValue = newVal;
      },
      addAttributes(attrs: Record<string, unknown>) {
        Object.assign(this.attributes, attrs);
      },
    };

    const mockEditor = {
      DomComponents: {
        getType: vi.fn().mockReturnValue(null),
        addType: vi.fn(),
      },
      getWrapper: () => ({
        find: () => [],
      }),
      getSelected: vi.fn().mockReturnValue(null),
      on: (event: string, fn: (...args: unknown[]) => void) => {
        (listeners[event] ??= []).push(fn);
      },
      trigger: (event: string, ...args: unknown[]) => {
        for (const fn of listeners[event] || []) {
          fn(...args);
        }
      },
    };

    const opts: CustomBlocksPluginOptions = {
      schemaValues: {
        'faq-section.section_title': 'Support & Returns FAQ',
      },
    };

    register_universal_cms_traits(mockEditor as any, opts);

    // Trigger attribute update event
    mockEditor.trigger(
      'component:update:attributes:data-cms-slot',
      mockTextComponent,
    );
    expect(slotValue).toBe('Support & Returns FAQ');
  });
});
