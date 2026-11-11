'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDown,
  FileTextIcon,
  LogOut,
  ScrollText,
  SearchIcon,
  Settings,
  ShieldCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  primaryNavItems,
  secondaryNavItems,
} from '@/components/layout/nav-items';
import { listSchemas } from '@/lib/api/schemas';
import {
  Avatar,
  Badge,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@repo/shared-ui';
import { useAuthStore } from '@/stores/auth-store';

function initialsFor(name: string | null, email?: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (email || '?').slice(0, 2).toUpperCase();
}

export function SidebarNav({
  onNavigate,
  isCollapsed = false,
  onExpand,
}: {
  onNavigate?: () => void;
  isCollapsed?: boolean;
  onExpand?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isContentPath =
    pathname === '/content' || pathname.startsWith('/content/');
  const [isContentExpanded, setIsContentExpanded] = useState(isContentPath);
  const [schemaSearch, setSchemaSearch] = useState('');

  // Automatically sync expanded state when pathname changes
  useEffect(() => {
    if (isContentPath) {
      setIsContentExpanded(true);
    } else {
      setIsContentExpanded(false);
    }
  }, [pathname, isContentPath]);

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'Not signed in';

  const userRole = user?.roles?.[0]
    ? user.roles[0].replace(/_/g, ' ')
    : 'Member';

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore errors during logout
    } finally {
      router.push('/login');
      onNavigate?.();
    }
  }

  // Fetch all schemas for the tree sub-menu with server-side search query
  const { data: schemasData } = useQuery({
    queryKey: ['schemas', schemaSearch],
    queryFn: () =>
      listSchemas({
        search: schemaSearch.trim() ? schemaSearch.trim() : undefined,
        pageSize: 100,
      }),
    enabled: isContentExpanded,
    placeholderData: keepPreviousData,
  });

  const schemas = useMemo(() => {
    const list = schemasData?.data ?? [];
    if (isAdmin || !user?.permissions) return list;
    const permissions = user.permissions;
    return list.filter((s) =>
      permissions.some(
        (p) =>
          (p.schemaId === s.id || p.schemaId === '*' || !p.schemaId) &&
          ['read', 'create', 'update', '*'].includes(p.action),
      ),
    );
  }, [schemasData, isAdmin, user]);

  const activeTypeSlug = searchParams?.get('type');

  function renderItem(item: (typeof primaryNavItems)[number]) {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <div
          key={item.href}
          className={cn(
            'flex items-center rounded-md text-sm font-medium text-zinc-500 opacity-60 cursor-not-allowed select-none transition-colors',
            isCollapsed
              ? 'justify-center p-2 w-10 mx-auto'
              : 'justify-between px-3 py-2',
          )}
          title={`${item.label} (Coming Soon)`}
        >
          <div
            className={cn(
              'flex items-center gap-3 overflow-hidden',
              isCollapsed && 'gap-0 justify-center',
            )}
          >
            <Icon className="size-5 shrink-0 text-zinc-600" />
            <span
              className={cn(
                'truncate transition-all duration-300 ease-in-out',
                isCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none hidden'
                  : 'max-w-xs opacity-100',
              )}
            >
              {item.label}
            </span>
          </div>
          {!isCollapsed && item.disabledBadge ? (
            <Badge
              variant="outline"
              size="sm"
              className="text-[10px] uppercase font-semibold tracking-wider border-zinc-800 bg-zinc-900/60 text-zinc-500 shrink-0"
            >
              {item.disabledBadge}
            </Badge>
          ) : null}
        </div>
      );
    }

    // Special tree sub-menu logic for 'Content' navigation item
    if (item.href === '/content') {
      return (
        <div key={item.href} className="flex flex-col">
          <div
            className={cn(
              'group flex items-center rounded-md text-sm font-medium transition-colors select-none',
              isCollapsed
                ? 'w-10 mx-auto justify-center'
                : 'w-full justify-between',
              isContentPath
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
            )}
          >
            <button
              type="button"
              title={isCollapsed ? item.label : undefined}
              onClick={() => {
                if (isCollapsed) {
                  onExpand?.();
                  setIsContentExpanded(true);
                } else {
                  setIsContentExpanded((prev) => !prev);
                }
                if (!isContentPath) {
                  router.push('/content');
                }
              }}
              className={cn(
                'flex flex-1 min-w-0 items-center overflow-hidden text-left cursor-pointer rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600',
                isCollapsed ? 'justify-center p-2' : 'gap-3 pl-3 pr-2 py-2',
              )}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0 transition-colors',
                  isContentPath
                    ? 'text-zinc-100'
                    : 'text-zinc-400 group-hover:text-zinc-100',
                )}
              />
              <span
                className={cn(
                  'truncate transition-all duration-300 ease-in-out',
                  isCollapsed
                    ? 'max-w-0 opacity-0 pointer-events-none hidden'
                    : 'max-w-xs opacity-100',
                )}
              >
                {item.label}
              </span>
            </button>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 pl-1 pr-2 shrink-0">
                {schemas.length > 0 && (
                  <Badge
                    variant="outline"
                    size="sm"
                    className="font-medium border-zinc-700 bg-zinc-800 text-zinc-300 text-[11px] min-w-[26px] px-2.5 py-0.5 rounded-full tabular-nums"
                  >
                    {schemas.length}
                  </Badge>
                )}
                <button
                  type="button"
                  aria-expanded={isContentExpanded}
                  aria-controls="submenu-content-manager"
                  aria-label={
                    isContentExpanded
                      ? 'Collapse Content Types'
                      : 'Expand Content Types'
                  }
                  onClick={() => setIsContentExpanded((prev) => !prev)}
                  className="p-0.5 rounded text-zinc-400 group-hover:text-zinc-200 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600"
                >
                  {isContentExpanded ? (
                    <ChevronDownIcon className="size-4" />
                  ) : (
                    <ChevronRightIcon className="size-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Expanded Submenu matching CMS UI */}
          {!isCollapsed && isContentExpanded && (
            <div
              id="submenu-content-manager"
              role="region"
              aria-label="Content Types"
              className="mt-1 mb-2 space-y-1 animate-fade-in overflow-hidden"
            >
              {/* Type search input */}
              <div className="relative px-2 py-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search types..."
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900/80 pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
                />
              </div>

              {/* Submenu List */}
              <ul className="max-h-60 overflow-y-auto overflow-x-hidden space-y-1 py-0.5">
                {schemas.length === 0 ? (
                  <li className="py-2 text-center text-xs text-zinc-500">
                    No types found
                  </li>
                ) : (
                  schemas.map((schema) => {
                    const isSchemaActive =
                      pathname === '/content' &&
                      (activeTypeSlug === schema.slug ||
                        (!activeTypeSlug && schemas[0]?.slug === schema.slug));

                    return (
                      <li key={schema.id}>
                        <Link
                          href={`/content?type=${schema.slug}`}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center gap-2.5 pl-10 pr-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 truncate',
                            isSchemaActive
                              ? 'text-zinc-100 bg-zinc-800/50 font-medium'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30',
                          )}
                        >
                          <FileTextIcon
                            className={cn(
                              'size-3.5 shrink-0 transition-colors',
                              isSchemaActive
                                ? 'text-zinc-100'
                                : 'text-zinc-500',
                            )}
                          />
                          <span className="truncate">{schema.name}</span>
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => {
          setIsContentExpanded(false);
          onNavigate?.();
        }}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600',
          isCollapsed
            ? 'justify-center p-2 w-10 mx-auto'
            : 'justify-between px-3 py-2',
          isActive
            ? 'bg-zinc-800 text-zinc-100 font-medium'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 overflow-hidden',
            isCollapsed && 'gap-0 justify-center',
          )}
        >
          <Icon
            className={cn(
              'size-5 shrink-0 transition-colors',
              isActive
                ? 'text-zinc-100'
                : 'text-zinc-400 group-hover:text-zinc-100',
            )}
          />
          <span
            className={cn(
              'truncate transition-all duration-300 ease-in-out',
              isCollapsed
                ? 'max-w-0 opacity-0 pointer-events-none hidden'
                : 'max-w-xs opacity-100',
            )}
          >
            {item.label}
          </span>
        </div>
        {!isCollapsed && item.badge ? (
          <Badge
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-800 text-zinc-300 text-xs px-1.5 py-0 shrink-0"
          >
            {item.badge}
          </Badge>
        ) : null}
      </Link>
    );
  }

  const visibleSecondaryNavItems = useMemo(() => {
    return secondaryNavItems.filter((item) => {
      if (
        item.href === '/audit-log' ||
        item.href === '/roles-access' ||
        item.href === '/webhooks'
      ) {
        if (status === 'loading' || status === 'idle') {
          return true;
        }
        return isAdmin;
      }
      return true;
    });
  }, [isAdmin, status]);

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 overflow-hidden w-full">
      <nav
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden space-y-1',
          isCollapsed ? 'p-2' : 'p-3',
        )}
      >
        {primaryNavItems.map(renderItem)}
        <div
          className={cn('bg-zinc-800 my-2 h-px', isCollapsed ? 'mx-2' : '')}
        />
        {visibleSecondaryNavItems.map(renderItem)}
      </nav>

      {/* Pinned User Profile Footer */}
      <div
        className={cn(
          'border-t border-zinc-800 shrink-0 w-full overflow-hidden transition-all duration-300 ease-in-out',
          isCollapsed ? 'p-2' : 'p-3',
        )}
      >
        <Dropdown
          align={isCollapsed ? 'center' : 'start'}
          side={isCollapsed ? 'right' : 'top'}
          sideOffset={isCollapsed ? 12 : 8}
          bg="transparent"
          className="dark w-56 p-1.5 shadow-2xl border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-lg mb-1 outline-none overflow-x-hidden"
          trigger={
            <button
              type="button"
              className={cn(
                'flex items-center rounded-md transition-colors cursor-pointer text-left group focus:outline-none focus:ring-2 focus:ring-zinc-600',
                isCollapsed
                  ? 'justify-center p-1.5 w-10 mx-auto'
                  : 'w-full justify-between gap-2.5 px-3 py-2',
                'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
                'data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-100 font-medium',
              )}
              title={isCollapsed ? displayName : undefined}
              aria-label={`User account: ${displayName}`}
            >
              <div
                className={cn(
                  'flex items-center gap-2.5 min-w-0 overflow-hidden',
                  isCollapsed && 'gap-0 justify-center',
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    className={cn(
                      'ring-1 ring-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-semibold shrink-0',
                      isCollapsed ? 'size-8' : 'size-7',
                    )}
                    letters={initialsFor(displayName, user?.email)}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 overflow-hidden">
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-zinc-100 group-data-[state=open]:text-zinc-100 leading-tight truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 group-data-[state=open]:text-zinc-400 capitalize truncate mt-0.5">
                      {userRole}
                    </span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronsUpDown className="size-4 text-zinc-500 group-hover:text-zinc-300 group-data-[state=open]:text-zinc-200 shrink-0 transition-colors" />
              )}
            </button>
          }
        >
          {/* Profile summary header */}
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
            <p className="text-xs font-medium text-zinc-200 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {user?.email}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge
                variant="outline"
                size="sm"
                className="text-[10px] font-mono capitalize px-1.5 py-0 border-zinc-700 bg-zinc-800 text-zinc-300"
              >
                {userRole}
              </Badge>
            </div>
          </div>

          <DropdownItem
            onSelect={() => {
              router.push('/settings');
              onNavigate?.();
            }}
            className="text-xs py-2 px-2.5 gap-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:text-zinc-100 data-[highlighted]:bg-zinc-800/50 data-[highlighted]:text-zinc-100 rounded-md transition-colors cursor-pointer select-none outline-none overflow-hidden"
          >
            <Settings className="size-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Workspace Settings</span>
          </DropdownItem>

          {isAdmin && (
            <DropdownItem
              onSelect={() => {
                router.push('/roles-access');
                onNavigate?.();
              }}
              className="text-xs py-2 px-2.5 gap-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:text-zinc-100 data-[highlighted]:bg-zinc-800/50 data-[highlighted]:text-zinc-100 rounded-md transition-colors cursor-pointer select-none outline-none overflow-hidden"
            >
              <ShieldCheck className="size-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Roles & Access</span>
            </DropdownItem>
          )}

          <DropdownItem
            onSelect={() => {
              router.push('/audit-log');
              onNavigate?.();
            }}
            className="text-xs py-2 px-2.5 gap-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:text-zinc-100 data-[highlighted]:bg-zinc-800/50 data-[highlighted]:text-zinc-100 rounded-md transition-colors cursor-pointer select-none outline-none overflow-hidden"
          >
            <ScrollText className="size-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Audit Trail</span>
          </DropdownItem>

          <DropdownSeparator className="mx-0 my-1 h-px bg-zinc-800 border-0" />

          <DropdownItem
            onSelect={handleLogout}
            className="text-xs py-2 px-2.5 gap-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300 rounded-md transition-colors cursor-pointer select-none outline-none overflow-hidden"
          >
            <LogOut className="size-3.5 shrink-0" />
            <span className="truncate">Log out</span>
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
}
