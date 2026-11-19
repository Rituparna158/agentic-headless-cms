import { marked } from 'marked';
import type { ImportedPost } from '../types/blog.types';

export type { ImportedPost };

const unquote = (v: string) => v.trim().replace(/^["']|["']$/g, '');

/**
 * Reads a Markdown file, with optional front matter (the `---` block at the
 * top used by Jekyll, Hugo, Astro…), into a post.
 */
export function parseMarkdownPost(source: string): ImportedPost {
  let body = source.replace(/^\uFEFF/, '');
  const meta: Record<string, string> = {};
  const fm = body.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (fm) {
    body = body.slice(fm[0].length);
    for (const line of fm[1]!.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (m) meta[m[1]!.toLowerCase()] = m[2]!;
    }
  }
  let title = meta.title ? unquote(meta.title) : undefined;
  // No front matter title: use the first heading
  const h1 = body.match(/^\s*#\s+(.+)$/m);
  if (!title && h1) {
    title = h1[1]!.trim();
    body = body.replace(h1[0], '');
  }
  const rawTags = meta.tags ?? meta.categories ?? '';
  const tags = rawTags
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => unquote(t))
    .filter(Boolean);
  return {
    title,
    slug: meta.slug ? unquote(meta.slug) : undefined,
    excerpt: meta.description
      ? unquote(meta.description)
      : meta.excerpt
        ? unquote(meta.excerpt)
        : undefined,
    author: meta.author ? unquote(meta.author) : undefined,
    date: meta.date ? unquote(meta.date).slice(0, 10) : undefined,
    tags,
    content: marked.parse(body.trim()) as string,
  };
}
