export interface WebsiteProperty {
  id: string;
  name: string;
  slug: string;
  domain: string;
  modules: 'Pages + Articles' | 'Pages Only';
  pagesCount: number;
  lastUpdated: string;
  status: 'live' | 'staging';
}

export type DashboardFilterTab = 'all' | 'live' | 'staging';

export type DashboardViewMode = 'table' | 'grid';
