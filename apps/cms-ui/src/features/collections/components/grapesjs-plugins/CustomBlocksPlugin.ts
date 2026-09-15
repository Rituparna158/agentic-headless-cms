import type { Editor, Plugin } from 'grapesjs';
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

export const CustomBlocksPlugin: Plugin = (editor: Editor) => {
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
};
