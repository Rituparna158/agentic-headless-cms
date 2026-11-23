import React, { useState } from 'react';
import { useSearchParams, useInRouterContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, KeyRound, Fingerprint, Building2 } from 'lucide-react';
import { accessApi } from '@/features/access/api/access.api';
import { MfaRequestsPage } from '@/features/access/pages/MfaRequestsPage';
import { PersonalMfaSettings } from './PersonalMfaSettings';

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

interface SecurityPageContentProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

const SecurityPageContent: React.FC<SecurityPageContentProps> = ({
  currentTab,
  onSelectTab,
}) => {
  // Query live count of pending MFA reset requests
  const { data: pendingMfaResponse } = useQuery({
    queryKey: ['mfa-requests', 'pending-count'],
    queryFn: () =>
      accessApi.getMfaRequests('pending', { page: 1, pageSize: 1 }),
    staleTime: 30 * 1000,
  });

  const pendingMfaCount =
    pendingMfaResponse?.data?.meta?.pagination?.total ?? 0;

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Top Header */}
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
              Administrative command center for team MFA recovery and personal
              two-factor credentials.
            </p>
          </div>
        </div>

        {/* Tab Navigation: MFA Reset Requests & My 2FA Settings */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none border-t border-border/40 mt-4">
          <button
            type="button"
            onClick={() => onSelectTab('mfa')}
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
            onClick={() => onSelectTab('my_mfa')}
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
          <div className="flex-1 overflow-y-auto p-6">
            <MfaRequestsPage hideHeader />
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

const SecurityPageWithRouter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const currentTab = tabParam === 'my_mfa' ? 'my_mfa' : 'mfa';

  const handleSelectTab = (tab: string) => {
    setSearchParams({ tab });
  };

  return (
    <SecurityPageContent
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
    />
  );
};

const SecurityPageStandalone: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('mfa');

  return (
    <SecurityPageContent currentTab={currentTab} onSelectTab={setCurrentTab} />
  );
};

export const SecurityPage: React.FC = () => {
  const inRouter = useInRouterContext();
  return inRouter ? <SecurityPageWithRouter /> : <SecurityPageStandalone />;
};
