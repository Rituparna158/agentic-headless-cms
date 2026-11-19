import type { ContentCollectionMeta } from '@/types/content.types';

export interface ArticleSettings {
  /** Public name of the section, e.g. "Blog" or "Newsroom". */
  sectionName: string;
  /** URL prefix that article slugs live under, e.g. "/blog". */
  urlPrefix: string;
  /** Author pre-filled on new articles. */
  defaultAuthor: string;
  /** Categories offered in the article studio. */
  categories: string[];
}

export interface SiteConfig {
  site: ContentCollectionMeta | null;
  isLoading: boolean;
  domain: string;
  environment: 'live' | 'staging';
  /** False only when the site was explicitly configured without articles. */
  articlesEnabled: boolean;
  maintenanceMode: boolean;
  article: ArticleSettings;
}
