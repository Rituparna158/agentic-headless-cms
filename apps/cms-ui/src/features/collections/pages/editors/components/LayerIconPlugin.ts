import type { Editor } from 'grapesjs';

const LAYER_ICONS: Record<string, { icon: string; color: string }> = {
  // Layout / Container types
  wrapper: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    color: '#a78bfa',
  },
  default: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    color: '#71717a',
  },
  section: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
    color: '#a78bfa',
  },
  row: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`,
    color: '#818cf8',
  },
  cell: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    color: '#94a3b8',
  },
  column: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
    color: '#94a3b8',
  },
  // Text types
  text: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    color: '#e879f9',
  },
  heading: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M6 4v16"/><path d="M18 4v16"/></svg>`,
    color: '#f472b6',
  },
  textnode: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>`,
    color: '#a1a1aa',
  },
  // Media types
  image: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    color: '#34d399',
  },
  video: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,
    color: '#f97316',
  },
  map: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    color: '#38bdf8',
  },
  // Interactive types
  link: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    color: '#60a5fa',
  },
  button: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M12 12h.01"/></svg>`,
    color: '#c084fc',
  },
  // Form types
  form: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h4"/></svg>`,
    color: '#22d3ee',
  },
  input: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01"/></svg>`,
    color: '#a1a1aa',
  },
  textarea: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h12"/><path d="M6 12h12"/><path d="M6 16h6"/></svg>`,
    color: '#a1a1aa',
  },
  select: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m7 15 5 5 5-5"/></svg>`,
    color: '#a1a1aa',
  },
  label: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
    color: '#a1a1aa',
  },
  // Custom premium component types
  'hero-clean-component': {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`,
    color: '#a855f7',
  },
  'feature-grid-component': {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    color: '#a855f7',
  },
  'pricing-table-component': {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    color: '#a855f7',
  },
  'cta-banner-component': {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    color: '#a855f7',
  },
};

/**
 * Tag-name-based icon mapping for HTML elements that don't have explicit GrapesJS types.
 */
const TAG_ICONS: Record<string, { icon: string; color: string }> = {
  h1: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.2"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H1</text></svg>`,
    color: '#c4b5fd',
  },
  h2: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.2"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H2</text></svg>`,
    color: '#c4b5fd',
  },
  h3: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.2"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H3</text></svg>`,
    color: '#c4b5fd',
  },
  h4: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.15"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H4</text></svg>`,
    color: '#c4b5fd',
  },
  h5: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.15"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H5</text></svg>`,
    color: '#c4b5fd',
  },
  h6: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#7c3aed" opacity="0.15"/><text x="12" y="15.5" text-anchor="middle" font-size="10" font-weight="700" fill="#c4b5fd" font-family="system-ui">H6</text></svg>`,
    color: '#c4b5fd',
  },
  p: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" fill="#6366f1" opacity="0.15"/><text x="12" y="15.5" text-anchor="middle" font-size="11" font-weight="700" fill="#a5b4fc" font-family="system-ui">P</text></svg>`,
    color: '#a5b4fc',
  },
  a: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    color: '#60a5fa',
  },
  ul: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`,
    color: '#a1a1aa',
  },
  li: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="12" x2="21" y2="12"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/></svg>`,
    color: '#a1a1aa',
  },
  span: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>`,
    color: '#94a3b8',
  },
  div: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    color: '#71717a',
  },
  section: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
    color: '#a78bfa',
  },
  nav: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
    color: '#fbbf24',
  },
  header: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>`,
    color: '#a78bfa',
  },
  footer: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>`,
    color: '#a78bfa',
  },
  img: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    color: '#34d399',
  },
  button: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M12 12h.01"/></svg>`,
    color: '#c084fc',
  },
  form: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h4"/></svg>`,
    color: '#22d3ee',
  },
  input: {
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01"/></svg>`,
    color: '#a1a1aa',
  },
};

/**
 * Gets the appropriate icon data for a layer element by analyzing its GrapesJS component.
 */
