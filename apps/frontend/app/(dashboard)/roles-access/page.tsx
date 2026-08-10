'use client';

import { useState, useMemo } from 'react';
import { Tabs } from '@repo/shared-ui';
import { RolesTab } from '@/components/roles-access/roles-tab';
import { UsersTab } from '@/components/roles-access/users-tab';
import { TokensTab } from '@/components/roles-access/tokens-tab';
import { MfaRequestsTab } from '@/components/roles-access/mfa-requests-tab';
import { useAuthStore } from '@/stores/auth-store';

export default function RolesAccessPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin =
    user?.roles.some((role) => role.toLowerCase() === 'admin') || false;
  const isAdminOrSupport =
    user?.roles.some((role) =>
      ['admin', 'support'].includes(role.toLowerCase()),
    ) || false;

  const tabs = useMemo(() => {
    const t = [];
    if (isAdmin) t.push({ label: 'Roles', id: 'roles' });
    t.push({ label: 'Users', id: 'users' });
    if (isAdmin) t.push({ label: 'API Tokens', id: 'tokens' });
    if (isAdminOrSupport) t.push({ label: 'MFA Requests', id: 'mfa-requests' });
    return t;
  }, [isAdmin, isAdminOrSupport]);

  const [activeTab, setActiveTab] = useState(isAdmin ? 'roles' : 'users');
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab),
  );

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
          options={tabs.map((t) => t.label)}
          selected={activeIndex}
          value={(idx) => {
            if (tabs[idx]) setActiveTab(tabs[idx].id);
          }}
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
