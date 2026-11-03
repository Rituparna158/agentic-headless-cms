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
  allEntries?: Array<Record<string, unknown>>,
): Record<string, unknown> {
  if (!entry) return {};
  const entryData: Record<string, unknown> =
    (entry.data as Record<string, unknown>) || entry || {};
  const body = (entryData.body as Record<string, unknown>) || {};

  // Extract custom schema values first so they are available for all standard tokens
  const schemaValuesMap: Record<string, unknown> = {};
  let rawSchemas =
    Array.isArray(entryData._schemas) && entryData._schemas.length > 0
      ? (entryData._schemas as Array<{
          slug?: string;
          entryType?: string;
          items?: Array<Record<string, unknown>>;
          values?: Record<string, unknown>;
        }>)
      : [];

  // Fallback: If current entry has no schemas, inherit schema definitions/values from another page in the collection
  if (
    rawSchemas.length === 0 &&
    Array.isArray(allEntries) &&
    allEntries.length > 0
  ) {
    for (const other of allEntries) {
      if (other && other !== entry) {
        const otherData =
          (other.data as Record<string, unknown>) || other || {};
        if (
          Array.isArray(otherData._schemas) &&
          otherData._schemas.length > 0
        ) {
          rawSchemas = otherData._schemas as typeof rawSchemas;
          break;
        }
      }
    }
  }

  // Multi-item token maps (e.g. title_0, title_1)
  const multiItemsMap: Record<string, unknown> = {};

  if (Array.isArray(rawSchemas)) {
    for (const s of rawSchemas) {
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

      // If multi-entry schema, map indexed tokens and first item values
      if (
        s &&
        s.entryType === 'multi' &&
        Array.isArray(s.items) &&
        s.items.length > 0
      ) {
        const firstItem = s.items[0];
        if (firstItem) {
          for (const [k, v] of Object.entries(firstItem)) {
            if (
              schemaValuesMap[k] === undefined &&
              v !== undefined &&
              v !== null
            ) {
              schemaValuesMap[k] = v;
            }
          }
        }
        s.items.forEach((item, idx) => {
          for (const [k, v] of Object.entries(item)) {
            multiItemsMap[`${k}_${idx}`] = v;
            if (s.slug) {
              multiItemsMap[`${s.slug}_${k}_${idx}`] = v;
            }
          }
        });
      }
    }
  }

  const title = (schemaValuesMap.title ||
    entryData.title ||
    entryData.name ||
    'Untitled Post') as string;
  const rawSlug = (schemaValuesMap.slug ||
    entryData.slug ||
    entryData.name ||
    (entry.id ? String(entry.id) : '')) as string;
  const slug = rawSlug.replace(/^\/+/, '');
  const author = (schemaValuesMap.author ||
    schemaValuesMap.writer ||
    entryData.author ||
    body.author ||
    (entry.updatedBy
      ? String(entry.updatedBy).split('@')[0]
      : 'Author')) as string;

  const rawDate =
    schemaValuesMap.date ||
    entry.createdAt ||
    entryData.createdAt ||
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
    schemaValuesMap.cover_image_url ||
    schemaValuesMap.cover_image ||
    schemaValuesMap.image ||
    schemaValuesMap.coverImage ||
    schemaValuesMap.thumbnail ||
    entryData.image ||
    entryData.coverImage ||
    entryData.cover_image ||
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
  } else if (typeof entryData.content === 'string' && entryData.content) {
    bodyContent = entryData.content;
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
    schemaValuesMap.price !== undefined
      ? String(schemaValuesMap.price)
      : body.price !== undefined
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
    cover_image_url: image,
    excerpt,
    price,
    ...entryData,
    ...schemaValuesMap,
    ...multiItemsMap,
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
  const targetEntry = entry || (allEntries.length > 0 ? allEntries[0] : null);

  // 1. Process Repeating Feeds & Grids ([data-cms-repeat="true"], [data-cms-collection], .cms-dynamic-feed)
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');

    const repeatContainers = doc.querySelectorAll(
      '[data-cms-repeat="true"], [data-cms-collection], .cms-dynamic-feed',
    );

    if (repeatContainers.length > 0) {
      repeatContainers.forEach((container) => {
        const itemTemplate = container.firstElementChild;
        if (itemTemplate) {
          const itemHtml = itemTemplate.outerHTML;
          container.innerHTML = '';

          // Check if targetEntry or any entry has multi-entry schemas
          let multiItems: Array<Record<string, unknown>> = [];
          if (targetEntry) {
            const targetData =
              (targetEntry.data as Record<string, unknown>) ||
              targetEntry ||
              {};
            const schemas = Array.isArray(targetData._schemas)
              ? targetData._schemas
              : [];
            for (const s of schemas as Array<{
              entryType?: string;
              items?: Array<Record<string, unknown>>;
            }>) {
              if (
                s &&
                s.entryType === 'multi' &&
                Array.isArray(s.items) &&
                s.items.length > 0
              ) {
                multiItems = s.items;
                break;
              }
            }
          }

          if (multiItems.length === 0 && allEntries.length > 0) {
            for (const other of allEntries) {
              const otherData =
                (other.data as Record<string, unknown>) || other || {};
              const schemas = Array.isArray(otherData._schemas)
                ? otherData._schemas
                : [];
              for (const s of schemas as Array<{
                entryType?: string;
                items?: Array<Record<string, unknown>>;
              }>) {
                if (
                  s &&
                  s.entryType === 'multi' &&
                  Array.isArray(s.items) &&
                  s.items.length > 0
                ) {
                  multiItems = s.items;
                  break;
                }
              }
              if (multiItems.length > 0) break;
            }
          }

          if (multiItems.length > 0) {
            // Priority A: Repeat over multi-entry list items
            multiItems.forEach((item, index) => {
              const itemEntry = {
                id: item.id || `item_${index + 1}`,
                data: {
                  ...item,
                  title: item.title || item.name || `Item ${index + 1}`,
                  slug: item.slug || `item-${index + 1}`,
                  image: item.cover_image_url || item.image,
                  cover_image_url: item.cover_image_url || item.image,
                  _schemas: [{ values: item }],
                },
              };
              const singleHydrated = hydrateHtmlTemplate(
                itemHtml,
                itemEntry,
                [],
              );
              const tempDiv = doc.createElement('div');
              tempDiv.innerHTML = singleHydrated;
              const childEl = tempDiv.firstElementChild;
              if (childEl) {
                childEl.setAttribute('data-entry-id', String(itemEntry.id));
                childEl.setAttribute('data-item-index', String(index));
                const itemCtx = extractEntryContext(itemEntry);
                if (itemCtx.slug) {
                  childEl.setAttribute('data-entry-slug', String(itemCtx.slug));
                }
                container.appendChild(childEl);
              } else {
                container.insertAdjacentHTML('beforeend', singleHydrated);
              }
            });
          } else {
            // Priority B: Filter collection entries to only valid content entries.
            // Blank editor layout pages without schemas are excluded to avoid duplicate empty cards.
            const validContentEntries = allEntries.filter((colEntry) => {
              const colData =
                (colEntry.data as Record<string, unknown>) || colEntry || {};
              const schemas = Array.isArray(colData._schemas)
                ? colData._schemas
                : [];
              const hasSchemas = schemas.length > 0;
              const bodyRecord =
                colData.body && typeof colData.body === 'object'
                  ? (colData.body as Record<string, unknown>)
                  : null;
              const isPageLayout =
                bodyRecord !== null &&
                bodyRecord.builder === 'grapesjs' &&
                !hasSchemas;
              if (isPageLayout) return false;

              const hasBody =
                bodyRecord !== null && bodyRecord.builder !== 'grapesjs';
              return hasSchemas || hasBody;
            });

            const entriesToIterate =
              validContentEntries.length > 0
                ? validContentEntries
                : targetEntry
                  ? [targetEntry]
                  : [];

            entriesToIterate.forEach((colEntry) => {
              const singleHydrated = hydrateHtmlTemplate(
                itemHtml,
                colEntry,
                [],
              );
              const tempDiv = doc.createElement('div');
              tempDiv.innerHTML = singleHydrated;
              const childEl = tempDiv.firstElementChild;
              if (childEl && colEntry.id) {
                childEl.setAttribute('data-entry-id', String(colEntry.id));
                const colCtx = extractEntryContext(colEntry);
                if (colCtx.slug) {
                  childEl.setAttribute('data-entry-slug', String(colCtx.slug));
                }
                container.appendChild(childEl);
              } else {
                container.insertAdjacentHTML('beforeend', singleHydrated);
              }
            });
          }
        }
      });

      processedHtml = doc.body.innerHTML;
    }

    // 2. Process In-Page Dropdown Selectors (<select data-cms-dropdown>, [data-cms-selector])
    const dropdownSelectors = doc.querySelectorAll(
      'select[data-cms-dropdown], [data-cms-selector]',
    );
    if (dropdownSelectors.length > 0 && allEntries.length > 0) {
      dropdownSelectors.forEach((sel) => {
        const selectEl = sel as HTMLSelectElement;
        const currentSelectedId = entry?.id;
        selectEl.innerHTML = '';

        allEntries.forEach((colEntry) => {
          const ctx = extractEntryContext(colEntry, allEntries);
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
    }
  } catch {
    // Retain currently processed markup if DOMParser encounters malformed HTML
  }

  // 3. Process Single Entry Tokens & [data-cms-slot]
  if (targetEntry) {
    const contextData = extractEntryContext(targetEntry, allEntries);

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

        // Fallback: look for token value across other entries in the collection
        if (allEntries && allEntries.length > 0) {
          for (const otherEntry of allEntries) {
            if (otherEntry && otherEntry !== targetEntry) {
              const otherCtx = extractEntryContext(otherEntry);
              if (otherCtx[key] !== undefined && otherCtx[key] !== null) {
                const val = otherCtx[key];
                return typeof val === 'object'
                  ? JSON.stringify(val)
                  : String(val);
              }
              const otherNested = getNestedValue(otherCtx, key);
              if (otherNested !== undefined && otherNested !== null) {
                return typeof otherNested === 'object'
                  ? JSON.stringify(otherNested)
                  : String(otherNested);
              }
            }
          }
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
        // Skip elements inside repeating feed containers as they are already hydrated with their specific item
        if (
          el.closest(
            '[data-cms-repeat="true"], [data-cms-collection], .cms-dynamic-feed',
          )
        ) {
          return;
        }

        const slotKey =
          el.getAttribute('data-cms-slot') || el.getAttribute('data-cms-field');
        if (!slotKey) return;

        let slotVal = contextData[slotKey];
        if (slotVal === undefined) {
          slotVal = getNestedValue(contextData, slotKey);
        }

        // Fallback: check other entries in collection
        if (
          (slotVal === undefined || slotVal === null) &&
          allEntries &&
          allEntries.length > 0
        ) {
          for (const otherEntry of allEntries) {
            if (otherEntry && otherEntry !== targetEntry) {
              const otherCtx = extractEntryContext(otherEntry);
              if (
                otherCtx[slotKey] !== undefined &&
                otherCtx[slotKey] !== null
              ) {
                slotVal = otherCtx[slotKey];
                break;
              }
              const otherNested = getNestedValue(otherCtx, slotKey);
              if (otherNested !== undefined && otherNested !== null) {
                slotVal = otherNested;
                break;
              }
            }
          }
        }

        if (slotVal !== undefined && slotVal !== null) {
          const tag = el.tagName.toLowerCase();
          if (tag === 'img') {
            const imgEl = el as HTMLImageElement;
            imgEl.setAttribute('src', String(slotVal));
            const fit = imgEl.getAttribute('data-object-fit') || 'cover';
            imgEl.style.objectFit = fit;
            const ratio = imgEl.getAttribute('data-aspect-ratio');
            if (ratio && ratio !== 'auto') imgEl.style.aspectRatio = ratio;
            const maxH = imgEl.getAttribute('data-max-height');
            if (maxH && maxH !== 'none') imgEl.style.maxHeight = maxH;
            const radius = imgEl.getAttribute('data-border-radius');
            if (radius) imgEl.style.borderRadius = radius;
            const imgW = imgEl.getAttribute('data-image-width');
            if (imgW) imgEl.style.width = imgW;
            const pos = imgEl.getAttribute('data-object-position');
            if (pos) imgEl.style.objectPosition = pos;
          } else if (tag === 'a') {
            el.setAttribute('href', String(slotVal));
          } else if (
            slotKey === 'image' ||
            slotKey === 'coverImage' ||
            slotKey === 'cover_image_url'
          ) {
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

      // Ensure all images adhere to configured appearance traits and responsive safety
      doc.querySelectorAll('img').forEach((img) => {
        const fit = img.getAttribute('data-object-fit');
        if (fit) img.style.objectFit = fit;
        const ratio = img.getAttribute('data-aspect-ratio');
        if (ratio && ratio !== 'auto') img.style.aspectRatio = ratio;
        const maxH = img.getAttribute('data-max-height');
        if (maxH && maxH !== 'none') img.style.maxHeight = maxH;
        const radius = img.getAttribute('data-border-radius');
        if (radius) img.style.borderRadius = radius;
        const imgW = img.getAttribute('data-image-width');
        if (imgW) img.style.width = imgW;
        const pos = img.getAttribute('data-object-position');
        if (pos) img.style.objectPosition = pos;
        const align = img.getAttribute('data-image-align');
        if (align === 'center') {
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
          img.style.display = 'block';
        } else if (align === 'right') {
          img.style.marginLeft = 'auto';
          img.style.marginRight = '0';
          img.style.display = 'block';
        } else if (align === 'left') {
          img.style.marginLeft = '0';
          img.style.marginRight = 'auto';
          img.style.display = 'block';
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
