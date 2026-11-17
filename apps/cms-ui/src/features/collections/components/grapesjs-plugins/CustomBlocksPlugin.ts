import { buildFeaturedPostsSection } from '@/features/blog/utils/featureSection';
import type { Editor } from 'grapesjs';
import { baseCss } from './shared/base-css';
import { register_hero_clean } from './blocks/premium/hero-clean';
import { register_feature_grid_clean } from './blocks/premium/feature-grid-clean';
import { register_pricing_table_clean } from './blocks/premium/pricing-table-clean';
import { register_cta_banner_clean } from './blocks/premium/cta-banner-clean';
import { register_heading_h1 } from './blocks/typography/heading-h1';
import { register_heading_h2 } from './blocks/typography/heading-h2';
import { register_heading_h3 } from './blocks/typography/heading-h3';
import { register_heading_h4 } from './blocks/typography/heading-h4';
import { register_heading_h5 } from './blocks/typography/heading-h5';
import { register_heading_h6 } from './blocks/typography/heading-h6';
import { register_paragraph } from './blocks/typography/paragraph';
import { register_blockquote } from './blocks/typography/blockquote';
import { register_section_block } from './blocks/structure/section-block';
import { register_container_block } from './blocks/structure/container-block';
import { register_navbar_block } from './blocks/structure/navbar-block';
import { register_header_block } from './blocks/structure/header-block';
import { register_footer_block } from './blocks/structure/footer-block';
import { register_divider_block } from './blocks/structure/divider-block';
import { register_spacer_block } from './blocks/structure/spacer-block';
import { register_styled_button } from './blocks/structure/styled-button';
import { register_list_ul } from './blocks/structure/list-ul';
import { register_testimonials_block } from './blocks/content/testimonials-block';
import { register_faq_block } from './blocks/content/faq-block';
import { register_team_block } from './blocks/content/team-block';
import { register_stats_block } from './blocks/content/stats-block';
import { register_logo_cloud_block } from './blocks/content/logo-cloud-block';
import { register_gallery_block } from './blocks/content/gallery-block';
import { register_card_block } from './blocks/content/card-block';
import { register_contact_info_block } from './blocks/content/contact-info-block';
import { register_social_links_block } from './blocks/content/social-links-block';
import { register_alert_block } from './blocks/content/alert-block';
import { register_tabs_block } from './blocks/content/tabs-block';
import { register_embed_block } from './blocks/content/embed-block';
import { register_badge_block } from './blocks/content/badge-block';
import { register_dynamic_cms_blocks } from './blocks/content/dynamic-cms-blocks';
import type {
  CmsSchemaField,
  CmsPageSchema,
  CustomBlocksPluginOptions,
} from '../../types/collections.types';
import { DEFAULT_GRAPESJS_MENUS } from '../../constants/grapesjsMenu.constants';

export type { CmsSchemaField, CmsPageSchema, CustomBlocksPluginOptions };

export const CustomBlocksPlugin = (
  editor: Editor,
  opts: CustomBlocksPluginOptions = {},
) => {
  editor.on('load', () => {
    const head = editor.Canvas.getDocument()?.head;
    if (head) {
      head.insertAdjacentHTML(
        'beforeend',
        `<style id="gjs-base-css">${baseCss}</style>`,
      );
    }
  });

  register_hero_clean(editor);
  register_feature_grid_clean(editor);
  register_pricing_table_clean(editor);
  register_cta_banner_clean(editor);
  register_heading_h1(editor);
  register_heading_h2(editor);
  register_heading_h3(editor);
  register_heading_h4(editor);
  register_heading_h5(editor);
  register_heading_h6(editor);
  register_paragraph(editor);
  register_blockquote(editor);
  register_section_block(editor);
  register_container_block(editor);
  register_navbar_block(editor);
  register_header_block(editor);
  register_footer_block(editor);
  register_divider_block(editor);
  register_spacer_block(editor);
  register_styled_button(editor);
  register_list_ul(editor);
  register_testimonials_block(editor);
  register_faq_block(editor);
  register_team_block(editor);
  register_stats_block(editor);
  register_logo_cloud_block(editor);
  register_gallery_block(editor);
  register_card_block(editor);
  register_contact_info_block(editor);
  register_social_links_block(editor);
  register_alert_block(editor);
  register_tabs_block(editor);
  register_embed_block(editor);
  register_badge_block(editor);
  register_dynamic_cms_blocks(editor);
  register_responsive_cover_image_block(editor);
  register_site_blocks(editor);
  register_universal_cms_traits(editor, opts);
};

