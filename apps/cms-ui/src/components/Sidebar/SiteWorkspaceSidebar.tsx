import { isPageEntry } from '@/lib/entryKinds';
import { useState, useMemo } from 'react';
import { NavLink, Link, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  FileText,
  Files,
  Image as ImageIcon,
  Compass,
  Settings,
  Puzzle,
  Palette,
  Lock,
  LogOut,
  Loader2,
  Menu,
  Layers,
  Inbox,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  postsApi,
  extractArrayPayload,
} from '../../features/posts/api/posts.api';
import type { ContentCollectionMeta, PageEntry } from '@/types/content.types';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useLogoutMutation } from '../../features/auth/hooks/useAuthMutations';
import { isUserAdmin } from '../../features/access/constants/access.constants';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCan } from '@/hooks/useCan';

export const SiteWorkspaceSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { siteId = '' } = useParams<{ siteId: string }>();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const can = useCan(siteId);
  const canContent = can(['manage_content', 'publish_content']);
  const canMedia = can(['manage_media', 'manage_content']);
  const canMenus = can('manage_appearance');
  const canSettings = can('manage_settings');

  const { sidebar: sbClasses, badges: badgeClasses } = CMS_THEME_CLASSES;

  // Role Gating: Developer Studio is role-gated to Admin and Developer
  const isSuperAdmin = isUserAdmin(user?.roles);
  const isDeveloperOrAdmin =
    isSuperAdmin ||
    user?.roles?.some((role: string) =>
      ['admin', 'super_admin', 'developer', 'designer'].includes(
        role.toLowerCase(),
      ),
    );

  // Fetch site info from collections
  const { data: rawCollections } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });

  const collections = useMemo(
    () => extractArrayPayload<ContentCollectionMeta>(rawCollections),
    [rawCollections],
  );

  const activeSite = useMemo(() => {
    if (!collections.length || !siteId) return null;
    return (
      collections.find((c) => c.slug === siteId || c.id === siteId) || null
    );
  }, [collections, siteId]);

  // Fetch pages count for this site
  const currentSlug = activeSite?.slug || siteId;
  const { data: rawPages } = useQuery({
    queryKey: ['collection-pages', currentSlug],
    queryFn: () => postsApi.listPagesForCollection(currentSlug),
    enabled: Boolean(currentSlug),
    staleTime: 5 * 60 * 1000,
  });

  const pages = useMemo(
    () => extractArrayPayload<PageEntry>(rawPages),
    [rawPages],
  );

  const siteName =
    activeSite?.name ||
    siteId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Website Workspace';
  const siteDomain =
    (activeSite?.metadata as Record<string, string>)?.domain ||
    (activeSite?.slug ? `${activeSite.slug}.acme.com` : 'acme.com');
  const isStaging = activeSite?.status === 'staging';

  // Counted from the real entries: menus, tags and visitor messages share
  // the collection but are neither pages nor posts.
  const postsCount = pages.filter((p) => p.data?.kind === 'post').length;
  const pagesCount = pages.filter(isPageEntry).length;

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={`${sbClasses.aside} ${isCollapsed ? 'w-[72px]' : 'w-56'}`}
      aria-label="Site Workspace Navigation"
    >
      {/* Header: Back Button & Collapse Toggle */}
      <div className={sbClasses.topBar}>
        <Link
          to="/"
          className={`${sbClasses.backButton} ${isCollapsed ? 'hidden' : 'flex'}`}
          title="Return to All Websites Directory"
        >
          <ArrowLeft size={14} className="shrink-0 text-[#A1A1AA]" />
          <span className="truncate">Back to All Websites</span>
        </Link>
        <button
          type="button"
          onClick={toggleCollapse}
          className={sbClasses.collapseToggle}
          aria-label={
            isCollapsed
              ? 'Expand workspace sidebar'
              : 'Collapse workspace sidebar'
          }
          aria-expanded={!isCollapsed}
          aria-controls="workspace-nav"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Active Site Context Card */}
      {!isCollapsed && (
        <div className={sbClasses.siteCard}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="p-1 rounded bg-zinc-800/70 text-zinc-300 border border-zinc-700/60 shrink-0">
                <Globe size={13} />
              </span>
              <span className={sbClasses.siteTitle}>{siteName}</span>
            </div>
            <a
              href={`https://${siteDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A1A1AA] hover:text-white transition-colors p-1 rounded hover:bg-[#27272A]/70 shrink-0"
              title="Open Live Website in New Tab"
            >
              <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#A1A1AA] pl-6">
            <span className={sbClasses.siteDomain}>{siteDomain}</span>
            <span className="text-zinc-600">•</span>
            {isStaging ? (
              <span className={badgeClasses.staging}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Staging
              </span>
            ) : (
              <span className={badgeClasses.live}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav
        id="workspace-nav"
        aria-label="Workspace Sections"
        className="flex-1 overflow-y-auto py-3 px-3 space-y-5 custom-scrollbar"
      >
        {/* GROUP 1: CONTENT STUDIO */}
        <div>
          {!isCollapsed && (canContent || canMedia) && (
            <p className={sbClasses.sectionHeader}>Content Studio</p>
          )}
          <ul className="space-y-1">
            {canContent && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/posts`}
                  className={({ isActive }) =>
                    isActive ||
                    location.pathname.startsWith(`/sites/${siteId}/posts`)
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Universal Posts Publishing Hub"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && <span className="truncate">Posts</span>}
                  </div>
                  {!isCollapsed && postsCount > 0 && (
                    <span className={sbClasses.counterBadge}>{postsCount}</span>
                  )}
                </NavLink>
              </li>
            )}
            {canContent && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/pages`}
                  className={({ isActive }) =>
                    isActive ||
                    location.pathname.startsWith(`/sites/${siteId}/pages`)
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Pages & Sitemap Directory"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Files size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && <span className="truncate">Pages</span>}
                  </div>
                  {!isCollapsed && pagesCount > 0 && (
                    <span className={sbClasses.counterBadge}>{pagesCount}</span>
                  )}
                </NavLink>
              </li>
            )}
            {canContent && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/inbox`}
                  className={({ isActive }) =>
                    isActive ||
                    location.pathname.startsWith(`/sites/${siteId}/inbox`)
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Form messages and comments"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Inbox size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && <span className="truncate">Inbox</span>}
                  </div>
                </NavLink>
              </li>
            )}
            {canMedia && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/media`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Central Media Library"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ImageIcon size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Central Media</span>
                    )}
                  </div>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* GROUP 2: SITE SETUP */}
        <div>
          {!isCollapsed && (canMenus || canSettings) && (
            <p className={sbClasses.sectionHeader}>Site Setup</p>
          )}
          <ul className="space-y-1">
            {canMenus && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/menus`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Navigation Menus Builder"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Compass size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Navigation Menus</span>
                    )}
                  </div>
                </NavLink>
              </li>
            )}
            {canMenus && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/design`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Tags, shared sections and redirects"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Shared content</span>
                    )}
                  </div>
                </NavLink>
              </li>
            )}
            {canSettings && (
              <li>
                <NavLink
                  to={`/sites/${siteId}/settings`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Site Settings & Feature Toggles"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Settings size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Site Settings</span>
                    )}
                  </div>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

        {/* GROUP 3: DEVELOPER STUDIO (Role-Gated) */}
        {isDeveloperOrAdmin && (
          <div className="pt-2 border-t border-zinc-800/60">
            {!isCollapsed && (
              <p className={sbClasses.devSectionHeader}>
                <Lock size={11} className="text-zinc-500" />
                <span>Developer Studio</span>
              </p>
            )}
            <ul className="space-y-1">
              <li>
                <NavLink
                  to={`/sites/${siteId}/developer/schemas`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="Schema Builder"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Puzzle size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Schema Builder</span>
                    )}
                  </div>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`/sites/${siteId}/developer/templates`}
                  className={({ isActive }) =>
                    isActive
                      ? sbClasses.navItemActive
                      : sbClasses.navItemInactive
                  }
                  title="GrapesJS Layout Templates"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Palette size={17} className="shrink-0 text-zinc-400" />
                    {!isCollapsed && (
                      <span className="truncate">Layout Templates</span>
                    )}
                  </div>
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* Footer / User Area */}
      <div className={sbClasses.footer}>
        {!isCollapsed && user && (
          <div className={sbClasses.userRow}>
            <div className={sbClasses.userAvatar}>
              {user.email ? user.email.slice(0, 2) : 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {user.email}
              </p>
              <p className="text-[10px] text-[#A1A1AA] capitalize truncate">
                {user.roles?.join(', ') || 'Editor'}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut}
          aria-label="Logout"
          className={sbClasses.logoutButton}
        >
          {isLoggingOut ? (
            <Loader2 size={16} className="shrink-0 animate-spin" />
          ) : (
            <LogOut size={16} className="shrink-0" />
          )}
          {!isCollapsed && (
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
