'use client';

import { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Tabs,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shared-ui';
import { ShieldAlert } from 'lucide-react';
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

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground text-sm">
        Checking permissions...
      </div>
    );
  }

  if (!isAdmin && !isAdminOrSupport) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 bg-muted/10 h-full">
        <Card className="max-w-md text-center border-dashed">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <ShieldAlert className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Roles & Access management is restricted to administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your role does not have permission to manage roles, users, or API
              tokens.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Access</h1>
        <p className="text-muted-foreground">
          Manage roles, user access, and API tokens.
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
          <div className="space-y-4 h-[calc(100vh-14rem)]">
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
