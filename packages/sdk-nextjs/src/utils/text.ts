/** Extracts plain text from a Lexical JSON blob or an HTML string. */
export function toPlainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    const parsed = JSON.parse(value) as { root?: { children?: unknown[] } };
    if (parsed.root) {
      const texts: string[] = [];
      function walk(node: unknown): void {
        if (!node || typeof node !== 'object') return;
        const n = node as Record<string, unknown>;
        if (typeof n['text'] === 'string' && n['text']) texts.push(n['text']);
        if (Array.isArray(n['children'])) n['children'].forEach(walk);
      }
      walk(parsed.root);
      return texts.join(' ').trim();
    }
  } catch {
    /* fall through to HTML strip */
  }
  return value.replace(/<[^>]+>/g, '').trim();
}
