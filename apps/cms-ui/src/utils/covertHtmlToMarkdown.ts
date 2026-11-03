// Simple and robust HTML to Markdown converter

export function convertHtmlToMarkdown(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(traverse).join('');

    switch (tag) {
      case 'h1':
        return `\n\n# ${childrenText.trim()}\n\n`;
      case 'h2':
        return `\n\n## ${childrenText.trim()}\n\n`;
      case 'h3':
        return `\n\n### ${childrenText.trim()}\n\n`;
      case 'h4':
        return `\n\n#### ${childrenText.trim()}\n\n`;
      case 'p':
        return `\n\n${childrenText.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `*${childrenText}*`;
      case 's':
      case 'del':
      case 'strike':
        return `~~${childrenText}~~`;
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          return childrenText;
        }
        return `\`${childrenText}\``;
      case 'pre':
        return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
      case 'blockquote':
        return `\n\n> ${childrenText.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'ul':
        return `\n\n${childrenText.trim()}\n\n`;
      case 'ol':
        return `\n\n${childrenText.trim()}\n\n`;
      case 'li': {
        const isOrdered = el.parentElement?.tagName.toLowerCase() === 'ol';
        return `\n${isOrdered ? '1.' : '-'} ${childrenText.trim()}`;
      }
      case 'hr':
        return `\n\n---\n\n`;
      case 'a': {
        const href = el.getAttribute('href') || '#';
        return `[${childrenText}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'image';
        return `![${alt}](${src})`;
      }
      case 'br':
        return '\n';
      default:
        return childrenText;
    }
  }

  const result = Array.from(doc.body.childNodes)
    .map(traverse)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}