function getIconForComponent(
  _editor: Editor,
  layerEl: Element,
): { icon: string; color: string } | null {
  // Try to get the component model from the layer element
  const layerModel = (
    layerEl as unknown as {
      __gjsLayerModel?: { get?: (key: string) => string };
    }
  ).__gjsLayerModel;
  if (layerModel) {
    const type = layerModel.get?.('type') || '';
    const tagName = (layerModel.get?.('tagName') || '').toLowerCase();

    if (type && LAYER_ICONS[type]) return LAYER_ICONS[type]!;
    if (tagName && TAG_ICONS[tagName]) return TAG_ICONS[tagName]!;
  }

  // Fallback: parse the layer title text to infer type
  const titleEl = layerEl.querySelector('.gjs-layer-name');
  const titleText = titleEl?.textContent?.trim().toLowerCase() || '';

  // Check component name patterns
  if (titleText.includes('body') || titleText === 'wrapper')
    return LAYER_ICONS['wrapper']!;
  if (titleText.includes('hero')) return LAYER_ICONS['hero-clean-component']!;
  if (titleText.includes('feature'))
    return LAYER_ICONS['feature-grid-component']!;
  if (titleText.includes('pricing'))
    return LAYER_ICONS['pricing-table-component']!;
  if (titleText.includes('cta')) return LAYER_ICONS['cta-banner-component']!;
  if (titleText.includes('navbar') || titleText.includes('nav'))
    return TAG_ICONS['nav']!;
  if (titleText.includes('header')) return TAG_ICONS['header']!;
  if (titleText.includes('footer')) return TAG_ICONS['footer']!;
  if (/^h[1-6]$/.test(titleText) || titleText.startsWith('heading'))
    return LAYER_ICONS['heading']!;
  if (titleText === 'row') return LAYER_ICONS['row']!;
  if (titleText === 'cell') return LAYER_ICONS['cell']!;
  if (titleText === 'link' || titleText === 'a') return LAYER_ICONS['link']!;
  if (titleText === 'image' || titleText === 'img')
    return LAYER_ICONS['image']!;
  if (titleText === 'video') return LAYER_ICONS['video']!;
  if (titleText === 'map') return LAYER_ICONS['map']!;
  if (titleText === 'text' || titleText === 'paragraph')
    return LAYER_ICONS['text']!;
  if (titleText === 'button') return LAYER_ICONS['button']!;
  if (titleText === 'form') return LAYER_ICONS['form']!;
  if (titleText === 'input') return LAYER_ICONS['input']!;

  return LAYER_ICONS['default'] ?? null;
}

/**
 * Injects custom icons into all layer title elements in the layers panel.
 */
function injectLayerIcons(editor: Editor, container: HTMLElement) {
  const layerElements = container.querySelectorAll('.gjs-layer');

  layerElements.forEach((layerEl) => {
    const titleInn = layerEl.querySelector(
      ':scope > .gjs-layer-title .gjs-layer-title-inn',
    );
    if (!titleInn) return;

    // Skip if icon already injected
    if (titleInn.querySelector('.gjs-layer-icon-custom')) return;

    const iconData = getIconForComponent(editor, layerEl);
    if (!iconData) return;

    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'gjs-layer-icon-custom';
    iconWrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 6px;
      color: ${iconData.color};
      flex-shrink: 0;
      width: 18px;
      height: 18px;
    `;
    iconWrapper.innerHTML = iconData.icon;

    // Insert icon before the layer name
    const nameEl = titleInn.querySelector('.gjs-layer-name');
    if (nameEl) {
      titleInn.insertBefore(iconWrapper, nameEl);
    } else {
      titleInn.prepend(iconWrapper);
    }
  });
}

/**
 * Plugin that enhances the GrapesJS layers panel with custom type-specific icons.
 */
export function setupLayerIcons(editor: Editor) {
  editor.on('load', () => {
    // Wait for layers to render
    setTimeout(() => {
      const layersContainer = document.getElementById('gjs-layers');
      if (!layersContainer) return;

      // Initial injection
      injectLayerIcons(editor, layersContainer);

      // Watch for DOM changes (layers being added/removed/toggled)
      const observer = new MutationObserver(() => {
        // Debounce rapid mutations
        requestAnimationFrame(() => {
          injectLayerIcons(editor, layersContainer);
        });
      });

      observer.observe(layersContainer, {
        childList: true,
        subtree: true,
      });

      // Also inject on component changes
      editor.on('component:add component:remove component:update', () => {
        setTimeout(() => injectLayerIcons(editor, layersContainer), 100);
      });

      // Inject when layers are expanded/collapsed
      editor.on('layer:root', () => {
        setTimeout(() => injectLayerIcons(editor, layersContainer), 100);
      });
    }, 500);
  });
}
