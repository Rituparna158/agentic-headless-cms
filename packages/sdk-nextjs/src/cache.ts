import { CMS_TAG } from './constants.js';

/** ISR cache tag builders. */
export const contentTag = (schemaSlug: string) => `cms:content:${schemaSlug}`;
export const entryTag = (schemaSlug: string, entryId: string) =>
  `cms:content:${schemaSlug}:${entryId}`;
export const schemasTag = () => 'cms:schemas';
export const schemaTag = (slug: string) => `cms:schemas:${slug}`;
export const mediaListTag = () => 'cms:media';
export const mediaTag = (id: string) => `cms:media:${id}`;

export const contentListTags = (schemaSlug: string) => [
  CMS_TAG,
  contentTag(schemaSlug),
];
export const contentEntryTags = (schemaSlug: string, entryId: string) => [
  CMS_TAG,
  contentTag(schemaSlug),
  entryTag(schemaSlug, entryId),
];
export const schemasListTags = () => [CMS_TAG, schemasTag()];
export const schemaTags = (slug: string) => [
  CMS_TAG,
  schemasTag(),
  schemaTag(slug),
];
