import { describe, it, expect } from 'vitest';
import { validateAndParseDynamicTemplate } from '../../../../src/features/collections/utils/template-parser.util';
import { SAMPLE_DYNAMIC_TEMPLATE } from '../../../../src/features/collections/constants/template.constants';

describe('validateAndParseDynamicTemplate', () => {
  it('successfully validates and normalizes a dynamic components template', () => {
    const jsonStr = JSON.stringify(SAMPLE_DYNAMIC_TEMPLATE);
    const result = validateAndParseDynamicTemplate(jsonStr);

    expect(result.success).toBe(true);
    expect(result.isGrapesJsProjectData).toBe(true);
    expect(result.projectData).toBeDefined();
    expect(result.projectData?.pages).toBeDefined();
  });

  it('successfully validates native GrapesJS projectData with pages', () => {
    const nativeProjectData = {
      pages: [
        {
          id: 'page-1',
          component: {
            type: 'wrapper',
            components: [
              {
                tagName: 'section',
                classes: ['hero'],
                components: [
                  {
                    tagName: 'h1',
                    type: 'text',
                    content: 'Dynamic AI Generated Page',
                  },
                ],
              },
            ],
          },
        },
      ],
      styles: [{ selectors: ['.hero'], style: { padding: '20px' } }],
    };

    const result = validateAndParseDynamicTemplate(
      JSON.stringify(nativeProjectData),
    );
    expect(result.success).toBe(true);
    expect(result.isGrapesJsProjectData).toBe(true);
    expect(result.projectData).toEqual(nativeProjectData);
  });

  it('successfully validates raw HTML and CSS export', () => {
    const rawExport = {
      html: '<div class="banner"><h1>Welcome</h1></div>',
      css: '.banner { background: #000; }',
    };

    const result = validateAndParseDynamicTemplate(JSON.stringify(rawExport));
    expect(result.success).toBe(true);
    expect(result.isGrapesJsProjectData).toBe(false);
    expect(result.html).toBe(rawExport.html);
    expect(result.css).toBe(rawExport.css);
  });

  it('rejects invalid JSON syntax with friendly error message', () => {
    const malformedJson = '{ "name": "Broken", "components": [ ';
    const result = validateAndParseDynamicTemplate(malformedJson);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.path).toBe('JSON Syntax');
  });

  it('rejects templates missing components, pages, or html', () => {
    const emptyObj = JSON.stringify({ someKey: 'value' });
    const result = validateAndParseDynamicTemplate(emptyObj);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain(
      'Template must contain a "components" array, a "pages" array',
    );
  });

  it('detects invalid component node types in nested trees', () => {
    const invalidTree = {
      components: [
        {
          tagName: 12345, // Invalid tagName (should be string)
          content: 'Hello',
        },
      ],
    };

    const result = validateAndParseDynamicTemplate(JSON.stringify(invalidTree));
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.path.includes('tagName'))).toBe(true);
  });

  it('rejects forbidden script tags for anti-injection safety', () => {
    const maliciousTree = {
      components: [
        {
          tagName: 'script',
          content: 'alert("exploit")',
        },
      ],
    };

    const result = validateAndParseDynamicTemplate(
      JSON.stringify(maliciousTree),
    );
    expect(result.success).toBe(false);
    expect(
      result.errors?.some((e) => e.message.includes('Forbidden tag')),
    ).toBe(true);
  });

  it('rejects inline event handlers such as onerror and onclick', () => {
    const maliciousTree = {
      components: [
        {
          tagName: 'img',
          attributes: {
            src: 'invalid.jpg',
            onerror: 'alert(document.cookie)',
          },
        },
      ],
    };

    const result = validateAndParseDynamicTemplate(
      JSON.stringify(maliciousTree),
    );
    expect(result.success).toBe(false);
    expect(
      result.errors?.some((e) =>
        e.message.includes('Inline JavaScript event handler'),
      ),
    ).toBe(true);
  });

  it('rejects javascript: URL protocols in attributes', () => {
    const maliciousTree = {
      components: [
        {
          tagName: 'a',
          attributes: {
            href: 'javascript:void(0);alert(1)',
          },
          content: 'Click here',
        },
      ],
    };

    const result = validateAndParseDynamicTemplate(
      JSON.stringify(maliciousTree),
    );
    expect(result.success).toBe(false);
    expect(
      result.errors?.some((e) => e.message.includes('Disallowed URL scheme')),
    ).toBe(true);
  });

  it('sanitizes malicious script tags in raw HTML imports', () => {
    const rawMaliciousExport = {
      html: '<div class="card"><h1>Safe</h1><script>alert("hack")</script></div>',
      css: '.card { color: red; }',
    };

    const result = validateAndParseDynamicTemplate(
      JSON.stringify(rawMaliciousExport),
    );
    expect(result.success).toBe(true);
    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('<h1>Safe</h1>');
  });
});
