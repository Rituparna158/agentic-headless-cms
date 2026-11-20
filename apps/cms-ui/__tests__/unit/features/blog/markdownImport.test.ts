import { describe, it, expect } from 'vitest';
import { parseMarkdownPost } from '../../../../src/features/blog/utils/markdownImport';

describe('parseMarkdownPost', () => {
  it('reads front matter and converts the body', () => {
    const p = parseMarkdownPost(
      '---\ntitle: "Hello World"\ntags: [AI, Web]\ndate: 2026-03-01T10:00:00Z\ndescription: Short one\n---\n\n## Intro\n\nSome **bold** text.',
    );
    expect(p.title).toBe('Hello World');
    expect(p.tags).toEqual(['AI', 'Web']);
    expect(p.date).toBe('2026-03-01');
    expect(p.excerpt).toBe('Short one');
    expect(p.content).toContain('<h2>Intro</h2>');
    expect(p.content).toContain('<strong>bold</strong>');
  });
  it('uses the first heading as the title when there is no front matter', () => {
    const p = parseMarkdownPost('# My Post\n\nBody text');
    expect(p.title).toBe('My Post');
    expect(p.content).not.toContain('My Post');
  });
});
