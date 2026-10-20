import { DEFAULT_ENTRY_FALLBACK_IMAGE } from '../constants/collections.constants';
import { getOptimizedImageUrl } from '@/utils/imageUrl';

// Traverses an object using dot notation (e.g. 'body.specs.battery') to resolve nested property values.
function getNestedValue(
  obj: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// Strips HTML tags from text strings to create clean plain-text excerpts.
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
}

// Normalizes an entry's root fields, body payload, and custom schemas into a unified hydration dictionary.
function extractEntryContext(
  entry: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!entry) return {};
  const entryData: Record<string, unknown> =
    (entry.data as Record<string, unknown>) || entry || {};
  const body = (entryData.body as Record<string, unknown>) || {};

  // Extract custom schema values first so they are available for all standard tokens
  const schemaValuesMap: Record<string, unknown> = {};
  if (Array.isArray(entryData._schemas)) {
    for (const s of entryData._schemas as Array<{
      slug?: string;
      values?: Record<string, unknown>;
    }>) {
      if (s && s.values && typeof s.values === 'object') {
        const prefix = s.slug ? `${s.slug}.` : '';
        for (const [k, v] of Object.entries(s.values)) {
          if (v !== undefined && v !== null) {
            schemaValuesMap[k] = v;
            if (prefix) {
              schemaValuesMap[`${prefix}${k}`] = v;
            }
          }
        }
        if (s.slug) {
          schemaValuesMap[s.slug] = s.values;
        }
      }
    }
  }

  const title = (entryData.title ||
    entryData.name ||
    schemaValuesMap.title ||
    'Untitled Post') as string;
  const rawSlug = (entryData.slug ||
    entryData.name ||
    schemaValuesMap.slug ||
    (entry.id ? String(entry.id) : '')) as string;
  const slug = rawSlug.replace(/^\/+/, '');
  const author = (entryData.author ||
    schemaValuesMap.author ||
    schemaValuesMap.writer ||
    body.author ||
    (entry.updatedBy
      ? String(entry.updatedBy).split('@')[0]
      : 'Author')) as string;

  const rawDate =
    entry.createdAt ||
    entryData.createdAt ||
    schemaValuesMap.date ||
    new Date().toISOString();
  let dateFormatted = 'Recent';
  try {
    dateFormatted = new Date(rawDate as string).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    // Retain default formatted date if date parsing throws
  }

  const rawImage =
    entryData.image ||
    entryData.coverImage ||
    entryData.cover_image ||
    schemaValuesMap.image ||
    schemaValuesMap.coverImage ||
    schemaValuesMap.cover_image ||
    schemaValuesMap.thumbnail ||
    body.image ||
    body.coverImage ||
    (Array.isArray(body.images) ? body.images[0] : undefined);
  const image =
    typeof rawImage === 'string' && rawImage.trim()
      ? rawImage
      : DEFAULT_ENTRY_FALLBACK_IMAGE;

  let bodyContent = '';
  if (typeof schemaValuesMap.body === 'string' && schemaValuesMap.body) {
    bodyContent = schemaValuesMap.body;
  } else if (
    typeof schemaValuesMap.content === 'string' &&
    schemaValuesMap.content
  ) {
    bodyContent = schemaValuesMap.content;
  } else if (
    typeof schemaValuesMap.article_body === 'string' &&
    schemaValuesMap.article_body
  ) {
    bodyContent = schemaValuesMap.article_body;
  } else if (typeof body.html === 'string' && body.html) {
    bodyContent = body.html;
  } else if (typeof entryData.body_html === 'string' && entryData.body_html) {
    bodyContent = entryData.body_html;
  } else if (typeof body.markdown === 'string' && body.markdown) {
    bodyContent = `<div style="white-space: pre-wrap;">${body.markdown}</div>`;
  } else if (
    typeof entryData.description === 'string' &&
    entryData.description
  ) {
    bodyContent = `<p>${entryData.description}</p>`;
  } else if (typeof entryData.body === 'string') {
    bodyContent = entryData.body;
  } else {
    bodyContent = `<p>Dynamic content for ${title}.</p>`;
  }

  const excerpt =
    typeof schemaValuesMap.excerpt === 'string' && schemaValuesMap.excerpt
      ? schemaValuesMap.excerpt
      : typeof schemaValuesMap.summary === 'string' && schemaValuesMap.summary
        ? schemaValuesMap.summary
        : typeof entryData.excerpt === 'string' && entryData.excerpt
          ? entryData.excerpt
          : typeof body.excerpt === 'string' && body.excerpt
            ? body.excerpt
            : typeof entryData.description === 'string' && entryData.description
              ? entryData.description
              : stripHtml(bodyContent).slice(0, 140) + '...';

  const price =
    body.price !== undefined
      ? String(body.price)
      : entryData.price !== undefined
        ? String(entryData.price)
        : '';

  return {
    id: entry.id || '',
    title,
    name: title,
    slug,
    author,
    date: dateFormatted,
    image,
    excerpt,
    price,
    ...entryData,
    ...schemaValuesMap,
    ...body,
    html: bodyContent,
    content: bodyContent,
    rawBody: body,
    body:
      typeof entryData.body === 'object' && entryData.body !== null
        ? entryData.body
        : bodyContent,
  };
}

