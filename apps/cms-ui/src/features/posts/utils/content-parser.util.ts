import { sanitizeHtml } from './schema-generator.util';
import {
  DynamicFieldDefinition,
  ImportResult,
  ImportValidationIssue,
} from '../types/posts.types';
import { validateEntryAgainstSchema } from './schema-generator.util';

export function parseMarkdownFileContent(rawText: string): {
  metadata: Record<string, unknown>;
  content: string;
} {
  const metadata: Record<string, unknown> = {};
  let content = rawText;

  // Simple YAML Frontmatter parser (--- ... ---)
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = frontmatterRegex.exec(rawText);

  if (match && match[1] && match[2] !== undefined) {
    const rawYaml = match[1];
    content = match[2].trim();

    const lines = rawYaml.split(/\r?\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let value: unknown = line.slice(colonIdx + 1).trim();

        // Strip surrounding quotes
        if (
          typeof value === 'string' &&
          ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'")))
        ) {
          value = value.slice(1, -1);
        }

        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);

        metadata[key] = value;
      }
    }
  }

  // Fallback: If no title was in frontmatter, extract first heading
  if (!metadata.title) {
    const headingMatch = /^#\s+(.+)$/m.exec(content);
    if (headingMatch && headingMatch[1]) {
      metadata.title = headingMatch[1].trim();
    }
  }

  return { metadata, content };
}

export function parseHtmlFileContent(rawHtml: string): {
  metadata: Record<string, unknown>;
  content: string;
} {
  const metadata: Record<string, unknown> = {};

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Extract title
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) {
      metadata.title = titleEl.textContent.trim();
    } else {
      const h1 = doc.querySelector('h1');
      if (h1 && h1.textContent) {
        metadata.title = h1.textContent.trim();
      }
    }

    // Extract meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
      metadata.excerpt = metaDesc.getAttribute('content') || '';
    }

    // Extract body inner HTML and sanitize
    const bodyEl = doc.body;
    const bodyHtml = bodyEl ? bodyEl.innerHTML : rawHtml;
    const sanitizedBody = sanitizeHtml(bodyHtml);

    return { metadata, content: sanitizedBody };
  } catch {
    return {
      metadata: {},
      content: sanitizeHtml(rawHtml),
    };
  }
}

export function parseUploadedFileContent(
  filename: string,
  rawContent: string,
  schemaFields: DynamicFieldDefinition[],
): ImportResult {
  const issues: ImportValidationIssue[] = [];
  const validEntries: Array<Record<string, unknown>> = [];
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.json')) {
    try {
      const parsed = JSON.parse(rawContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      items.forEach((item, idx) => {
        if (typeof item !== 'object' || item === null) {
          issues.push({
            entryIndex: idx,
            message: `Entry at index ${idx} is not an object.`,
            severity: 'error',
          });
          return;
        }

        const itemRecord = item as Record<string, unknown>;
        const title = (itemRecord.title ||
          itemRecord.name ||
          `Entry ${idx + 1}`) as string;
        const slug = (itemRecord.slug ||
          itemRecord.name ||
          title
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')) as string;

        let bodyObj: Record<string, unknown> = {};
        if (
          typeof itemRecord.body === 'object' &&
          itemRecord.body !== null &&
          !Array.isArray(itemRecord.body)
        ) {
          bodyObj = { ...(itemRecord.body as Record<string, unknown>) };
        } else if (itemRecord.body !== undefined) {
          bodyObj = { content: itemRecord.body };
        }

        for (const [key, val] of Object.entries(itemRecord)) {
          if (key !== 'title' && key !== 'slug' && key !== 'body') {
            bodyObj[key] = val;
          }
        }

        const formattedEntry: Record<string, unknown> = {
          ...itemRecord,
          title,
          slug,
          body: bodyObj,
          body_html:
            typeof bodyObj.html === 'string'
              ? bodyObj.html
              : typeof bodyObj.description === 'string'
                ? bodyObj.description
                : undefined,
        };

        const entryIssues = validateEntryAgainstSchema(
          formattedEntry,
          schemaFields,
          idx,
        );
        issues.push(...entryIssues);

        const hasErrors = entryIssues.some((i) => i.severity === 'error');
        if (!hasErrors) {
          validEntries.push(formattedEntry);
        }
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid JSON file';
      issues.push({
        message: `JSON Syntax Error: ${errMsg}`,
        severity: 'error',
      });
    }
  } else if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
    const { metadata, content } = parseMarkdownFileContent(rawContent);

    const title = (metadata.title ||
      filename.replace(/\.[^/.]+$/, '')) as string;
    const slug = (metadata.slug ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) as string;
    const bodyObj: Record<string, unknown> = {
      ...metadata,
      content,
      format: 'markdown',
      html: sanitizeHtml(content),
    };

    const entry: Record<string, unknown> = {
      title,
      slug,
      body: bodyObj,
      body_html: bodyObj.html,
    };

    const entryIssues = validateEntryAgainstSchema(entry, schemaFields, 0);
    issues.push(...entryIssues);

    if (!entryIssues.some((i) => i.severity === 'error')) {
      validEntries.push(entry);
    }
  } else if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
    const { metadata, content } = parseHtmlFileContent(rawContent);

    const title = (metadata.title ||
      filename.replace(/\.[^/.]+$/, '')) as string;
    const slug = (metadata.slug ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-')) as string;
    const bodyObj: Record<string, unknown> = {
      ...metadata,
      content,
      format: 'html',
      html: content,
    };

    const entry: Record<string, unknown> = {
      title,
      slug,
      body: bodyObj,
      body_html: content,
    };

    const entryIssues = validateEntryAgainstSchema(entry, schemaFields, 0);
    issues.push(...entryIssues);

    if (!entryIssues.some((i) => i.severity === 'error')) {
      validEntries.push(entry);
    }
  } else {
    issues.push({
      message: `Unsupported file extension for "${filename}". Please upload .json, .md, or .html`,
      severity: 'error',
    });
  }

  return {
    totalParsed:
      validEntries.length + issues.filter((i) => i.severity === 'error').length,
    validEntries,
    issues,
    successCount: validEntries.length,
    failedCount: issues.filter((i) => i.severity === 'error').length,
  };
}
