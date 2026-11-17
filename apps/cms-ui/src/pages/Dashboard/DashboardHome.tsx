import { activateOnKey } from '@/utils/a11y.util';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  Plus,
  Search,
  ExternalLink,
  Rocket,
  LayoutGrid,
  List,
  Building2,
  Bell,
  HelpCircle,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { ContentCollectionMeta } from '@/types/content.types';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCmsToast } from '@/hooks/useCmsToast';
import { CreateSiteWizardModal } from '@/features/collections/components/modals/CreateSiteWizardModal';
import type {
  WebsiteProperty,
  DashboardFilterTab,
  DashboardViewMode,
} from './types/dashboard.types';

export type { WebsiteProperty };

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const toast = useCmsToast();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<DashboardFilterTab>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<DashboardViewMode>('table');

  // Query real collections from backend
  const collectionsQuery = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });

  const rawCollections = useMemo(
    () => extractArrayPayload<ContentCollectionMeta>(collectionsQuery.data),
    [collectionsQuery.data],
  );

  // Process real API collections only - no dummy values
  const allWebsites: WebsiteProperty[] = useMemo(() => {
    return rawCollections.map((c) => {
      const meta = (c.metadata || {}) as Record<string, unknown>;
      const hasArticles = meta.hasArticles !== false;
      const domain =
        (meta.domain as string) || (c.slug ? `${c.slug}.acme.com` : 'acme.com');
      const isStaging = meta.status === 'staging' || c.status === 'staging';

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        domain,
        modules: hasArticles ? 'Pages + Articles' : 'Pages Only',
        pagesCount: c.linkedPagesCount ?? c.entryCount ?? 0,
        lastUpdated: c.updatedAt
          ? new Date(c.updatedAt).toLocaleDateString()
          : c.createdAt
            ? new Date(c.createdAt).toLocaleDateString()
            : 'Just now',
        status: isStaging ? 'staging' : 'live',
      };
    });
  }, [rawCollections]);

  // Filter & Search
  const filteredWebsites = useMemo(() => {
    return allWebsites.filter((site) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.domain.toLowerCase().includes(q) ||
        site.slug.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (filterTab === 'live') return site.status === 'live';
      if (filterTab === 'staging') return site.status === 'staging';
      return true;
    });
  }, [allWebsites, search, filterTab]);

  const liveCount = allWebsites.filter((s) => s.status === 'live').length;
  const stagingCount = allWebsites.filter((s) => s.status === 'staging').length;

  const handleOpenWorkspace = (slug: string) => {
    navigate(`/sites/${slug}`);
  };

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* GLOBAL TIER: COMPANY COMMAND CENTER TOP BAR */}
      <div className="px-8 py-3.5 border-b border-border bg-card/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Building2 size={16} />
            </span>
            <span>Mindfire digital LLP</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Digital Operations & Headless Publishing
          </span>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:text-foreground hover:bg-muted transition-colors relative"
            title="System Notifications"
            aria-label="System notifications"
            onClick={() =>
              toast.info('You are all caught up. No unread operational alerts.')
            }
          >
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            onClick={() =>
              window.open(
                'https://mindfiredigital.github.io/agentic-headless-cms/',
                '_blank',
                'noopener,noreferrer',
              )
            }
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
              {user?.email ? user.email.slice(0, 2) : 'SJ'}
            </div>
            <span className="font-medium text-foreground">
              {user?.email || 'Sarah Jenkins'}
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD HERO BANNER */}
      <div className="px-8 py-7 border-b border-border bg-card/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              All Websites ({allWebsites.length})
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Multi-Site Network Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Central management launchpad for all digital properties and landing
            domains owned by Acme Corp. Click any workspace to manage pages,
            articles, and navigation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          className={`${CMS_THEME_CLASSES.buttons.primary} text-sm py-2.5 px-4 shadow-sm`}
        >
          <Plus size={16} />
          <span>Create New Website</span>
        </button>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="px-8 py-3.5 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterTab === 'all'
                ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Sites ({allWebsites.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('live')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterTab === 'live'
                ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Production Live ({liveCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('staging')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filterTab === 'staging'
                ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Staging ({stagingCount})
          </button>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              size={14}
              className="absolute left-3 top-2.5 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search websites or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center border border-border rounded-lg p-0.5 bg-card">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* WEBSITES DIRECTORY VIEW */}
      <div className="flex-1 p-8 overflow-y-auto">
        {filteredWebsites.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              No websites found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Try adjusting your search criteria or create a new website.
            </p>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className={CMS_THEME_CLASSES.buttons.primary}
            >
              <Plus size={14} />
              <span>Create New Website</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* SCREEN 1: CENTRAL TABLE VIEW */
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-6">WEBSITE</th>
                  <th className="py-3.5 px-4">PRIMARY DOMAIN</th>
                  <th className="py-3.5 px-4">ACTIVE MODULES</th>
                  <th className="py-3.5 px-4">PAGES</th>
                  <th className="py-3.5 px-4">LAST UPDATED</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWebsites.map((site) => (
                  <tr
                    key={site.id}
                    onClick={() => handleOpenWorkspace(site.slug)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    {/* Website Name */}
                    <td className="py-4 px-6 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                          <Globe size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {site.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            slug: {site.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Domain */}
                    <td className="py-4 px-4 font-mono text-[11px] text-foreground">
                      <a
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 hover:underline text-foreground"
                      >
                        <span>{site.domain}</span>
                        <ExternalLink
                          size={12}
                          className="text-muted-foreground"
                        />
                      </a>
                    </td>

                    {/* Active Modules */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted text-foreground border border-border">
                        {site.modules === 'Pages + Articles' ? (
                          <>
                            <FileText size={12} className="text-indigo-400" />
                            <span>Pages + Articles</span>
                          </>
                        ) : (
                          <>
                            <Layers
                              size={12}
                              className="text-muted-foreground"
                            />
                            <span>Pages Only</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Pages Count */}
                    <td className="py-4 px-4 font-medium text-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                        {site.pagesCount} Pages
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-4 px-4 text-muted-foreground text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-muted-foreground/60" />
                        <span>{site.lastUpdated}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {site.status === 'live' ? (
                        <span className={CMS_THEME_CLASSES.badges.live}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className={CMS_THEME_CLASSES.badges.staging}>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          Staging
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWorkspace(site.slug);
                        }}
                        className={`${CMS_THEME_CLASSES.buttons.primary} text-xs py-2 px-3.5 shadow-xs`}
                      >
                        <Rocket size={13} />
                        <span>Open Workspace ➔</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ALTERNATIVE GRID CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebsites.map((site) => (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- card holds its own controls, so it cannot be role=button
              <div
                key={site.id}
                role="group"
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see above
                tabIndex={0}
                aria-label={`Open ${site.name}`}
                onClick={() => handleOpenWorkspace(site.slug)}
                onKeyDown={activateOnKey(() => handleOpenWorkspace(site.slug))}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {site.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {site.domain}
                        </p>
                      </div>
                    </div>

                    {site.status === 'live' ? (
                      <span className={CMS_THEME_CLASSES.badges.live}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Live
                      </span>
                    ) : (
                      <span className={CMS_THEME_CLASSES.badges.staging}>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Staging
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Modules
                      </p>
                      <p className="font-medium text-foreground mt-0.5 truncate">
                        {site.modules}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Content Size
                      </p>
                      <p className="font-medium text-foreground mt-0.5 font-mono">
                        {site.pagesCount} Pages
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Updated {site.lastUpdated}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenWorkspace(site.slug);
                    }}
                    className={CMS_THEME_CLASSES.buttons.primary}
                  >
                    <span>Open ➔</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCREEN 2: INTERACTIVE SITE CREATION WIZARD MODAL */}
      <CreateSiteWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={(slug) => {
          navigate(`/sites/${slug}`);
        }}
      />
    </div>
  );
};
