import React, { useState, useEffect } from 'react';
import { useSearchParams, useInRouterContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  KeyRound,
  Users,
  ScrollText,
  Fingerprint,
  Building2,
} from 'lucide-react';
import { accessApi } from '@/features/access/api/access.api';
import { MfaRequestsPage } from '@/features/access/pages/MfaRequestsPage';
import { UsersAccessPage } from '@/features/access/pages/UsersAccessPage';
import { RolesTab } from '@/features/access/components/RolesTab';
import { AuditLogPage } from '@/features/audit/pages/AuditLogPage';
import { PersonalMfaSettings } from './PersonalMfaSettings';

// Router-safe hook consumer
function SearchParamsBridge({
  onChange,
}: {
  onChange: (tab: string, setFn: (tab: string) => void) => void;
}) {
  const inRouter = useInRouterContext();
  if (!inRouter) return null;
  return <SearchParamsInner onChange={onChange} />;
}

function SearchParamsInner({
  onChange,
}: {
  onChange: (tab: string, setFn: (tab: string) => void) => void;
}) {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'mfa';

  useEffect(() => {
    onChange(tab, (newTab: string) => {
      setParams({ tab: newTab });
    });
  }, [tab, setParams, onChange]);

  return null;
}

function SafeLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
}

export const SecurityPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('mfa');
  const [setRouterTabFn, setSetRouterTabFn] = useState<
    ((tab: string) => void) | null
  >(null);
  const [rolesSubTab, setRolesSubTab] = useState<'members' | 'roles'>(
    'members',
  );

  // Query live count of pending MFA reset requests
  const { data: pendingMfaResponse } = useQuery({
    queryKey: ['mfa-requests', 'pending-count'],
    queryFn: () =>
      accessApi.getMfaRequests('pending', { page: 1, pageSize: 1 }),
    staleTime: 30 * 1000,
  });

  const pendingMfaCount =
    pendingMfaResponse?.data?.meta?.pagination?.total ?? 0;

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (setRouterTabFn) {
      setRouterTabFn(tab);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      <SearchParamsBridge
        onChange={(tab, setFn) => {
          setCurrentTab(tab);
          setSetRouterTabFn(() => setFn);
        }}
      />

      {/* Top Header - Blueprint Screen 13 */}
      <header className="px-8 py-5 border-b border-border bg-card/60 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <SafeLink
            to="/"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Building2 className="size-3.5 text-primary" />
            <span>Mindfire digital LLP</span>
          </SafeLink>
          <span>/</span>
          <span className="text-foreground font-medium flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" />
            <span>Security & Audit Controls</span>
          </span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Company Security & IT Ops</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Administrative command center for team MFA recovery, permission
              roles, and corporate audit logs.
            </p>
          </div>
        </div>

        {/* Blueprint Screen 13: Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none border-t border-border/40 mt-4">
          <button
            type="button"
            onClick={() => handleSelectTab('mfa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'mfa'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <KeyRound className="size-3.5" />
            <span>MFA Reset Requests</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                currentTab === 'mfa'
                  ? 'bg-background/20 text-background'
                  : pendingMfaCount > 0
                    ? 'bg-amber-500/20 text-amber-500 font-bold'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {pendingMfaCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'roles'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Users className="size-3.5" />
            <span>User Roles & Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'audit'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <ScrollText className="size-3.5" />
            <span>Audit Logs History</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('my_mfa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'my_mfa'
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Fingerprint className="size-3.5" />
            <span>My 2FA Settings</span>
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'mfa' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <MfaRequestsPage hideHeader />

            {/* Administrator Device Security Integration */}
            <div className="pt-6 border-t border-border/60">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground">
                  Administrator MFA Key & Authenticator Settings
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage your own administrator authentication credentials and
                  two-factor device pairing.
                </p>
              </div>
              <PersonalMfaSettings />
            </div>
          </div>
        )}

        {currentTab === 'roles' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Roles Sub-Switch: Team Members vs Roles Matrix */}
            <div className="px-8 py-3 border-b border-border bg-card/40 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRolesSubTab('members')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  rolesSubTab === 'members'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Team Members
              </button>
              <button
                type="button"
                onClick={() => setRolesSubTab('roles')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  rolesSubTab === 'roles'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Roles & Capabilities
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rolesSubTab === 'members' ? (
                <UsersAccessPage hideHeader />
              ) : (
                <div className="p-6">
                  <RolesTab />
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'audit' && (
          <div className="flex-1 overflow-y-auto">
            <AuditLogPage hideHeader />
          </div>
        )}

        {currentTab === 'my_mfa' && (
          <div className="flex-1 overflow-y-auto p-8">
            <PersonalMfaSettings />
          </div>
        )}
      </div>
    </div>
  );
};
