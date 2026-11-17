'use client';

import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs } from '@repo/shared-ui';
import { ShieldCheck } from 'lucide-react';
import { RolesTab } from '@/components/roles-access/roles-tab';
import { UsersTab } from '@/components/roles-access/users-tab';
import { TokensTab } from '@/components/roles-access/tokens-tab';
import { MfaRequestsTab } from '@/components/roles-access/mfa-requests-tab';
import { useAuthStore } from '@/stores/auth-store';

const KNOWN_TABS = ['roles', 'users', 'tokens', 'mfa-requests'] as const;

function RolesAccessContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;
  const isAdminOrSupport =
    user?.roles?.some((role) =>
      ['admin', 'super_admin', 'support'].includes(role.toLowerCase()),
    ) || false;

  const tabs = useMemo(() => {
    const t: { label: string; id: string }[] = [];
    if (isAdmin) t.push({ label: 'Roles', id: 'roles' });
    t.push({ label: 'Users', id: 'users' });
    if (isAdmin) t.push({ label: 'API Tokens', id: 'tokens' });
    if (isAdminOrSupport) t.push({ label: 'MFA Requests', id: 'mfa-requests' });
    return t;
  }, [isAdmin, isAdminOrSupport]);

  const tabParam = searchParams.get('tab');

  const getResolvedTab = useCallback(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      return tabParam;
    }
    if (
      status !== 'authenticated' &&
      tabParam &&
      (KNOWN_TABS as readonly string[]).includes(tabParam)
    ) {
      return tabParam;
    }
    return tabs[0]?.id ?? (isAdmin ? 'roles' : 'users');
  }, [tabParam, tabs, status, isAdmin]);

  const [activeTab, setActiveTab] = useState(getResolvedTab);

  useEffect(() => {
    const resolved = getResolvedTab();
    if (resolved !== activeTab) {
      setActiveTab(resolved);
    }
  }, [getResolvedTab, activeTab]);

  const handleTabChange = (idx: number) => {
    const selectedTab = tabs[idx];
    if (!selectedTab) return;
    setActiveTab(selectedTab.id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', selectedTab.id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab),
  );

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Roles & Access
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage roles, granular permissions, user directory, and API
          authentication tokens.
        </p>
      </div>

      <div className="space-y-4">
        <Tabs
          key={tabs.map((t) => t.id).join('-')}
          options={tabs.map((t) => t.label)}
          selected={activeIndex}
          value={handleTabChange}
        />
        {activeTab === 'roles' && isAdmin && (
          <div className="space-y-4 min-h-[500px] md:h-[calc(100vh-16rem)]">
            <RolesTab />
          </div>
        )}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <UsersTab isAdmin={isAdmin} />
          </div>
        )}
        {activeTab === 'tokens' && isAdmin && (
          <div className="space-y-4">
            <TokensTab />
          </div>
        )}
        {activeTab === 'mfa-requests' && isAdminOrSupport && (
          <div className="space-y-4">
            <MfaRequestsTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RolesAccessPage() {
  return (
    <Suspense fallback={null}>
      <RolesAccessContent />
    </Suspense>
  );
}
