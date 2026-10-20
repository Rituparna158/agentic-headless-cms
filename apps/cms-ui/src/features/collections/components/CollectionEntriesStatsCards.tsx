import { CheckCircle2, Clock, Files, Boxes } from 'lucide-react';

import type {
  EntryStats,
  CollectionEntriesStatsCardsProps,
} from '../types/collections.types';

export type { EntryStats, CollectionEntriesStatsCardsProps };

export function CollectionEntriesStatsCards({
  stats,
}: CollectionEntriesStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Pages
          </p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <Files className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Published
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-emerald-400">
              {stats.published}
            </p>
            {stats.total > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {stats.publishRate}%
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Drafts
          </p>
          <p className="text-2xl font-bold text-amber-400">{stats.drafts}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pages with Schemas
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-indigo-400">
              {stats.pagesWithSchemasCount}
            </p>
            <span className="text-xs font-mono text-zinc-500">
              / {stats.total}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
          <Boxes className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
