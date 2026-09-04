'use client';

import { Suspense, useEffect, useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside className="bg-background hidden w-64 shrink-0 border-r md:flex md:flex-col">
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
    <aside className="bg-background hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <Suspense fallback={null}>
        <SidebarNav />
      </Suspense>
    </aside>
  );
}
