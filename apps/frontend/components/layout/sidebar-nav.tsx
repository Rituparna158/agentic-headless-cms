'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  primaryNavItems,
  secondaryNavItems,
} from '@/components/layout/nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function renderItem(item: (typeof primaryNavItems)[number]) {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
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
