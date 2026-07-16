import type { LexicalNode } from '@/types/lexical';

export function extractLexicalText(
  node: LexicalNode | null | undefined,
): string {
  if (!node) return '';

  if (node.type === 'text') {
    return node.text || '';
  }

  if (node.type === 'paragraph' || node.type === 'heading') {
    if (Array.isArray(node.children)) {
      return node.children.map(extractLexicalText).join('') + '\n\n';
    }
    return '\n\n';
  }

  if (node.type === 'linebreak') {
    return '\n';
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractLexicalText).join('');
  }

  return '';
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    if (value.startsWith('{"root":')) {
      try {
        const parsed = JSON.parse(value);
        return extractLexicalText(parsed.root).trim();
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === 'object') {
    if (value !== null && 'root' in value) {
      return extractLexicalText((value as { root: LexicalNode }).root).trim();
    }
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
