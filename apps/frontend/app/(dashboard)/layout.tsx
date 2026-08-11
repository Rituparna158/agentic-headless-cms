import type { ReactNode } from 'react';
import { AuthHydrator } from '@/components/layout/auth-hydrator';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { RoleGuard } from '@/components/layout/role-guard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh flex-col">
      <AuthHydrator />
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <RoleGuard>{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
