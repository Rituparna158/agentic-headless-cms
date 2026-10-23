import { describe, it, expect } from 'vitest';
import { convertHtmlToMarkdown } from '@/utils/covertHtmlToMarkdown';

describe('convertHtmlToMarkdown', () => {
  it('returns empty string for falsy input', () => {
    expect(convertHtmlToMarkdown('')).toBe('');
    expect(convertHtmlToMarkdown(null as unknown as string)).toBe('');
  });

  it('converts headings h1 to h4', () => {
    expect(convertHtmlToMarkdown('<h1>Title</h1>')).toBe('# Title');
    expect(convertHtmlToMarkdown('<h2>Subtitle</h2>')).toBe('## Subtitle');
    expect(convertHtmlToMarkdown('<h3>Section</h3>')).toBe('### Section');
    expect(convertHtmlToMarkdown('<h4>Sub-section</h4>')).toBe(
      '#### Sub-section',
    );
  });

  it('converts paragraphs and typography formatting', () => {
    expect(convertHtmlToMarkdown('<p>Simple paragraph</p>')).toBe(
      'Simple paragraph',
    );
    expect(convertHtmlToMarkdown('<strong>Bold</strong>')).toBe('**Bold**');
    expect(convertHtmlToMarkdown('<b>Bold B</b>')).toBe('**Bold B**');
    expect(convertHtmlToMarkdown('<em>Italic</em>')).toBe('*Italic*');
    expect(convertHtmlToMarkdown('<i>Italic I</i>')).toBe('*Italic I*');
    expect(convertHtmlToMarkdown('<s>Strikethrough</s>')).toBe(
      '~~Strikethrough~~',
    );
    expect(convertHtmlToMarkdown('<del>Deleted</del>')).toBe('~~Deleted~~');
    expect(convertHtmlToMarkdown('<strike>Strike</strike>')).toBe('~~Strike~~');
  });

  it('converts inline code and preformatted code blocks', () => {
    expect(convertHtmlToMarkdown('<code>const x = 1;</code>')).toBe(
      '`const x = 1;`',
    );
    expect(convertHtmlToMarkdown('<pre><code>const y = 2;</code></pre>')).toBe(
      '```\nconst y = 2;\n```',
    );
  });

  it('converts blockquotes', () => {
    expect(convertHtmlToMarkdown('<blockquote>Quote here</blockquote>')).toBe(
      '> Quote here',
    );
    expect(
      convertHtmlToMarkdown('<blockquote>Line 1\nLine 2</blockquote>'),
    ).toBe('> Line 1\n> Line 2');
  });

  it('converts unordered and ordered lists', () => {
    const ulHtml = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const olHtml = '<ol><li>First</li><li>Second</li></ol>';

    expect(convertHtmlToMarkdown(ulHtml)).toContain('- Item 1');
    expect(convertHtmlToMarkdown(ulHtml)).toContain('- Item 2');
    expect(convertHtmlToMarkdown(olHtml)).toContain('1. First');
    expect(convertHtmlToMarkdown(olHtml)).toContain('1. Second');
  });

  it('converts links and images', () => {
    expect(
      convertHtmlToMarkdown('<a href="https://example.com">Example</a>'),
    ).toBe('[Example](https://example.com)');
    expect(convertHtmlToMarkdown('<a>No href link</a>')).toBe(
      '[No href link](#)',
    );

    expect(
      convertHtmlToMarkdown(
        '<img src="https://example.com/pic.png" alt="Pic" />',
      ),
    ).toBe('![Pic](https://example.com/pic.png)');
    expect(convertHtmlToMarkdown('<img />')).toBe('![image]()');
  });

  it('handles hr and line breaks', () => {
    expect(convertHtmlToMarkdown('<hr />')).toBe('---');
    expect(convertHtmlToMarkdown('<span>Hello<br/>World</span>')).toBe(
      'Hello\nWorld',
    );
  });
});
