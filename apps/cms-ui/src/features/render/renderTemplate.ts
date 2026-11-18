import DOMPurify from 'dompurify';
import {
  isEmptyValue,
  lookup,
  resolveValue,
  kindOf,
  type Resolved,
} from './scope';
import type { Rec, RenderDiagnostic, RenderInput, RenderResult } from './types';
import {
  CMS_ATTRS,
  REPEAT_SELECTOR,
  TOKEN_REGEX as TOKEN,
  SKIP_TAGS,
} from './constants';

export { CMS_ATTRS };

// The template is the author's own design. DOMPurify's DOM-clobbering guard
// would strip `name="name"` from contact and comment forms, so it is off here
// (scripts, event handlers and unsafe URLs are still removed). Content that
// comes from data goes through sanitizeRich, which keeps the guard.
export const sanitizeTemplate = (html: string): string =>
  DOMPurify.sanitize(html, { ADD_ATTR: CMS_ATTRS, SANITIZE_DOM: false });

const sanitizeRich = (html: string): string =>
  DOMPurify.sanitize(html, { ADD_ATTR: CMS_ATTRS });

/** Renders a page template against explicit data. Pure: no network, no globals. */
export function renderTemplate(
  templateHtml: string,
  input: RenderInput,
): RenderResult {
  const diagnostics: RenderDiagnostic[] = [];
  const seen = new Set<string>();
  // A field that is empty on this record but filled on another is a valid
  // binding (an optional field); only a field nobody has is a broken one.
  const everyRecord: Rec[] = [
    input.page,
    ...Object.values(input.sources.schemas).flat(),
    ...input.sources.entries,
  ];
  const someoneHas = (key: string) =>
    everyRecord.some((r) => !isEmptyValue(lookup([r], key)));

  const report = (d: RenderDiagnostic) => {
    if (
      (d.code === 'unresolved-token' || d.code === 'unresolved-slot') &&
      d.key &&
      someoneHas(d.key)
    ) {
      return;
    }
    const id = `${d.code}:${d.key ?? ''}`;
    if (seen.has(id)) return;
    seen.add(id);
    diagnostics.push(d);
  };

  if (!templateHtml) return { html: '', diagnostics };

  const doc = new DOMParser().parseFromString(
    `<body>${sanitizeTemplate(templateHtml)}</body>`,
    'text/html',
  );
  const root = doc.body;

  const pageScope: Rec[] = [input.page];
  const viewScope: Rec[] = input.item ? [input.item, input.page] : pageScope;

  // ---- Archive vs single view -------------------------------------------
  root.querySelectorAll('[data-cms-show]').forEach((el) => {
    const when = el.getAttribute('data-cms-show');
    if ((when === 'item' && !input.item) || (when === 'list' && input.item)) {
      el.remove();
    }
  });

  const resolve = (scopes: Rec[], key: string): Resolved | null => {
    const raw = lookup(scopes, key);
    if (isEmptyValue(raw)) return null;
    return resolveValue(key, raw);
  };

  const textOf = (r: Resolved): string => {
    if (r.kind !== 'html') return r.value;
    const tmp = doc.createElement('div');
    tmp.innerHTML = sanitizeRich(r.value);
    return tmp.textContent ?? '';
  };

  const fragmentFor = (r: Resolved): DocumentFragment => {
    const frag = doc.createDocumentFragment();
    if (r.kind === 'html') {
      const tpl = doc.createElement('template');
      tpl.innerHTML = sanitizeRich(r.value);
      frag.appendChild(tpl.content);
    } else {
      frag.appendChild(doc.createTextNode(r.value));
    }
    return frag;
  };

  // ---- {{tokens}} in text ------------------------------------------------
  const hydrateText = (node: Text, scopes: Rec[]) => {
    const text = node.nodeValue ?? '';
    if (!text.includes('{{')) return;
    const frag = doc.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(TOKEN)) {
      const index = m.index ?? 0;
      if (index > last)
        frag.appendChild(doc.createTextNode(text.slice(last, index)));
      const key = m[1]!;
      const r = resolve(scopes, key);
      if (r) frag.appendChild(fragmentFor(r));
      else
        report({
          level: 'warning',
          code: 'unresolved-token',
          key,
          message: `{{${key}}} has no matching field, so it is shown empty.`,
        });
      last = index + m[0].length;
    }
    if (last < text.length)
      frag.appendChild(doc.createTextNode(text.slice(last)));
    node.replaceWith(frag);
  };

  // ---- {{tokens}} in attributes -----------------------------------------
  const hydrateAttributes = (el: Element, scopes: Rec[]) => {
    for (const attr of Array.from(el.attributes)) {
      if (!attr.value.includes('{{')) continue;
      el.setAttribute(
        attr.name,
        attr.value.replace(TOKEN, (_m, key: string) => {
          const r = resolve(scopes, key);
          if (r) return textOf(r);
          report({
            level: 'warning',
            code: 'unresolved-token',
            key,
            message: `{{${key}}} has no matching field, so it is shown empty.`,
          });
          return '';
        }),
      );
    }
  };

  // ---- [data-cms-slot] ---------------------------------------------------
  /** Returns true when the element's content was fully provided by the slot. */
  const applySlot = (el: Element, scopes: Rec[]): boolean => {
    const key =
      el.getAttribute('data-cms-slot') || el.getAttribute('data-cms-field');
    if (!key) return false;
    const r = resolve(scopes, key);
    if (!r) {
      report({
        level: 'warning',
        code: 'unresolved-slot',
        key,
        message: `The "${key}" slot has no matching field. The template's own placeholder is kept.`,
      });
      return false;
    }
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') {
      el.setAttribute('src', textOf(r));
      return true;
    }
    if (tag === 'a') {
      el.setAttribute('href', textOf(r));
      return false; // keep link text / children
    }
    if (kindOf(key) === 'image') {
      const url = textOf(r);
      const img = el.querySelector('img');
      if (img) img.setAttribute('src', url);
      else {
        const created = doc.createElement('img');
        created.setAttribute('src', url);
        created.setAttribute('alt', '');
        created.setAttribute(
          'style',
          'width:100%;height:100%;object-fit:cover;',
        );
        el.replaceChildren(created);
      }
      return true;
    }
    if (r.kind === 'html') {
      const tpl = doc.createElement('template');
      tpl.innerHTML = sanitizeRich(r.value);
      el.replaceChildren(tpl.content);
    } else {
      el.textContent = r.value;
    }
    return true;
  };

  // ---- Where a feed gets its posts -------------------------------------------
  const resolveSource = (container: Element): Rec[] => {
    const sources = input.sources;
    const schemaAttr = container.getAttribute('data-cms-schema')?.trim();

    // 1. The block names a schema
    if (schemaAttr) {
      const found = sources.schemas[schemaAttr];
      if (!found) {
        report({
          level: 'error',
          code: 'schema-not-found',
          key: schemaAttr,
          message: `A feed is connected to "${schemaAttr}", but no such blog or schema exists on this site.`,
        });
        return [];
      }
      if (sources.ambiguousSchemas?.includes(schemaAttr)) {
        report({
          level: 'warning',
          code: 'schema-ambiguous',
          key: schemaAttr,
          message: `"${schemaAttr}" exists on more than one page. This feed shows the first one found.`,
        });
      }
      return found;
    }

    if (container.hasAttribute('data-cms-collection')) return sources.entries;

    // 2. The page's own blog
    if (sources.defaultSchema)
      return sources.schemas[sources.defaultSchema] ?? [];

    // 3. The only blog on the site
    const keys = sources.siteSchemaKeys ?? [];
    if (keys.length === 1) {
      report({
        level: 'info',
        code: 'repeat-auto-schema',
        key: keys[0],
        message: `A feed has no blog selected, so it shows the only blog on this site ("${keys[0]}"). Select it on the block to keep it fixed.`,
      });
      return sources.schemas[keys[0]!] ?? [];
    }

    // 4. Several blogs and none chosen: ask, never guess
    if (keys.length > 1) {
      report({
        level: 'warning',
        code: 'repeat-choose-source',
        message: `A feed does not say which blog to show. This site has ${keys.length}: ${keys.join(', ')}. Select one in the builder (Schema Section).`,
      });
      return [];
    }

    if (sources.entries.length > 0) return sources.entries;
    report({
      level: 'error',
      code: 'repeat-no-source',
      message:
        'A feed block has no data source. Add a blog to this site or select one on the block.',
    });
    return [];
  };

  // ---- Repeat blocks -----------------------------------------------------
  const hydrateRepeat = (container: Element) => {
    const schemaAttr = container.getAttribute('data-cms-schema')?.trim();
    let records = resolveSource(container);

    const limit = Number(container.getAttribute('data-cms-limit'));
    if (Number.isFinite(limit) && limit > 0) records = records.slice(0, limit);

    const template = container.firstElementChild;
    if (!template) return;
    container.replaceChildren();

    if (
      records.length === 0 &&
      (schemaAttr ||
        input.sources.defaultSchema ||
        input.sources.siteSchemaKeys?.length === 1)
    ) {
      report({
        level: 'info',
        code: 'repeat-empty',
        key: schemaAttr || input.sources.defaultSchema,
        message: 'A feed is connected but has no posts to show yet.',
      });
    }

    records.forEach((rec, index) => {
      const holder = doc.createElement('div');
      holder.appendChild(template.cloneNode(true));
      hydrateChildren(holder, [rec]);
      const el = holder.firstElementChild;
      if (!el) return;
      if (rec.id !== undefined)
        el.setAttribute('data-entry-id', String(rec.id));
      if (rec.slug !== undefined)
        el.setAttribute('data-entry-slug', String(rec.slug));
      el.setAttribute('data-item-index', String(index));
      el.setAttribute('data-entry-href', input.hrefs.post(rec));
      container.appendChild(el);
    });
  };

  // ---- Dropdown switchers -----------------------------------------------
  const hydrateDropdown = (select: Element) => {
    const records = resolveSource(select);
    select.replaceChildren();
    for (const rec of records) {
      const opt = doc.createElement('option');
      opt.value = String(rec.slug ?? rec.id ?? '');
      opt.textContent = String(lookup([rec], 'title') ?? opt.value);
      if (input.item && rec.id === input.item.id)
        opt.setAttribute('selected', 'selected');
      select.appendChild(opt);
    }
  };

  const renderMenu = (el: Element) => {
    const id = el.getAttribute('data-cms-menu') || '';
    const links = input.menus?.[id];
    if (!links) {
      diagnostics.push({
        level: 'warning',
        code: 'schema-not-found',
        key: id,
        message: `The menu "${id}" does not exist or has no links yet.`,
      });
      return;
    }
    const hrefOf = (path: string) =>
      /^(https?:|mailto:|tel:|#)/.test(path)
        ? path
        : (input.hrefs.page?.(path) ?? path);

    interface MenuTreeNode {
      link: (typeof links)[number];
      children: MenuTreeNode[];
    }

    const rootNodes: MenuTreeNode[] = [];
    const stack: { node: MenuTreeNode; depth: number }[] = [];

    for (const link of links) {
      const depth = Number(link.depth ?? 0);
      const node: MenuTreeNode = { link, children: [] };
      while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
        stack.pop();
      }
      if (stack.length === 0) {
        rootNodes.push(node);
      } else {
        stack[stack.length - 1]!.node.children.push(node);
      }
      stack.push({ node, depth });
    }

    const renderNodes = (
      nodes: MenuTreeNode[],
      isSubmenu = false,
    ): HTMLUListElement => {
      const list = doc.createElement('ul');
      list.className = isSubmenu ? 'cms-submenu-list' : 'cms-menu-list';
      list.style.cssText = isSubmenu
        ? 'list-style:none;margin:0;padding:8px 0;position:absolute;top:100%;left:0;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);min-width:160px;z-index:50'
        : 'list-style:none;margin:0;padding:0;display:flex;gap:1.25rem;flex-wrap:wrap;align-items:center';

      for (const { link, children } of nodes) {
        const li = doc.createElement('li');
        li.className = isSubmenu
          ? 'cms-submenu-item'
          : `cms-menu-item${children.length ? ' cms-has-dropdown' : ''}`;
        if (children.length && !isSubmenu) {
          li.style.cssText = 'position:relative';
        }
        const a = doc.createElement('a');
        a.setAttribute('href', hrefOf(link.path));
        a.className = isSubmenu ? 'cms-submenu-link' : 'cms-menu-link';
        a.textContent = link.label;
        a.style.cssText = isSubmenu
          ? 'display:block;padding:6px 14px;color:inherit;text-decoration:none'
          : 'color:inherit;text-decoration:none';
        li.appendChild(a);

        if (children.length > 0) {
          const subUl = renderNodes(children, true);
          li.appendChild(subUl);
        }
        list.appendChild(li);
      }
      return list;
    };

    el.replaceChildren(renderNodes(rootNodes));
  };

  // ---- Walk ----------------------------------------------------------------
  function hydrateChildren(parent: Element, scopes: Rec[]) {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === 3) {
        if (!SKIP_TAGS.has(parent.tagName)) hydrateText(child as Text, scopes);
        continue;
      }
      if (child.nodeType !== 1) continue;
      const el = child as Element;
      if (SKIP_TAGS.has(el.tagName)) continue;

      if (el.matches(REPEAT_SELECTOR)) {
        hydrateAttributes(el, scopes);
        hydrateRepeat(el);
        continue;
      }
      const siteAttr = el.getAttribute('data-cms-site');
      if (siteAttr && input.site) {
        if (siteAttr === 'logo' && input.site.logoUrl) {
          if (el.tagName === 'IMG') {
            el.setAttribute('src', input.site.logoUrl);
            el.setAttribute('alt', input.site.name);
          } else {
            const img = doc.createElement('img');
            img.setAttribute('src', input.site.logoUrl);
            img.setAttribute('alt', input.site.name);
            img.style.cssText = 'max-height:44px;width:auto;display:block';
            el.replaceChildren(img);
          }
        } else if (siteAttr === 'name' || siteAttr === 'logo') {
          el.textContent = input.site.name;
        }
        continue;
      }
      if (el.hasAttribute('data-cms-menu')) {
        renderMenu(el);
        continue;
      }
      if (el.matches('select[data-cms-dropdown], [data-cms-selector]')) {
        hydrateDropdown(el);
        continue;
      }

      hydrateAttributes(el, scopes);

      const action = el.getAttribute('data-cms-action');
      const subject = scopes[0];
      if (action === 'view-post' && subject && subject !== input.page) {
        el.setAttribute('href', input.hrefs.post(subject));
        if (subject.id !== undefined)
          el.setAttribute('data-entry-id', String(subject.id));
        if (subject.slug !== undefined)
          el.setAttribute('data-entry-slug', String(subject.slug));
      } else if (action === 'back-to-list') {
        el.setAttribute('href', input.hrefs.list);
      } else if (action === 'next-post' || action === 'prev-post') {
        const target =
          action === 'next-post'
            ? input.neighbors?.next
            : input.neighbors?.prev;
        if (target) {
          el.setAttribute('href', input.hrefs.post(target));
          el.setAttribute('data-entry-slug', String(target.slug ?? ''));
          el.setAttribute('data-entry-id', String(target.id ?? ''));
        } else {
          (el as HTMLElement).style.display = 'none';
        }
      }

      if (el.hasAttribute('data-cms-tags') && subject) {
        const list = Array.isArray(subject.tags)
          ? (subject.tags as string[])
          : [];
        el.replaceChildren(
          ...list.map((slug) => {
            const a = doc.createElement('a');
            a.textContent = input.tagNames?.[slug] ?? slug;
            a.setAttribute('href', input.hrefs.tag?.(slug) ?? '#');
            a.style.cssText =
              'display:inline-block;margin:0 6px 6px 0;padding:2px 10px;border-radius:999px;background:#f5f5f4;color:#57534e;font-size:12px;font-weight:600;text-decoration:none';
            return a;
          }),
        );
        continue;
      }

      if (
        input.item &&
        scopes[0] === input.item &&
        el.matches(
          '.cms-active-post-container, .cms-post-reader, [data-cms-item]',
        )
      ) {
        if (input.item.id !== undefined)
          el.setAttribute('data-entry-id', String(input.item.id));
        if (input.item.slug !== undefined)
          el.setAttribute('data-entry-slug', String(input.item.slug));
      }

      if (applySlot(el, scopes)) continue;
      hydrateChildren(el, scopes);
    }
  }

  hydrateChildren(root, viewScope);

  // ---- Image appearance traits ----------------------------------------------
  root.querySelectorAll('img').forEach((img) => {
    const style = (
      name: keyof CSSStyleDeclaration,
      attr: string,
      skip?: string,
    ) => {
      const v = img.getAttribute(attr);
      if (v && v !== skip) (img.style as unknown as Rec)[name as string] = v;
    };
    style('objectFit', 'data-object-fit');
    style('aspectRatio', 'data-aspect-ratio', 'auto');
    style('maxHeight', 'data-max-height', 'none');
    style('borderRadius', 'data-border-radius');
    style('width', 'data-image-width');
    style('objectPosition', 'data-object-position');
    const align = img.getAttribute('data-image-align');
    if (align === 'center' || align === 'right' || align === 'left') {
      img.style.display = 'block';
      img.style.marginLeft = align === 'left' ? '0' : 'auto';
      img.style.marginRight =
        align === 'center' ? 'auto' : align === 'right' ? '0' : 'auto';
    }
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  });

  return { html: root.innerHTML, diagnostics };
}

