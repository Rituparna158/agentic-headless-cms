/** Extracts plain text from a Lexical JSON blob, parsed Lexical object, or HTML string. */
export function toPlainText(value: unknown): string {
  if (value === null || value === undefined) return '';

  let parsed: { root?: unknown } | null = null;
  if (typeof value === 'object' && 'root' in value) {
    parsed = value as { root?: unknown };
  } else if (typeof value === 'string') {
    try {
      const candidate = JSON.parse(value) as unknown;
      if (candidate && typeof candidate === 'object' && 'root' in candidate) {
        parsed = candidate as { root?: unknown };
      }
    } catch {
      /* fall through to HTML strip */
    }
  } else {
    return '';
  }

  if (parsed?.root) {
    const texts: string[] = [];
    function walk(node: unknown): void {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (typeof n['text'] === 'string' && n['text']) {
        texts.push(n['text']);
      }
      if (Array.isArray(n['children'])) {
        n['children'].forEach(walk);
      }
    }
    walk(parsed.root);
    return texts.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (typeof value === 'string') {
    return value.replace(/<[^>]+>/g, '').trim();
  }

  return '';
}
