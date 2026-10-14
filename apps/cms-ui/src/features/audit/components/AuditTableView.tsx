import React, { useState } from 'react';
import {
  Copy,
  Check,
  Eye,
  Bot,
  User,
  Cpu,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { AuditLogRecord } from '../types/audit.types';
import {
  generateHumanReadableSummary,
  computeStateDiff,
} from '../utils/audit-formatters';

interface AuditTableViewProps {
  logs: AuditLogRecord[];
  onSelectLog: (log: AuditLogRecord) => void;
}

export const AuditTableView: React.FC<AuditTableViewProps> = ({
  logs,
  onSelectLog,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (logs.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-border/60 bg-card/20">
        <Sparkles className="mx-auto size-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          No Audit Logs Found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
          No records match your filter criteria. Try resetting or adjusting the
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Resource & Target</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Payload Delta</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {logs.map((log) => {
              const summary = generateHumanReadableSummary(log);
              const diffs = computeStateDiff(log.beforeState, log.afterState);
              const isCopied = copiedId === log.resourceId;

              return (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  {/* Action Column */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${summary.actionBadgeColor}`}
                    >
                      <span className="size-1.5 rounded-full bg-current opacity-70" />
                      {summary.actionDisplayName}
                    </span>
                  </td>

                  {/* Resource Column */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <FileText className="size-3.5 text-primary shrink-0" />
                        <span
                          className="truncate max-w-[200px]"
                          title={summary.resourceDisplayName}
                        >
                          {summary.resourceDisplayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-0.5">
                        <span className="capitalize">{log.resourceType}</span>
                        <span>•</span>
                        <span
                          className="truncate max-w-[120px]"
                          title={log.resourceId}
                        >
                          {log.resourceId.slice(0, 12)}...
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(log.resourceId, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity p-0.5 rounded"
                          title="Copy Resource ID"
                        >
                          {isCopied ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Actor Column */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {log.actorType === 'agent' ? (
                          <Bot className="size-3.5 text-purple-500" />
                        ) : log.actorType === 'system' ? (
                          <Cpu className="size-3.5 text-zinc-400" />
                        ) : (
                          <User className="size-3.5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-foreground text-xs truncate max-w-[160px]">
                          {summary.actorDisplayName}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {log.actorType}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Timestamp Column */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {summary.timeAgo}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground/60" />
                        {summary.formattedDate}
                      </span>
                    </div>
                  </td>

                  {/* Payload Delta */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {diffs.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-muted text-muted-foreground border border-border/40">
                        <span>{diffs.length} fields modified</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">
                        No state diff
                      </span>
                    )}
                  </td>

                  {/* Action Column */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectLog(log)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      title="Inspect full details"
                    >
                      <Eye className="size-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
