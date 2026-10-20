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
  register_universal_cms_traits(editor, opts);
};

/**
 * Registers CMS-binding traits on canvas elements.
 *
 * Dynamic Slot options are derived EXCLUSIVELY from the current page's custom
 * schemas (page.data._schemas). No global collection fields or hardcoded
 * fallback slots are mixed in. This keeps the dropdown clean and page-specific.
 */
export function register_universal_cms_traits(
  editor: Editor,
  opts: CustomBlocksPluginOptions = {},
) {
  const schemaFields = opts.schemaFields || [];
  const availableSchemas = opts.availableSchemas || [];

  // Helper to dynamically filter field options based on chosen schema slug
  const getFilteredFieldOptions = (
    schemaSlug?: string,
  ): Array<{ id: string; name: string }> => {
    if (schemaSlug) {
      const matched = availableSchemas.find((s) => s.slug === schemaSlug);
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

    // Default: all page-level fields
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

  // Build schema options: only page-level schemas (not the full collection list)
  const schemaOptions: Array<{ id: string; name: string }> =
    availableSchemas.length > 0
      ? [
          { id: '', name: ' All Schemas (Current Page)' },
          ...availableSchemas
            .filter((s) => s && s.slug)
            .map((s) => ({
              id: s.slug,
              name: `${s.name} (${s.slug})`,
            })),
        ]
      : [];

  // CMS traits to inject into canvas elements
  const cmsTraits: Array<Record<string, unknown>> = [];

  // Schema selector (if page has any schemas)
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
        add?: (items: unknown[]) => void;
      };
      getAttributes?: () => Record<string, unknown>;
    };
    const traits = comp.get('traits');
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
        }
      }
    }
  });

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
      if (slot && opts.schemaValues && opts.schemaValues[slot] !== undefined) {
        const val = opts.schemaValues[slot];
        const isImg = comp.is?.('image') || comp.get?.('tagName') === 'img';
        if (isImg) {
          comp.addAttributes?.({ src: String(val) });
        } else if (comp.components && typeof val === 'string') {
          comp.components(val);
        }
      }
    },
  );
}
