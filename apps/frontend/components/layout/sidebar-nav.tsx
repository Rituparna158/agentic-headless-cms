'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  SearchIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  primaryNavItems,
  secondaryNavItems,
} from '@/components/layout/nav-items';
import { listSchemas } from '@/lib/api/schemas';
import { ScrollArea } from '@repo/shared-ui';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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

  const schemas = useMemo(() => schemasData?.data ?? [], [schemasData]);

  const activeTypeSlug = searchParams?.get('type');

  function renderItem(item: (typeof primaryNavItems)[number]) {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    // Special tree sub-menu logic for 'Content' navigation item
    if (item.href === '/content') {
      return (
        <div key={item.href} className="flex flex-col">
          <div
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer select-none',
              isContentPath
                ? 'bg-accent/70 text-accent-foreground font-semibold'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => {
              setIsContentExpanded((prev) => !prev);
              if (!isContentPath) {
                router.push('/content');
                onNavigate?.();
              }
            }}
          >
            <Link
              href="/content"
              onClick={(e) => {
                e.stopPropagation();
                setIsContentExpanded(true);
                onNavigate?.();
              }}
              className="flex items-center gap-2 flex-1"
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              {schemas.length > 0 && (
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs font-normal">
                  {schemas.length}
                </span>
              )}
              <button
                type="button"
                aria-label={
                  isContentExpanded
                    ? 'Collapse Content Types'
                    : 'Expand Content Types'
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setIsContentExpanded((prev) => !prev);
                }}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                {isContentExpanded ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Sub-tree Menu */}
          {isContentExpanded && (
            <div className="ml-2 mt-1 border-l-2 border-border/60 pl-2 flex flex-col gap-1 py-1">
              {/* Sidebar Search Bar */}
              <div className="relative my-1">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search types..."
                  value={schemaSearch}
                  onChange={(e) => setSchemaSearch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background pl-8 pr-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Ignix-UI ScrollArea for 10+ / 1000s of Content Types */}
              <ScrollArea
                className="max-h-64 pr-1"
                variant="thin"
                thumbColor="subtle"
              >
                <div className="space-y-1">
                  {schemas.length === 0 ? (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      No types found
                    </p>
                  ) : (
                    schemas.map((schema) => {
                      const isSchemaActive =
                        pathname === '/content' &&
                        (activeTypeSlug === schema.slug ||
                          (!activeTypeSlug &&
                            schemas[0]?.slug === schema.slug));

                      return (
                        <Link
                          key={schema.id}
                          href={`/content?type=${schema.slug}`}
                          onClick={onNavigate}
                          className={cn(
                            'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isSchemaActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileTextIcon className="size-4 shrink-0 opacity-80" />
                            <span className="truncate">{schema.name}</span>
                          </span>
                          <span
                            className={cn(
                              'text-xs font-normal shrink-0 ml-1.5',
                              isSchemaActive
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground/70',
                            )}
                          >
                            {schema.definition.fields.length}f
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
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
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4" />
          {item.label}
        </span>
        {item.badge ? (
          <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {primaryNavItems.map(renderItem)}
      <div className="bg-border my-2 h-px" />
      {secondaryNavItems.map(renderItem)}
    </nav>
  );
}
