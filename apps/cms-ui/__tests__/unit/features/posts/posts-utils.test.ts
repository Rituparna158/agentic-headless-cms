import { describe, it, expect } from 'vitest';
import {
  generateSampleJsonFromSchema,
  validateEntryAgainstSchema,
  sanitizeHtml,
} from '@/features/posts/utils/schema-generator.util';
import {
  parseMarkdownFileContent,
  parseHtmlFileContent,
  parseUploadedFileContent,
} from '@/features/posts/utils/content-parser.util';
import { DynamicFieldDefinition } from '@/features/posts/types/posts.types';
import { extractArrayPayload } from '@/features/posts/api/posts.api';

describe('Posts Utilities & Anti-Injection Sanitizer', () => {
  describe('extractArrayPayload helper', () => {
    it('returns empty array when given null or undefined', () => {
      expect(extractArrayPayload(null)).toEqual([]);
      expect(extractArrayPayload(undefined)).toEqual([]);
    });

    it('returns array directly when given an array', () => {
      const items = [{ id: '1', title: 'Post 1' }];
      expect(extractArrayPayload(items)).toEqual(items);
    });

    it('unwraps single-level { data: [...] } structure', () => {
      const items = [{ id: '1', title: 'Post 1' }];
      expect(extractArrayPayload({ data: items })).toEqual(items);
    });

    it('unwraps double-level { data: { data: [...] } } structure', () => {
      const items = [{ id: '1', title: 'Post 1' }];
      expect(extractArrayPayload({ data: { data: items } })).toEqual(items);
    });

    it('unwraps { items: [...] } or { entries: [...] } structures', () => {
      const items = [{ id: '1', title: 'Post 1' }];
      expect(extractArrayPayload({ items })).toEqual(items);
      expect(extractArrayPayload({ entries: items })).toEqual(items);
    });
  });
  const sampleFields: DynamicFieldDefinition[] = [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      isRequired: true,
      sortOrder: 0,
    },
    {
      apiId: 'price',
      displayName: 'Price',
      dataType: 'number',
      isRequired: true,
      sortOrder: 1,
    },
    {
      apiId: 'in_stock',
      displayName: 'In Stock',
      dataType: 'boolean',
      isRequired: false,
      sortOrder: 2,
    },
    {
      apiId: 'description_html',
      displayName: 'Description',
      dataType: 'richtext',
      isRequired: false,
      sortOrder: 3,
    },
  ];

  describe('schema-generator.util', () => {
    it('generates a matching sample JSON object from dynamic schema fields', () => {
      const sample = generateSampleJsonFromSchema(sampleFields);
      expect(sample).toHaveProperty('title');
      expect(sample).toHaveProperty('price');
      expect(sample.price).toBe(49.99);
      expect(sample.in_stock).toBe(true);
      expect(typeof sample.description_html).toBe('string');
    });

    it('validates required fields and reports missing values', () => {
      const invalidData = { price: 29.99 }; // missing title
      const issues = validateEntryAgainstSchema(invalidData, sampleFields);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i) => i.field === 'title')).toBe(true);
    });

    it('validates number data types', () => {
      const invalidData = { title: 'Test Item', price: 'not-a-number' };
      const issues = validateEntryAgainstSchema(invalidData, sampleFields);
      expect(issues.some((i) => i.field === 'price')).toBe(true);
    });

    it('sanitizes malicious HTML and blocks script tags and event handlers', () => {
      const exploit =
        '<div><h3>Safe Title</h3><script>alert("xss")</script><img src="x" onerror="stealCookies()" /></div>';
      const clean = sanitizeHtml(exploit);
      expect(clean).toContain('Safe Title');
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror');
    });
  });

  describe('content-parser.util', () => {
    it('parses markdown file content with YAML frontmatter', () => {
      const md = `---
title: "Modern Wireless Headphones"
price: 99.95
author: "AudioTeam"
---
# Modern Wireless Headphones
These headphones deliver **premium sound quality**.`;

      const result = parseMarkdownFileContent(md);
      expect(result.metadata.title).toBe('Modern Wireless Headphones');
      expect(result.metadata.price).toBe(99.95);
      expect(result.metadata.author).toBe('AudioTeam');
      expect(result.content).toContain('premium sound quality');
    });

    it('falls back to first markdown heading if title is not in frontmatter', () => {
      const md = `# Top Rated Espresso Machine\nCompact and powerful home brewing.`;
      const result = parseMarkdownFileContent(md);
      expect(result.metadata.title).toBe('Top Rated Espresso Machine');
      expect(result.content).toContain('Compact and powerful');
    });

    it('parses HTML file content and extracts title, meta, and sanitized body', () => {
      const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Luxury Penthouse Suite</title>
    <meta name="description" content="Panoramic city view apartment">
  </head>
  <body>
    <h1>Luxury Penthouse Suite</h1>
    <p>3 Bedroom penthouse located downtown.</p>
    <script>alert("exploit")</script>
  </body>
</html>`;

      const result = parseHtmlFileContent(html);
      expect(result.metadata.title).toBe('Luxury Penthouse Suite');
      expect(result.metadata.excerpt).toBe('Panoramic city view apartment');
      expect(result.content).toContain('3 Bedroom penthouse');
      expect(result.content).not.toContain('<script>');
    });

    it('parses valid JSON array file and populates valid entries', () => {
      const jsonContent = JSON.stringify([
        { title: 'Item 1', price: 19.99 },
        { title: 'Item 2', price: 39.99 },
      ]);

      const res = parseUploadedFileContent(
        'products.json',
        jsonContent,
        sampleFields,
      );
      expect(res.validEntries.length).toBe(2);
      expect(res.failedCount).toBe(0);
    });

    it('generates sample values for date, datetime, enum, json, and url field types', () => {
      const advancedFields: DynamicFieldDefinition[] = [
        {
          apiId: 'published_at',
          displayName: 'Published At',
          dataType: 'datetime',
          isRequired: false,
          sortOrder: 0,
        },
        {
          apiId: 'status',
          displayName: 'Status',
          dataType: 'enum',
          config: { options: ['draft', 'published'] },
          isRequired: false,
          sortOrder: 1,
        },
        {
          apiId: 'metadata',
          displayName: 'Metadata',
          dataType: 'json',
          isRequired: false,
          sortOrder: 2,
        },
        {
          apiId: 'website',
          displayName: 'Website',
          dataType: 'url',
          isRequired: false,
          sortOrder: 3,
        },
      ];

      const sample = generateSampleJsonFromSchema(advancedFields);
      expect(sample).toHaveProperty('published_at');
      expect(sample.status).toBe('draft');
      expect(sample.metadata).toEqual({
        specs: { featureA: 'Enabled', capacity: '128GB' },
      });
      expect(sample.website).toBe('https://example.com/reference');
    });

    it('warns on boolean type mismatch in validation', () => {
      const issues = validateEntryAgainstSchema(
        { in_stock: 'yes' },
        sampleFields,
      );
      expect(
        issues.some((i) => i.field === 'in_stock' && i.severity === 'warning'),
      ).toBe(true);
    });

    it('parses markdown file with parseUploadedFileContent', () => {
      const mdContent = `---
title: "Parsed Markdown Post"
price: 49.99
---
Markdown body text`;
      const res = parseUploadedFileContent('post.md', mdContent, sampleFields);
      expect(res.validEntries.length).toBe(1);
      expect(res.validEntries[0]?.title).toBe('Parsed Markdown Post');
      expect(res.successCount).toBe(1);
    });

    it('parses HTML file with h1 fallback and parseUploadedFileContent', () => {
      const htmlContent =
        '<div><h1>H1 Title Only</h1><p>Body copy here</p></div>';
      const res = parseUploadedFileContent('post.html', htmlContent, [
        {
          apiId: 'title',
          displayName: 'Title',
          dataType: 'text',
          isRequired: false,
          sortOrder: 0,
        },
      ]);
      expect(res.validEntries.length).toBe(1);
      expect(res.validEntries[0]?.title).toBe('H1 Title Only');
    });

    it('records issue when uploaded JSON is malformed syntax', () => {
      const res = parseUploadedFileContent(
        'broken.json',
        '{ bad json',
        sampleFields,
      );
      expect(res.issues.length).toBeGreaterThan(0);
      expect(res.issues[0]?.message).toContain('JSON Syntax Error');
    });

    it('records issue when JSON array contains non-object element', () => {
      const res = parseUploadedFileContent(
        'array.json',
        JSON.stringify([null, 123]),
        sampleFields,
      );
      expect(res.issues.length).toBe(2);
      expect(res.issues[0]?.message).toContain('not an object');
    });
  });
});
