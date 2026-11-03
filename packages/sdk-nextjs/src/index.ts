/**
 * Next.js App Router SDK for Agentic Headless CMS , server only
 */

export {
  getCmsClient,
  createNextjsClient,
  _resetClientSingleton,
} from './client.js';
export { CMS_TAG } from './constants.js';
export {
  contentTag,
  entryTag,
  schemasTag,
  schemaTag,
  mediaListTag,
  mediaTag,
  contentListTags,
  contentEntryTags,
  schemasListTags,
  schemaTags,
} from './cache.js';

export { getContentList, getContentEntry } from './server/content.js';
export { getSchemas, getSchema } from './server/schemas.js';
export { getMediaList, getMediaAsset } from './server/media.js';
export { generateCmsStaticParams } from './server/static-params.js';
export { generateMetadataFromEntry } from './server/metadata.js';
export type { CmsMetadata } from './server/metadata.js';
export { draftModeHandlers } from './preview/draft-mode.js';
export { revalidationHandler } from './webhooks/revalidation-handler.js';

export {
  createEntryAction,
  updateEntryAction,
  publishEntryAction,
  deleteEntryAction,
} from './actions/content-actions.js';
export type { ActionState } from './types.js';

export type { NextFetchOptions, FetchConfig } from './types.js';
export type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  ListContentEntriesResult,
  SchemaRecord,
  MediaAsset,
  ListMediaResult,
  PaginatedResult,
} from '@repo/types';