/**
 * Older blog layouts put the card list and the post detail on one page with
 * no `data-cms-show` markers. This tags them so the page behaves like a real
 * blog: the list first, the detail once a post is opened. Layouts that already
 * use markers, or that have no list, are returned unchanged.
 */
export function inferShowMarkers(html: string): string {
  if (html.includes('data-cms-show')) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let root: Element = doc.body;
  while (
    root.children.length === 1 &&
    !root.children[0]!.hasAttribute('data-cms-repeat') &&
    root.children[0]!.children.length > 0
  ) {
    root = root.children[0]!;
  }
  const sections = Array.from(root.children);
  const isList = (el: Element) =>
    el.hasAttribute('data-cms-repeat') ||
    el.querySelector('[data-cms-repeat]') !== null;
  const usesData = (el: Element) =>
    /\{\{[^}]+\}\}/.test(el.textContent || '') ||
    el.querySelector('[data-cms-slot]') !== null;
  const lists = sections.filter(isList);
  const details = sections.filter((el) => !isList(el) && usesData(el));
  if (lists.length === 0 || details.length === 0) return html;
  lists.forEach((el) => el.setAttribute('data-cms-show', 'list'));
  details.forEach((el) => el.setAttribute('data-cms-show', 'item'));
  return doc.body.innerHTML;
}
