'use client';

import { useEffect, useState } from 'react';
import { Layers, Menu, X } from 'lucide-react';

import { Button, Drawer } from '@repo/shared-ui';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';

export function Topbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileNavOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setMobileNavOpen(false);
    }

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const hasRoles = mounted ? !!(user && user.roles.length > 0) : true;

  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/95 backdrop-blur-md px-3 sm:px-4">
      {/* Mobile Navigation Drawer */}
      <Drawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        position="left"
        size="min(280px, 85vw)"
        ariaLabel="Navigation menu"
        className="bg-zinc-950 text-zinc-300 border-r border-zinc-800 shadow-2xl overflow-hidden"
        bodyClassName="p-0 flex flex-col h-full overflow-hidden bg-zinc-950"
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-800 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Layers className="size-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              Headless CMS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 shrink-0"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-zinc-950">
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </Drawer>

      {/* Left: Mobile Navigation Button and Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {hasRoles && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
            <Layers className="size-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Headless CMS
          </span>
        </div>
      </div>
    </header>
  );
}
