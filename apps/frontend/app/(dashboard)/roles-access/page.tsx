'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Access</h1>
        <p className="text-muted-foreground">
          Manage roles, user access, and API tokens.
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? 'roles' : 'users'} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="roles">Roles</TabsTrigger>}
          <TabsTrigger value="users">Users</TabsTrigger>
          {isAdmin && <TabsTrigger value="tokens">API Tokens</TabsTrigger>}
          {isAdminOrSupport && (
            <TabsTrigger value="mfa-requests">MFA Requests</TabsTrigger>
          )}
        </TabsList>
        {isAdmin && (
          <TabsContent
            value="roles"
            className="space-y-4 h-[calc(100vh-14rem)]"
          >
            <RolesTab />
          </TabsContent>
        )}
        <TabsContent value="users" className="space-y-4">
          <UsersTab isAdmin={isAdmin} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="tokens" className="space-y-4">
            <TokensTab />
          </TabsContent>
        )}
        {isAdminOrSupport && (
          <TabsContent value="mfa-requests" className="space-y-4">
            <MfaRequestsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
