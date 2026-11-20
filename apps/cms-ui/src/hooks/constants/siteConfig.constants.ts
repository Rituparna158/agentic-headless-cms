import type { ArticleSettings } from '../types/siteConfig.types';

export const DEFAULT_ARTICLE_SETTINGS: ArticleSettings = {
  sectionName: 'Blog',
  urlPrefix: '/blog',
  defaultAuthor: '',
  categories: [
    'Engineering',
    'Product Update',
    'Company News',
    'Tutorials & Guides',
  ],
};
