'use client';

import { Suspense, useEffect, useState } from 'react';
import { Layers, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside className="bg-zinc-950 text-zinc-300 hidden w-64 shrink-0 border-r border-zinc-800 md:flex md:flex-col h-full overflow-hidden">
        <div className="h-14 border-b border-zinc-800 shrink-0" />
        <Suspense fallback={null}>
          <SidebarNav />
        </Suspense>
      </aside>
    );
  }

  // If authenticated but has no roles, do not render the sidebar
  if (status === 'authenticated' && user && user.roles.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(
        'bg-zinc-950 text-zinc-300 hidden shrink-0 border-r border-zinc-800 md:flex md:flex-col h-full overflow-hidden transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Brand Header & 3-line Collapse Toggle */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-zinc-800 shrink-0 overflow-hidden">
        <div
          className={cn(
            'flex items-center gap-2.5 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
            isCollapsed
              ? 'w-0 opacity-0 pointer-events-none'
              : 'w-auto opacity-100',
          )}
        >
          <div className="size-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Layers className="size-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            Headless CMS
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={cn(
            'p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 shrink-0',
            isCollapsed ? 'mx-auto' : 'ml-auto',
          )}
          aria-label={
            isCollapsed
              ? 'Expand sidebar navigation'
              : 'Collapse sidebar navigation'
          }
          aria-expanded={!isCollapsed}
        >
          <Menu className="size-4" />
        </button>
      </div>

      {/* Navigation & Profile */}
      <Suspense fallback={null}>
        <SidebarNav
          isCollapsed={isCollapsed}
          onExpand={() => setIsCollapsed(false)}
        />
      </Suspense>
    </aside>
  );
}
