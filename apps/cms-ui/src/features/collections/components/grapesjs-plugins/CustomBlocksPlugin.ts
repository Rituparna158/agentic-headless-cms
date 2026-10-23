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
  register_universal_cms_traits(editor, opts);
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
      const activeSchemaSlug = comp.getAttributes?.()?.['data-cms-schema'] as
        | string
        | undefined;
      const filteredFields = getFilteredFieldOptions(activeSchemaSlug);

      const slotTrait = traits.find((t) => t.get?.('name') === 'data-cms-slot');
      if (!slotTrait) {
        traits.add(cmsTraits);
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

  // 4. Live WYSIWYG hydration: when data-cms-slot attribute changes, instantly update component in canvas
  editor.on(
    'component:update:attributes:data-cms-slot',
    (component: unknown) => {
      if (!component || typeof component !== 'object') return;
      const comp = component as {
        getAttributes?: () => Record<string, unknown>;
        is?: (type: string) => boolean;
        get?: (key: string) => unknown;
        addAttributes?: (attrs: Record<string, unknown>) => void;
        components?: (val: string) => void;
      };
      const slot = comp.getAttributes?.()?.['data-cms-slot'] as
        | string
        | undefined;
      const schemaSlug = comp.getAttributes?.()?.['data-cms-schema'] as
        | string
        | undefined;
      if (slot && opts.schemaValues) {
        let val = opts.schemaValues[slot];
        if (val === undefined && schemaSlug) {
          val = opts.schemaValues[`${schemaSlug}.${slot}`];
        }
        if (val !== undefined && val !== null) {
          const isImg = comp.is?.('image') || comp.get?.('tagName') === 'img';
          if (isImg) {
            comp.addAttributes?.({ src: String(val) });
          } else if (comp.components) {
            comp.components(typeof val === 'string' ? val : String(val));
          }
        }
      }
    },
  );

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
