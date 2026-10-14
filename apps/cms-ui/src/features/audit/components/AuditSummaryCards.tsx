import React from 'react';
import { Activity, FileText, Shield, Bot } from 'lucide-react';
import type { AuditLogRecord } from '../types/audit.types';

interface AuditSummaryCardsProps {
  logs: AuditLogRecord[];
  totalCount: number;
}

export const AuditSummaryCards: React.FC<AuditSummaryCardsProps> = ({
  logs,
  totalCount,
}) => {
  // Aggregate stats from visible logs / total
  const contentCount = logs.filter(
    (l) =>
      l.resourceType.toLowerCase() === 'content' ||
      l.resourceType.toLowerCase() === 'schema',
  ).length;

  const securityCount = logs.filter(
    (l) =>
      l.resourceType.toLowerCase() === 'user' ||
      l.resourceType.toLowerCase() === 'role' ||
      l.resourceType.toLowerCase() === 'auth' ||
      l.action.toLowerCase() === 'login',
  ).length;

  const agentCount = logs.filter(
    (l) => l.actorType === 'agent' || l.actorType === 'system',
  ).length;

  const cards = [
    {
      title: 'Total Recorded Events',
      value: totalCount.toLocaleString(),
      subtext: 'Audited actions across all resources',
      icon: Activity,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Content & Schema Changes',
      value: contentCount.toLocaleString(),
      subtext: `${contentCount} mutations in current view`,
      icon: FileText,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Security & Access Events',
      value: securityCount.toLocaleString(),
      subtext: `${securityCount} user/role/auth records`,
      icon: Shield,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'AI & Automated Operations',
      value: agentCount.toLocaleString(),
      subtext: `${agentCount} non-human system actions`,
      icon: Bot,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="flex flex-col justify-between p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs transition-all hover:border-border hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
