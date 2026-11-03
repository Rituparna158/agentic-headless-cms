import { describe, it, expect } from 'vitest';
import { extractLexicalText, formatFieldValue } from '@/utils/lexical';

describe('lexical utils', () => {
  describe('extractLexicalText', () => {
    it('returns empty string for null or undefined', () => {
      expect(extractLexicalText(null)).toBe('');
      expect(extractLexicalText(undefined)).toBe('');
    });

    it('returns text from a text node', () => {
      expect(extractLexicalText({ type: 'text', text: 'Hello' })).toBe('Hello');
      expect(extractLexicalText({ type: 'text' })).toBe('');
    });

    it('returns text with double newline from a paragraph or heading node', () => {
      expect(
        extractLexicalText({
          type: 'paragraph',
          children: [{ type: 'text', text: 'Paragraph text' }],
        }),
      ).toBe('Paragraph text\n\n');

      expect(
        extractLexicalText({
          type: 'heading',
          children: [{ type: 'text', text: 'Heading text' }],
        }),
      ).toBe('Heading text\n\n');
    });

    it('returns just double newline if paragraph/heading has no children array', () => {
      expect(extractLexicalText({ type: 'paragraph' })).toBe('\n\n');
    });

    it('returns a newline for linebreak node', () => {
      expect(extractLexicalText({ type: 'linebreak' })).toBe('\n');
    });

    it('processes generic children array', () => {
      expect(
        extractLexicalText({
          type: 'root',
          children: [
            { type: 'text', text: 'First' },
            { type: 'linebreak' },
            { type: 'text', text: 'Second' },
          ],
        }),
      ).toBe('First\nSecond');
    });

    it('returns empty string for unknown node without children', () => {
      expect(extractLexicalText({ type: 'unknown' })).toBe('');
    });
  });

  describe('formatFieldValue', () => {
    it('returns empty string for null or undefined', () => {
      expect(formatFieldValue(null)).toBe('');
      expect(formatFieldValue(undefined)).toBe('');
    });

    it('returns string as is if not a lexical root JSON', () => {
      expect(formatFieldValue('Hello world')).toBe('Hello world');
      expect(formatFieldValue('{"notRoot": true}')).toBe('{"notRoot": true}');
    });

    it('parses JSON string and extracts text if it starts with {"root":', () => {
      const lexicalJson = JSON.stringify({
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Parsed text' }],
            },
          ],
        },
      });
      expect(formatFieldValue(lexicalJson)).toBe('Parsed text');
    });

    it('returns original string if JSON parsing fails despite {"root": prefix', () => {
      const invalidJson = '{"root": invalid }';
      expect(formatFieldValue(invalidJson)).toBe(invalidJson);
    });

    it('extracts text from an object containing a root property', () => {
      const obj = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: 'Object text' }],
            },
          ],
        },
      };
      expect(formatFieldValue(obj)).toBe('Object text');
    });

    it('stringifies generic objects with 2-space indentation', () => {
      const obj = { foo: 'bar' };
      expect(formatFieldValue(obj)).toBe('{\n  "foo": "bar"\n}');
    });

    it('converts other types to string', () => {
      expect(formatFieldValue(123)).toBe('123');
      expect(formatFieldValue(true)).toBe('true');
    });
  });
});
