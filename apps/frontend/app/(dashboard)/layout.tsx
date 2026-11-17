import type { ReactNode } from 'react';
import { AuthHydrator } from '@/components/layout/auth-hydrator';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { RoleGuard } from '@/components/layout/role-guard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <AuthHydrator />
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8">
          <RoleGuard>{children}</RoleGuard>
        </main>
      </div>
    </div>
  );
}
