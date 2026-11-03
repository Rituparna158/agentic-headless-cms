import DOMPurify from 'dompurify';
import {
  DynamicComponentNode,
  TemplateValidationError,
} from '../types/template.types';

const FORBIDDEN_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
]);

const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/javascript',
];

export function sanitizeHtmlContent(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: Array.from(FORBIDDEN_TAGS),
    FORBID_ATTR: [
      'onerror',
      'onload',
      'onclick',
      'onmouseover',
      'onfocus',
      'onblur',
    ],
    ALLOW_DATA_ATTR: true,
  });
}

export function sanitizeCssContent(rawCss: string): string {
  if (!rawCss) return '';
  // Strip CSS expression / behavior exploits
  return rawCss
    .replace(/expression\s*\(.*?\)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/behavior\s*:/gi, '');
}

export function checkAndSanitizeComponentTree(
  node: unknown,
  path: string,
  errors: TemplateValidationError[],
): DynamicComponentNode | string | null {
  if (typeof node === 'string') {
    return sanitizeHtmlContent(node);
  }

  if (!node || typeof node !== 'object') {
    return null;
  }

  const comp = { ...(node as Record<string, unknown>) };

  // 1. Tag Name check
  if (comp.tagName && typeof comp.tagName === 'string') {
    const lowerTag = comp.tagName.toLowerCase().trim();
    if (FORBIDDEN_TAGS.has(lowerTag)) {
      errors.push({
        path: `${path}.tagName`,
        message: `Security violation: Forbidden tag <${comp.tagName}> is not allowed for security reasons.`,
      });
      return null;
    }
    comp.tagName = lowerTag;
  }

  // 2. Attribute checks & sanitization
  if (comp.attributes && typeof comp.attributes === 'object') {
    const sanitizedAttrs: Record<string, unknown> = {};
    for (const [attrKey, attrVal] of Object.entries(comp.attributes)) {
      const lowerKey = attrKey.toLowerCase().trim();

      // Check event handlers (onclick, onload, etc.)
      if (/^on[a-z]+/i.test(lowerKey)) {
        errors.push({
          path: `${path}.attributes.${attrKey}`,
          message: `Security violation: Inline JavaScript event handler "${attrKey}" is rejected.`,
        });
        continue;
      }

      // Check dangerous URL protocols
      if (typeof attrVal === 'string') {
        const lowerVal = attrVal.toLowerCase().trim();
        const hasDangerousProtocol = DANGEROUS_PROTOCOLS.some((proto) =>
          lowerVal.startsWith(proto),
        );
        if (hasDangerousProtocol) {
          errors.push({
            path: `${path}.attributes.${attrKey}`,
            message: `Security violation: Disallowed URL scheme "${attrVal}" is rejected.`,
          });
          continue;
        }
      }

      sanitizedAttrs[attrKey] = attrVal;
    }
    comp.attributes = sanitizedAttrs;
  }

  // 3. Content sanitization
  if (comp.content && typeof comp.content === 'string') {
    comp.content = sanitizeHtmlContent(comp.content);
  }

  // 4. Recursive child components sanitization
  if (comp.components) {
    if (Array.isArray(comp.components)) {
      const sanitizedChildren: DynamicComponentNode[] = [];
      comp.components.forEach((child, index) => {
        const sanitizedChild = checkAndSanitizeComponentTree(
          child,
          `${path}.components[${index}]`,
          errors,
        );
        if (sanitizedChild) {
          if (typeof sanitizedChild === 'string') {
            sanitizedChildren.push({
              type: 'text',
              content: sanitizedChild,
            });
          } else {
            sanitizedChildren.push(sanitizedChild);
          }
        }
      });
      comp.components = sanitizedChildren;
    } else if (typeof comp.components === 'string') {
      comp.components = sanitizeHtmlContent(comp.components);
    }
  }

  return comp as DynamicComponentNode;
}
