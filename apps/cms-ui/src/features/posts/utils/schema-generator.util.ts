import DOMPurify from 'dompurify';
import {
  DynamicFieldDefinition,
  ImportValidationIssue,
} from '../types/posts.types';

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}

export function generateSampleJsonFromSchema(
  fields: DynamicFieldDefinition[],
): Record<string, unknown> {
  const sample: Record<string, unknown> = {};

  for (const field of fields) {
    switch (field.dataType) {
      case 'text':
        if (field.apiId === 'title') {
          sample[field.apiId] = 'Sample Dynamic Item Title';
        } else if (field.apiId === 'slug') {
          sample[field.apiId] = 'sample-dynamic-item';
        } else if (field.apiId === 'sku') {
          sample[field.apiId] = 'SKU-99201';
        } else {
          sample[field.apiId] = `Sample ${field.displayName}`;
        }
        break;
      case 'number':
        if (field.apiId === 'price') {
          sample[field.apiId] = 49.99;
        } else if (field.apiId === 'rating') {
          sample[field.apiId] = 4.8;
        } else {
          sample[field.apiId] = 10;
        }
        break;
      case 'boolean':
        sample[field.apiId] = true;
        break;
      case 'datetime':
      case 'date':
        sample[field.apiId] = new Date().toISOString();
        break;
      case 'richtext':
        sample[field.apiId] =
          `<h2>${field.displayName} Overview</h2><p>This is formatted content with support for HTML and Markdown.</p>`;
        break;
      case 'enum': {
        const options = field.config?.options;
        sample[field.apiId] =
          Array.isArray(options) && options.length > 0 ? options[0] : 'default';
        break;
      }
      case 'json':
        sample[field.apiId] = {
          specs: { featureA: 'Enabled', capacity: '128GB' },
        };
        break;
      case 'url':
        sample[field.apiId] = 'https://example.com/reference';
        break;
      default:
        sample[field.apiId] = `Value for ${field.apiId}`;
    }
  }

  // Ensure unified title, slug, and body {} structure
  if (!sample.title) sample.title = 'Sample Dynamic Item';
  if (!sample.slug) sample.slug = 'sample-dynamic-item';
  if (!sample.body) {
    sample.body = {
      price: 299.99,
      currency: 'USD',
      description: 'High performance dynamic specifications and rich content.',
      specs: { ram: '16GB', storage: '512GB', color: 'Midnight' },
      badges: ['In Stock', 'Featured'],
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      ],
    };
  }

  return sample;
}

export function validateEntryAgainstSchema(
  entryData: Record<string, unknown>,
  fields: DynamicFieldDefinition[],
  entryIndex?: number,
): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];

  const bodyRecord =
    typeof entryData.body === 'object' && entryData.body !== null
      ? (entryData.body as Record<string, unknown>)
      : {};

  for (const field of fields) {
    const val =
      entryData[field.apiId] !== undefined
        ? entryData[field.apiId]
        : bodyRecord[field.apiId];

    if (field.isRequired && (val === undefined || val === null || val === '')) {
      issues.push({
        entryIndex,
        field: field.apiId,
        message: `Field "${field.displayName}" (${field.apiId}) is required.`,
        severity: 'error',
      });
      continue;
    }

    if (val !== undefined && val !== null && val !== '') {
      if (field.dataType === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          issues.push({
            entryIndex,
            field: field.apiId,
            message: `Field "${field.displayName}" must be a valid number.`,
            severity: 'error',
          });
        }
      } else if (field.dataType === 'boolean') {
        if (typeof val !== 'boolean') {
          issues.push({
            entryIndex,
            field: field.apiId,
            message: `Field "${field.displayName}" must be true or false.`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return issues;
}