/** Ready-made blocks that connect themselves to the website's data. */
export const register_site_blocks = (editor: Editor) => {
  const bm = editor.BlockManager;
  bm.add('site-navigation', {
    label: '<div class="gjs-block-label">Navigation menu</div>',
    category: 'Site',
    content: `<nav data-cms-menu="header-primary" style="padding:18px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#1c1917;border-bottom:1px solid #e7e5e4;background:#fdfbf7;">Menu: header-primary</nav>`,
  });
  bm.add('site-logo', {
    label: '<div class="gjs-block-label">Logo</div>',
    category: 'Site',
    content: `<div data-cms-site="logo" style="display:inline-block;font-weight:800;font-size:18px">Your logo</div>`,
  });
  bm.add('site-shared-section', {
    label: '<div class="gjs-block-label">Shared section</div>',
    category: 'Site',
    content: `<div data-cms-include="name-of-section" style="padding:16px;border:1px dashed #a8a29e;font-size:12px;color:#78716c">Shared section: set its name in the block settings (Shared content page)</div>`,
  });
  const HP = `<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">`;
  const FIELD =
    'width:100%;padding:10px 12px;border:1px solid #d6d3d1;border-radius:8px;font:inherit;margin-bottom:12px;background:#fff';
  bm.add('form-contact', {
    label: '<div class="gjs-block-label">Contact form</div>',
    category: 'Site',
    content: `<form data-cms-form="contact" style="max-width:520px;margin:32px auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative"><h3 style="margin:0 0 16px;font-size:22px">Get in touch</h3><input name="name" placeholder="Your name" required style="${FIELD}"><input name="email" type="email" placeholder="Your email" required style="${FIELD}"><textarea name="message" rows="5" placeholder="Your message" required style="${FIELD}"></textarea>${HP}<button type="submit" style="padding:10px 20px;border:0;border-radius:8px;background:#1c1917;color:#fff;font-weight:700;cursor:pointer">Send message</button></form>`,
  });
  bm.add('form-newsletter', {
    label: '<div class="gjs-block-label">Newsletter signup</div>',
    category: 'Site',
    content: `<form data-cms-form="newsletter" style="max-width:480px;margin:32px auto;padding:24px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;position:relative"><h3 style="margin:0 0 12px;font-size:20px">Stay in the loop</h3><div style="display:flex;gap:8px"><input name="email" type="email" placeholder="you@example.com" required style="flex:1;padding:10px 12px;border:1px solid #d6d3d1;border-radius:8px;font:inherit"><button type="submit" style="padding:10px 18px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer">Subscribe</button></div>${HP}</form>`,
  });
  bm.add('post-comments', {
    label: '<div class="gjs-block-label">Comments</div>',
    category: 'Site',
    content: `<section data-cms-show="item" style="max-width:720px;margin:40px auto;padding:0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><h3 style="font-size:20px;margin:0 0 16px">Comments</h3><div data-cms-repeat="true" data-cms-schema="comments" style="margin-bottom:24px"><div class="cms-post-card" style="padding:12px 0;border-bottom:1px solid #e7e5e4"><strong data-cms-slot="name">{{name}}</strong> <span style="color:#78716c;font-size:12px">{{date}}</span><p style="margin:6px 0 0">{{message}}</p></div></div><form data-cms-form="comment" style="position:relative"><input name="name" placeholder="Your name" required style="${FIELD}"><input name="email" type="email" placeholder="Email (never shown)" style="${FIELD}"><textarea name="message" rows="4" placeholder="Write a comment" required style="${FIELD}"></textarea>${HP}<button type="submit" style="padding:10px 20px;border:0;border-radius:8px;background:#1c1917;color:#fff;font-weight:700;cursor:pointer">Post comment</button></form></section>`,
  });
  bm.add('post-tags', {
    label: '<div class="gjs-block-label">Post tags</div>',
    category: 'Site',
    content: `<div data-cms-tags style="margin:12px 0">Tags appear here</div>`,
  });
  bm.add('post-next-prev', {
    label: '<div class="gjs-block-label">Next / previous post</div>',
    category: 'Site',
    content: `<div style="display:flex;justify-content:space-between;gap:16px;margin:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-weight:600"><a data-cms-action="prev-post" href="#" style="color:#4f46e5;text-decoration:none">← Newer post</a><a data-cms-action="next-post" href="#" style="color:#4f46e5;text-decoration:none">Older post →</a></div>`,
  });
  bm.add('post-related', {
    label: '<div class="gjs-block-label">Related posts</div>',
    category: 'Site',
    content: `<section style="padding:32px 0"><h3 style="font-size:20px;font-weight:700;margin:0 0 16px">Related posts</h3><div data-cms-repeat="true" data-cms-schema="related" data-cms-limit="3" class="cms-dynamic-feed" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px"><article class="cms-post-card" style="border:1px solid #e7e5e4;border-radius:12px;padding:16px;cursor:pointer"><h4 data-cms-slot="title" style="margin:0 0 6px;font-size:16px">{{title}}</h4><p data-cms-slot="excerpt" style="margin:0;font-size:13px;color:#78716c">{{excerpt}}</p><a href="#" data-cms-action="view-post" style="font-size:12px;font-weight:700;color:#4f46e5;text-decoration:none">Read →</a></article></div></section>`,
  });
  bm.add('post-reading-time', {
    label: '<div class="gjs-block-label">Reading time</div>',
    category: 'Site',
    content: `<span style="font-size:13px;color:#78716c">{{reading_time}}</span>`,
  });
  bm.add('site-latest-posts', {
    label: '<div class="gjs-block-label">Latest posts</div>',
    category: 'Site',
    content: buildFeaturedPostsSection({
      schemaSlug: '',
      title: 'Latest posts',
      limit: 3,
    }),
  });
};