export function hydrateHtmlTemplate(
  rawHtml: string,
  entry?: Record<string, unknown> | null,
  allEntries: Array<Record<string, unknown>> = [],
): string {
  if (!rawHtml) return '';

  let processedHtml = rawHtml;

  // 1. Process Repeating Feeds & Grids ([data-cms-repeat="true"], [data-cms-collection], .cms-dynamic-feed)
  if (allEntries.length > 0) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedHtml, 'text/html');

      const repeatContainers = doc.querySelectorAll(
        '[data-cms-repeat="true"], [data-cms-collection], .cms-dynamic-feed',
      );

      repeatContainers.forEach((container) => {
        const itemTemplate = container.firstElementChild;
        if (itemTemplate) {
          const itemHtml = itemTemplate.outerHTML;
          container.innerHTML = '';

          allEntries.forEach((colEntry) => {
            const singleHydrated = hydrateHtmlTemplate(itemHtml, colEntry, []);
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = singleHydrated;
            const childEl = tempDiv.firstElementChild;
            if (childEl && colEntry.id) {
              childEl.setAttribute('data-entry-id', String(colEntry.id));
              container.appendChild(childEl);
            } else {
              container.insertAdjacentHTML('beforeend', singleHydrated);
            }
          });
        }
      });

      // 2. Process In-Page Dropdown Selectors (<select data-cms-dropdown>, [data-cms-selector])
      const dropdownSelectors = doc.querySelectorAll(
        'select[data-cms-dropdown], [data-cms-selector]',
      );
      dropdownSelectors.forEach((sel) => {
        const selectEl = sel as HTMLSelectElement;
        const currentSelectedId = entry?.id;
        selectEl.innerHTML = '';

        allEntries.forEach((colEntry) => {
          const ctx = extractEntryContext(colEntry);
          const opt = doc.createElement('option');
          opt.value = String(ctx.id);
          opt.textContent = String(ctx.title);
          if (
            currentSelectedId &&
            String(ctx.id) === String(currentSelectedId)
          ) {
            opt.selected = true;
            opt.setAttribute('selected', 'selected');
          }
          selectEl.appendChild(opt);
        });
      });

      processedHtml = doc.body.innerHTML;
    } catch {
      // Retain currently processed markup if DOMParser encounters malformed HTML
    }
  }

  // 3. Process Single Entry Tokens & [data-cms-slot]
  const targetEntry = entry || (allEntries.length > 0 ? allEntries[0] : null);
  if (targetEntry) {
    const contextData = extractEntryContext(targetEntry);

    // Replace {{ token }}
    processedHtml = processedHtml.replace(
      /{{\s*([\w.-]+)\s*}}/g,
      (match, key: string) => {
        if (contextData[key] !== undefined && contextData[key] !== null) {
          const val = contextData[key];
          return typeof val === 'object' ? JSON.stringify(val) : String(val);
        }

        const nestedVal = getNestedValue(contextData, key);
        if (nestedVal !== undefined && nestedVal !== null) {
          return typeof nestedVal === 'object'
            ? JSON.stringify(nestedVal)
            : String(nestedVal);
        }

        return match;
      },
    );

    // Replace [data-cms-slot] attributes
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(processedHtml, 'text/html');
      const slotElements = doc.querySelectorAll(
        '[data-cms-slot], [data-cms-field]',
      );

      slotElements.forEach((el) => {
        const slotKey =
          el.getAttribute('data-cms-slot') || el.getAttribute('data-cms-field');
        if (!slotKey) return;

        let slotVal = contextData[slotKey];
        if (slotVal === undefined) {
          slotVal = getNestedValue(contextData, slotKey);
        }

        if (slotVal !== undefined && slotVal !== null) {
          const tag = el.tagName.toLowerCase();
          if (tag === 'img') {
            el.setAttribute('src', String(slotVal));
          } else if (tag === 'a') {
            el.setAttribute('href', String(slotVal));
          } else if (slotKey === 'image' || slotKey === 'coverImage') {
            const childImg = el.querySelector('img');
            const optimizedSrc = getOptimizedImageUrl(String(slotVal), {
              width: 1200,
              format: 'webp',
              quality: 80,
            });
            if (childImg) {
              childImg.setAttribute('src', optimizedSrc);
              childImg.setAttribute('loading', 'lazy');
              childImg.setAttribute('decoding', 'async');
            } else {
              el.innerHTML = `<img src="${optimizedSrc}" loading="lazy" decoding="async" alt="" style="width:100%;height:100%;object-fit:cover;" />`;
            }
          } else {
            let displayVal = slotVal;
            if (typeof slotVal === 'object' && slotVal !== null) {
              const obj = slotVal as Record<string, unknown>;
              if (typeof obj.html === 'string') displayVal = obj.html;
              else if (typeof obj.markdown === 'string')
                displayVal = `<div style="white-space: pre-wrap;">${obj.markdown}</div>`;
              else displayVal = JSON.stringify(slotVal);
            }
            el.innerHTML = String(displayVal);
          }
        }
      });

      // Also ensure [data-entry-id] is stamped on active single post readers
      const readerContainer = doc.querySelector(
        '.cms-active-post-container, .cms-post-reader',
      );
      if (readerContainer && contextData.id) {
        readerContainer.setAttribute('data-entry-id', String(contextData.id));
      }

      processedHtml = doc.body.innerHTML;
    } catch {
      // Retain currently processed HTML if slot element binding encounters a parsing error
    }
  }

  return processedHtml;
}
