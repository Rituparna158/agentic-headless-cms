import type { DeviceType } from './types';

/** Attributes the page builder puts on elements. They must survive sanitizing. */
export const CMS_ATTRS = [
  'data-cms-slot',
  'data-cms-field',
  'data-cms-section',
  'data-cms-repeat',
  'data-cms-collection',
  'data-cms-dropdown',
  'data-cms-selector',
  'data-cms-schema',
  'data-cms-action',
  'data-cms-show',
  'data-cms-menu',
  'data-cms-site',
  'data-cms-tags',
  'data-cms-form',
  'data-cms-form-status',
  'data-cms-limit',
  'data-cms-featured',
  'data-entry-id',
  'data-entry-slug',
  'data-item-index',
  'data-object-fit',
  'data-aspect-ratio',
  'data-max-height',
  'data-border-radius',
  'data-image-width',
  'data-object-position',
  'data-image-align',
];

export const REPEAT_SELECTOR =
  '[data-cms-repeat], [data-cms-collection], .cms-dynamic-feed';

export const TOKEN_REGEX = /{{\s*([\w.-]+)\s*}}/g;

export const SKIP_TAGS = new Set(['SCRIPT', 'STYLE']);

/**
 * One explicit list of equivalent field names. Templates use the canonical
 * name (`{{title}}`); records may store the value under any alias. The first
 * alias that has a value wins, inside the SAME record only.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  title: ['title', 'name', 'headline'],
  excerpt: ['excerpt', 'summary', 'description'],
  author: ['author', 'byline', 'writer'],
  date: ['date', 'publish_date', 'published_at', 'publishedAt', 'createdAt'],
  image: ['image', 'cover_image_url', 'cover_image', 'coverImage', 'thumbnail'],
  content: ['content', 'body', 'article_body', 'body_html', 'html'],
};

/** Average reading speed: 200 words per minute. */
export const WORDS_PER_MINUTE = 200;

export const PREVIEW_DEVICE_WIDTH: Record<DeviceType, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export const DEVICE_WIDTH: Record<DeviceType, number> = {
  desktop: 0,
  tablet: 768,
  mobile: 375,
};

export const LEVEL_STYLE: Record<string, string> = {
  error: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};
