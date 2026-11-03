import { CheckCircle2, Clock, FolderKanban, Users } from 'lucide-react';

import type {
  CollectionStats,
  CollectionsStatsCardsProps,
} from '../types/collections.types';

export type { CollectionStats, CollectionsStatsCardsProps };

export function CollectionsStatsCards({ stats }: CollectionsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Collections
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <span className="text-xs font-medium text-muted-foreground">
              ({stats.totalEntries} entries)
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <FolderKanban className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Published
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-[#2d6a4f] dark:text-emerald-400">
              {stats.published}
            </p>
            {stats.total > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-[#d8f3dc] text-[#1b4332] dark:bg-emerald-950/60 dark:text-emerald-400">
                {stats.publishRate}%
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Drafts
          </p>
          <p className="text-2xl font-bold text-[#8e6c1d] dark:text-amber-400">
            {stats.drafts}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-[5px] bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Contributors
          </p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">
              {stats.collaborators.length}
            </p>
            <div className="flex -space-x-1.5 overflow-hidden">
              {stats.collaborators.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary shadow-xs"
                  title={c.name}
                >
                  {c.initials}
                </div>
              ))}
              {stats.collaborators.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                  +{stats.collaborators.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