export const register_responsive_cover_image_block = (editor: Editor) => {
  const bm = editor.BlockManager;
  bm.add('cover-image-responsive', {
    label: `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <div class="gjs-block-label">Cover Image</div>
    `,
    category: 'Content Blocks',
    content: {
      type: 'image',
      attributes: {
        'data-object-fit': 'cover',
        'data-aspect-ratio': '16/9',
        'data-max-height': '480px',
        'data-image-width': '100%',
        'data-border-radius': '8px',
        'data-object-position': 'center',
        src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
        alt: 'Responsive Banner Image',
      },
      style: {
        width: '100%',
        'max-height': '480px',
        'aspect-ratio': '16/9',
        'object-fit': 'cover',
        'border-radius': '8px',
        display: 'block',
        margin: '0 auto',
      },
    },
  });
};

export function register_universal_cms_traits(
  editor: Editor,
  opts: CustomBlocksPluginOptions = {},
) {
  const schemaFields = opts.schemaFields || [];
  const availableSchemas = opts.availableSchemas || [];

  // Helper to dynamically filter field options based on chosen schema slug or ID
  const getFilteredFieldOptions = (
    schemaSlugOrId?: string,
  ): Array<{ id: string; name: string }> => {
    if (schemaSlugOrId) {
      const matched = availableSchemas.find(
        (s) => s.slug === schemaSlugOrId || s.id === schemaSlugOrId,
      );
      if (matched && matched.fields && matched.fields.length > 0) {
        return [
          { id: '', name: '— None (Static Content) —' },
          ...matched.fields
            .filter((f) => f && f.apiId)
            .map((f) => ({
              id: f.apiId,
              name: `${f.name || f.apiId} [${f.dataType || 'text'}]`,
            })),
        ];
      }
    }

    // Default: all schema fields across the collection
    return [
      { id: '', name: '— None (Static Content) —' },
      ...schemaFields
        .filter((f) => f && f.apiId)
        .map((f) => ({
          id: f.apiId,
          name: `${f.name || f.apiId} [${f.dataType || 'text'}]`,
        })),
    ];
  };

  // Build schema options: show which page has which schema in the same collection
  const schemaOptions: Array<{ id: string; name: string }> =
    availableSchemas.length > 0
      ? [
          { id: '', name: '— All Schemas (Collection) —' },
          ...availableSchemas
            .filter((s) => s && (s.slug || s.id))
            .map((s) => {
              const origin = s.isCurrentPage
                ? 'Current Page'
                : s.pageTitle || 'Other Page';
              return {
                id: s.id || s.slug,
                name: `[${origin}] ${s.name} (${s.slug})`,
              };
            }),
        ]
      : [];

  // CMS traits to inject into canvas elements
  const cmsTraits: Array<Record<string, unknown>> = [];

  // Schema selector (if collection/page has any schemas)
  if (schemaOptions.length > 0) {
    cmsTraits.push({
      type: 'select',
      label: 'Schema Section',
      name: 'data-cms-schema',
      options: schemaOptions,
    });
  }

  // Which shared section a block shows
  cmsTraits.push({
    type: 'text',
    label: 'Shared section name',
    name: 'data-cms-include',
  });

  // Menu chooser for navigation blocks
  const menuOptions = (
    opts.menus && opts.menus.length > 0 ? opts.menus : DEFAULT_GRAPESJS_MENUS
  ).map((m) => ({
    id: m.id,
    name: m.name,
  }));

  cmsTraits.push({
    type: 'select',
    label: 'Navigation Menu',
    name: 'data-cms-menu',
    options: [{ id: '', name: '— None (Static Links) —' }, ...menuOptions],
  });

  // Which view of a blog page this section belongs to
  cmsTraits.push({
    type: 'select',
    label: 'Show on',
    name: 'data-cms-show',
    options: [
      { id: '', name: 'Always' },
      { id: 'list', name: 'Post list only' },
      { id: 'item', name: 'Single post only' },
    ],
  });

  // Dynamic slot selector (filtered by schema section)
  cmsTraits.push({
    type: 'select',
    label: 'CMS Dynamic Slot',
    name: 'data-cms-slot',
    options: getFilteredFieldOptions(),
  });

  // Visual appearance traits for images to prevent large screen breakage
  const imageAppearanceTraits: Array<Record<string, unknown>> = [
    {
      type: 'select',
      label: 'Image Fit (object-fit)',
      name: 'data-object-fit',
      options: [
        { id: 'cover', name: 'Cover (Fill & Crop Cleanly)' },
        { id: 'contain', name: 'Contain (Fit Entire Image)' },
        { id: 'fill', name: 'Fill (Stretch to Frame)' },
        { id: 'scale-down', name: 'Scale Down' },
        { id: 'none', name: 'None (Natural Size)' },
      ],
    },
    {
      type: 'select',
      label: 'Aspect Ratio',
      name: 'data-aspect-ratio',
      options: [
        { id: 'auto', name: 'Auto (Original Ratio)' },
        { id: '16/9', name: '16:9 (Landscape Banner)' },
        { id: '21/9', name: '21:9 (Ultrawide Hero)' },
        { id: '4/3', name: '4:3 (Standard Photo)' },
        { id: '1/1', name: '1:1 (Square)' },
        { id: '3/2', name: '3:2 (Classic 35mm)' },
      ],
    },
    {
      type: 'select',
      label: 'Max Height (Desktop / Wide)',
      name: 'data-max-height',
      options: [
        { id: 'none', name: 'None (Uncapped)' },
        { id: '280px', name: '280px (Compact Thumbnail)' },
        { id: '380px', name: '380px (Medium Card)' },
        { id: '480px', name: '480px (Standard Hero)' },
        { id: '600px', name: '600px (Large Screen Banner)' },
        { id: '750px', name: '750px (Cinematic Feature)' },
      ],
    },
    {
      type: 'select',
      label: 'Width',
      name: 'data-image-width',
      options: [
        { id: '100%', name: '100% (Full Width)' },
        { id: '75%', name: '75% (Centered)' },
        { id: '50%', name: '50% (Half Width)' },
        { id: 'auto', name: 'Auto (Intrinsic)' },
      ],
    },
    {
      type: 'select',
      label: 'Corner Radius',
      name: 'data-border-radius',
      options: [
        { id: '0px', name: 'Sharp (0px)' },
        { id: '8px', name: 'Subtle (8px)' },
        { id: '16px', name: 'Rounded (16px)' },
        { id: '24px', name: 'Card Rounded (24px)' },
        { id: '9999px', name: 'Circle / Pill' },
      ],
    },
    {
      type: 'select',
      label: 'Focal Point (Position)',
      name: 'data-object-position',
      options: [
        { id: 'center', name: 'Center (Balanced)' },
        { id: 'top', name: 'Top (Headshot / Sky)' },
        { id: 'bottom', name: 'Bottom' },
        { id: 'left', name: 'Left' },
        { id: 'right', name: 'Right' },
      ],
    },
    {
      type: 'select',
      label: 'Alignment',
      name: 'data-image-align',
      options: [
        { id: 'center', name: 'Center in Container' },
        { id: 'left', name: 'Left Aligned' },
        { id: 'right', name: 'Right Aligned' },
      ],
    },
  ];

  // 1. Extend common base element types to include CMS traits
  const typesToExtend = ['default', 'text', 'textnode', 'image', 'link', 'box'];
  typesToExtend.forEach((typeName) => {
    const existingType = editor.DomComponents.getType(typeName);
    if (existingType) {
      editor.DomComponents.addType(typeName, {
        model: {
          defaults: {
            traits: [
              ...(existingType.model.prototype.defaults?.traits || []),
              ...cmsTraits,
              ...(typeName === 'image' ? imageAppearanceTraits : []),
            ],
          },
        },
      });
    }
  });

  // 2. Ensure every selected component on canvas has up-to-date and schema-filtered CMS traits
  editor.on('component:selected', (model: unknown) => {
    if (!model || typeof model !== 'object') return;
    const comp = model as {
      get?: (k: string) => unknown;
      getAttributes?: () => Record<string, unknown>;
      addAttributes?: (attrs: Record<string, unknown>) => void;
      addStyle?: (style: Record<string, string>) => void;
      getStyle?: () => Record<string, string>;
      getEl?: () => HTMLElement | null;
      is?: (type: string) => boolean;
    };
    const traits = comp.get?.('traits') as
      | {
          find?: (
            fn: (t: {
              get: (name: string) => string;
              set?: (k: string, v: unknown) => void;
            }) => boolean,
          ) =>
            | {
                get?: (name: string) => string;
                set?: (k: string, v: unknown) => void;
              }
            | undefined;
          add?: (items: unknown[]) => void;
        }
      | undefined;

    if (
      traits &&
      typeof traits.find === 'function' &&
      typeof traits.add === 'function'
    ) {
      let activeSchemaSlug = comp.getAttributes?.()?.['data-cms-schema'] as
        | string
        | undefined;

      // Ancestor lookup if active element doesn't have data-cms-schema directly
      if (!activeSchemaSlug) {
        let parentComp =
          typeof (comp as { parent?: () => unknown }).parent === 'function'
            ? (comp as { parent: () => unknown }).parent()
            : null;
        while (parentComp && !activeSchemaSlug) {
          const pComp = parentComp as {
            getAttributes?: () => Record<string, unknown>;
            parent?: () => unknown;
          };
          const pAttrs = pComp.getAttributes?.();
          if (pAttrs?.['data-cms-schema']) {
            activeSchemaSlug = pAttrs['data-cms-schema'] as string;
            break;
          }
          parentComp =
            typeof pComp.parent === 'function' ? pComp.parent() : null;
        }
      }

      if (
        activeSchemaSlug &&
        !comp.getAttributes?.()?.['data-cms-schema'] &&
        comp.getAttributes?.()?.['data-cms-slot']
      ) {
        comp.addAttributes?.({ 'data-cms-schema': activeSchemaSlug });
      }

      const filteredFields = getFilteredFieldOptions(activeSchemaSlug);

      const slotTrait = traits.find((t) => t.get?.('name') === 'data-cms-slot');
      if (!slotTrait) {
        const configuredTraits = cmsTraits.map((t) =>
          t.name === 'data-cms-slot' ? { ...t, options: filteredFields } : t,
        );
        traits.add(configuredTraits);
      } else if (slotTrait.set) {
        slotTrait.set('options', filteredFields);
      }

      if (schemaOptions.length > 0) {
        const schemaTrait = traits.find(
          (t) => t.get?.('name') === 'data-cms-schema',
        );
        if (schemaTrait && schemaTrait.set) {
          schemaTrait.set('options', schemaOptions);
        } else if (!schemaTrait && traits.add) {
          traits.add([
            {
              type: 'select',
              label: 'Schema Section',
              name: 'data-cms-schema',
              options: schemaOptions,
            },
          ]);
        }
      }

      // Add image appearance traits when an image is selected
      const isImg =
        !!comp.is?.('image') ||
        (comp.get?.('tagName') as unknown as string) === 'img';
      if (isImg) {
        const fitTrait = traits.find(
          (t) => t.get?.('name') === 'data-object-fit',
        );
        if (!fitTrait && traits.add) {
          traits.add(imageAppearanceTraits);
          (
            editor.TraitManager as unknown as { render?: () => void }
          )?.render?.();
        }

        const currentAttrs = comp.getAttributes?.() || {};
        const updates: Record<string, unknown> = {};
        if (!currentAttrs['data-object-fit']) {
          updates['data-object-fit'] = 'cover';
        }
        if (!currentAttrs['data-image-width']) {
          updates['data-image-width'] = '100%';
        }
        if (!currentAttrs['data-max-height']) {
          updates['data-max-height'] = '480px';
        }
        if (!currentAttrs['data-aspect-ratio']) {
          updates['data-aspect-ratio'] = '16/9';
        }
        if (Object.keys(updates).length > 0) {
          comp.addAttributes?.(updates);
        }

        const currentStyle = comp.getStyle?.() || {};
        if (!currentStyle['object-fit']) {
          const defaultStyles: Record<string, string> = {
            width: (currentAttrs['data-image-width'] as string) || '100%',
            'object-fit':
              (currentAttrs['data-object-fit'] as string) || 'cover',
            'max-height':
              (currentAttrs['data-max-height'] as string) || '480px',
            'aspect-ratio':
              (currentAttrs['data-aspect-ratio'] as string) || '16/9',
            display: 'block',
          };
          comp.addStyle?.(defaultStyles);
          const el = comp.getEl?.();
          if (el) Object.assign(el.style, defaultStyles);
        }
      }
    }
  });

  // Apply image styling live when traits or attributes change
  const syncImageStyles = (component: unknown) => {
    if (!component || typeof component !== 'object') return;
    const comp = component as {
      is?: (type: string) => boolean;
      get?: (k: string) => unknown;
      getAttributes?: () => Record<string, unknown>;
      addStyle?: (style: Record<string, string>) => void;
      getEl?: () => HTMLElement | null;
    };
    const isImg =
      !!comp.is?.('image') ||
      (comp.get?.('tagName') as unknown as string) === 'img';
    if (!isImg) return;

    const attrs = comp.getAttributes?.() || {};
    const newStyles: Record<string, string> = {};

    if (attrs['data-object-fit']) {
      newStyles['object-fit'] = String(attrs['data-object-fit']);
    }
    if (attrs['data-aspect-ratio']) {
      newStyles['aspect-ratio'] =
        attrs['data-aspect-ratio'] === 'auto'
          ? 'auto'
          : String(attrs['data-aspect-ratio']);
    }
    if (attrs['data-max-height']) {
      newStyles['max-height'] =
        attrs['data-max-height'] === 'none'
          ? 'none'
          : String(attrs['data-max-height']);
    }
    if (attrs['data-border-radius']) {
      newStyles['border-radius'] = String(attrs['data-border-radius']);
    }
    if (attrs['data-image-width']) {
      newStyles['width'] = String(attrs['data-image-width']);
    }
    if (attrs['data-object-position']) {
      newStyles['object-position'] = String(attrs['data-object-position']);
    }
    if (attrs['data-image-align']) {
      const align = String(attrs['data-image-align']);
      if (align === 'center') {
        newStyles['margin-left'] = 'auto';
        newStyles['margin-right'] = 'auto';
        newStyles['display'] = 'block';
      } else if (align === 'right') {
        newStyles['margin-left'] = 'auto';
        newStyles['margin-right'] = '0';
        newStyles['display'] = 'block';
      } else {
        newStyles['margin-left'] = '0';
        newStyles['margin-right'] = 'auto';
        newStyles['display'] = 'block';
      }
    }

    if (Object.keys(newStyles).length > 0) {
      comp.addStyle?.(newStyles);
      const el = comp.getEl?.();
      if (el) {
        Object.assign(el.style, newStyles);
      }
    }
  };

  editor.on('component:update', syncImageStyles);
  editor.on('component:update:attributes', syncImageStyles);

  // 3. Dynamic reaction: when user changes Schema Section trait, re-filter CMS Dynamic Slot trait instantly
  editor.on(
    'component:update:attributes:data-cms-schema',
    (component: unknown) => {
      if (!component || typeof component !== 'object') return;
      const comp = component as {
        get: (k: string) => {
          find?: (
            fn: (t: {
              get: (name: string) => string;
              set?: (k: string, v: unknown) => void;
            }) => boolean,
          ) =>
            | {
                get?: (name: string) => string;
                set?: (k: string, v: unknown) => void;
              }
            | undefined;
        };
        getAttributes?: () => Record<string, unknown>;
        addAttributes?: (attrs: Record<string, unknown>) => void;
      };
      const traits = comp.get('traits');
      if (traits && typeof traits.find === 'function') {
        const newSchemaSlug = comp.getAttributes?.()?.['data-cms-schema'] as
          | string
          | undefined;
        const updatedFields = getFilteredFieldOptions(newSchemaSlug);

        const slotTrait = traits.find(
          (t) => t.get?.('name') === 'data-cms-slot',
        );
        if (slotTrait && slotTrait.set) {
          slotTrait.set('options', updatedFields);
        }

        // If active slot doesn't belong to the newly chosen schema, reset slot
        const currentSlot = comp.getAttributes?.()?.['data-cms-slot'] as
          | string
          | undefined;
        if (
          currentSlot &&
          !updatedFields.some((opt) => opt.id === currentSlot)
        ) {
          comp.addAttributes?.({ 'data-cms-slot': '' });
        }
      }
    },
  );

  // 4. Live WYSIWYG hydration: when data-cms-slot or data-cms-schema attribute changes, instantly update component in canvas
  const hydrateSlotComponent = (component: unknown) => {
    if (!component || typeof component !== 'object') return;
    const comp = component as {
      getAttributes?: () => Record<string, unknown>;
      is?: (type: string) => boolean;
      get?: (key: string) => unknown;
      addAttributes?: (attrs: Record<string, unknown>) => void;
      components?: (val: string) => void;
      parent?: () => unknown;
      getEl?: () => HTMLElement | null;
    };
    const slot = (comp.getAttributes?.()?.['data-cms-slot'] ||
      comp.getAttributes?.()?.['data-cms-field']) as string | undefined;
    let schemaSlug = comp.getAttributes?.()?.['data-cms-schema'] as
      | string
      | undefined;

    // Ancestor lookup if missing on the element itself
    if (!schemaSlug && typeof comp.parent === 'function') {
      let parentComp = comp.parent();
      while (parentComp && !schemaSlug) {
        const pComp = parentComp as {
          getAttributes?: () => Record<string, unknown>;
          parent?: () => unknown;
        };
        const pAttrs = pComp.getAttributes?.();
        if (pAttrs?.['data-cms-schema']) {
          schemaSlug = pAttrs['data-cms-schema'] as string;
          break;
        }
        parentComp = typeof pComp.parent === 'function' ? pComp.parent() : null;
      }
    }

    if (slot && opts.schemaValues) {
      let val = opts.schemaValues[slot];
      if (val === undefined && schemaSlug) {
        val = opts.schemaValues[`${schemaSlug}.${slot}`];
      }
      if (val !== undefined && val !== null) {
        const isImg = comp.is?.('image') || comp.get?.('tagName') === 'img';
        if (isImg) {
          comp.addAttributes?.({ src: String(val) });
          const el = comp.getEl?.();
          if (el && el instanceof HTMLImageElement) {
            el.src = String(val);
          }
        } else if (
          comp.get?.('tagName') === 'a' &&
          (slot.includes('url') ||
            slot.includes('link') ||
            slot.includes('href'))
        ) {
          comp.addAttributes?.({ href: String(val) });
          const el = comp.getEl?.();
          if (el) el.setAttribute('href', String(val));
        } else if (comp.components) {
          comp.components(typeof val === 'string' ? val : String(val));
        }
      }
    }
  };

  editor.on('component:update:attributes:data-cms-slot', hydrateSlotComponent);
  editor.on('component:update:attributes:data-cms-field', hydrateSlotComponent);
  editor.on(
    'component:update:attributes:data-cms-schema',
    hydrateSlotComponent,
  );

  // 5. Canvas-wide hydration: ensures newly loaded or updated pages immediately reflect schema values on canvas
  const hydrateAllCanvasSlots = () => {
    try {
      const wrapper = editor.getWrapper?.();
      if (!wrapper || typeof wrapper.find !== 'function') return;
      const slotted = wrapper.find('[data-cms-slot], [data-cms-field]');
      if (Array.isArray(slotted)) {
        for (const item of slotted) {
          hydrateSlotComponent(item);
        }
      }
    } catch {
      // Safe no-op in non-DOM or unit test environments
    }
  };

  editor.on('load', hydrateAllCanvasSlots);
  hydrateAllCanvasSlots();

  // Trigger refresh on currently selected component if any
  try {
    const selected = editor.getSelected();
    if (selected) {
      (
        editor as unknown as {
          trigger: (e: string, ...args: unknown[]) => void;
        }
      ).trigger('component:selected', selected);
    }
  } catch {
    // Ignore in non-DOM or unit test environments
  }
}
