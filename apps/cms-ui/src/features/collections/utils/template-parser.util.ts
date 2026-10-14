import {
  TemplateValidationResult,
  TemplateValidationError,
  DynamicComponentNode,
} from '../types/template.types';
import {
  checkAndSanitizeComponentTree,
  sanitizeHtmlContent,
  sanitizeCssContent,
} from './template-sanitizer.util';

function validateComponentNode(
  node: unknown,
  path: string,
  errors: TemplateValidationError[],
): boolean {
  if (typeof node === 'string') {
    return true;
  }

  if (!node || typeof node !== 'object') {
    errors.push({
      path,
      message: 'Component must be an object or a text string.',
    });
    return false;
  }

  const comp = node as Record<string, unknown>;

  if (comp.tagName !== undefined && typeof comp.tagName !== 'string') {
    errors.push({
      path: `${path}.tagName`,
      message: 'Expected string for tagName (e.g. "div", "section", "h1").',
    });
  }

  if (comp.content !== undefined && typeof comp.content !== 'string') {
    errors.push({
      path: `${path}.content`,
      message: 'Expected string for component content.',
    });
  }

  if (
    comp.attributes !== undefined &&
    (typeof comp.attributes !== 'object' || comp.attributes === null)
  ) {
    errors.push({
      path: `${path}.attributes`,
      message: 'Expected key-value object for attributes.',
    });
  }

  if (
    comp.style !== undefined &&
    (typeof comp.style !== 'object' || comp.style === null)
  ) {
    errors.push({
      path: `${path}.style`,
      message: 'Expected key-value CSS style object.',
    });
  }

  if (comp.components !== undefined) {
    if (Array.isArray(comp.components)) {
      comp.components.forEach((child, index) => {
        validateComponentNode(child, `${path}.components[${index}]`, errors);
      });
    } else if (typeof comp.components !== 'string') {
      errors.push({
        path: `${path}.components`,
        message: 'Expected array of child components or inner HTML string.',
      });
    }
  }

  return errors.length === 0;
}

export function validateAndParseDynamicTemplate(
  jsonContent: string,
): TemplateValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Invalid JSON formatting';
    return {
      success: false,
      errors: [
        {
          path: 'JSON Syntax',
          message: `Syntax error: ${errorMsg}. Please ensure the file is valid JSON.`,
        },
      ],
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      errors: [
        {
          path: 'root',
          message: 'The uploaded file must be a JSON object.',
        },
      ],
    };
  }

  const raw = parsed as Record<string, unknown>;
  const errors: TemplateValidationError[] = [];

  // Format 1: Direct GrapesJS ProjectData with `pages`
  if (Array.isArray(raw.pages) && raw.pages.length > 0) {
    const sanitizedPages: unknown[] = [];
    raw.pages.forEach((page, pIdx) => {
      if (typeof page !== 'object' || !page) {
        errors.push({
          path: `pages[${pIdx}]`,
          message: 'Page item must be an object.',
        });
        return;
      }
      const pageObj = { ...(page as Record<string, unknown>) };
      if (pageObj.component) {
        validateComponentNode(
          pageObj.component,
          `pages[${pIdx}].component`,
          errors,
        );
        const sanitizedComponent = checkAndSanitizeComponentTree(
          pageObj.component,
          `pages[${pIdx}].component`,
          errors,
        );
        if (sanitizedComponent) {
          pageObj.component = sanitizedComponent;
        }
      }
      sanitizedPages.push(pageObj);
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return {
      success: true,
      isGrapesJsProjectData: true,
      projectData: {
        ...raw,
        pages: sanitizedPages,
      },
    };
  }

  // Format 2: Dynamic components array
  if (Array.isArray(raw.components)) {
    const sanitizedComponents: DynamicComponentNode[] = [];
    raw.components.forEach((comp, idx) => {
      validateComponentNode(comp, `components[${idx}]`, errors);
      const sanitized = checkAndSanitizeComponentTree(
        comp,
        `components[${idx}]`,
        errors,
      );
      if (sanitized) {
        if (typeof sanitized === 'string') {
          sanitizedComponents.push({
            type: 'text',
            content: sanitized,
          });
        } else {
          sanitizedComponents.push(sanitized);
        }
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const projectData: Record<string, unknown> = {
      pages: [
        {
          component: {
            type: 'wrapper',
            components: sanitizedComponents,
          },
        },
      ],
      styles: Array.isArray(raw.styles) ? raw.styles : [],
      assets: Array.isArray(raw.assets) ? raw.assets : [],
    };

    return {
      success: true,
      isGrapesJsProjectData: true,
      projectData,
    };
  }

  // Format 3: Raw HTML and CSS export
  if (typeof raw.html === 'string' && raw.html.trim().length > 0) {
    const sanitizedHtml = sanitizeHtmlContent(raw.html);
    const sanitizedCss =
      typeof raw.css === 'string' ? sanitizeCssContent(raw.css) : '';
    return {
      success: true,
      isGrapesJsProjectData: false,
      html: sanitizedHtml,
      css: sanitizedCss,
    };
  }

  // If none matched, report clear error
  errors.push({
    path: 'root',
    message:
      'Template must contain a "components" array, a "pages" array (GrapesJS project data), or an "html" property.',
  });

  return {
    success: false,
    errors,
  };
}
