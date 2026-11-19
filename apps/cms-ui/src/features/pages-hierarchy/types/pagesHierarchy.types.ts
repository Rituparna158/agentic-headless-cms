export type PagesFilterStatus = 'all' | 'published' | 'drafts';

export type NewPageTemplateKind = 'blank' | 'inherit' | 'standard';

export interface PageToDeleteTarget {
  id: string;
  title: string;
}
