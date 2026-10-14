import type {
  AuditLogRecord,
  HumanReadableSummary,
  DiffEntry,
} from '../types/audit.types';

export function getActorDisplayName(log: AuditLogRecord): string {
  if (log.actorType === 'agent') {
    return log.actorAgentId
      ? `AI Agent (${log.actorAgentId.slice(0, 8)})`
      : 'Autonomous AI Agent';
  }
  if (log.actorType === 'system') {
    return 'Automated System';
  }
  if (log.actorFirstName || log.actorLastName) {
    return `${log.actorFirstName || ''} ${log.actorLastName || ''}`.trim();
  }
  if (log.actorEmail) {
    return log.actorEmail;
  }
  if (log.actorUserId) {
    return `User (${log.actorUserId.slice(0, 8)})`;
  }
  return 'System Administrator';
}

export function getActorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'SY';
}

export function getResourceTypeDisplayName(resourceType: string): string {
  const map: Record<string, string> = {
    content: 'Content Entry',
    schema: 'Content Schema',
    role: 'Access Role',
    user: 'User Profile',
    locale: 'Language / Locale',
    webhook: 'Webhook Endpoint',
    media: 'Media Asset',
    auth: 'Authentication',
  };
  return (
    map[resourceType.toLowerCase()] ||
    resourceType.charAt(0).toUpperCase() + resourceType.slice(1)
  );
}

export function getResourceDisplayName(log: AuditLogRecord): string {
  const state = (log.afterState || log.beforeState || {}) as Record<
    string,
    unknown
  >;
  const nameCandidate =
    state.title ||
    state.name ||
    state.slug ||
    state.label ||
    state.email ||
    state.filename ||
    state.url;

  if (typeof nameCandidate === 'string' && nameCandidate.trim()) {
    return nameCandidate.trim();
  }
  return log.resourceId
    ? `${log.resourceType} #${log.resourceId.slice(0, 8)}`
    : log.resourceType;
}

export function getActionMeta(action: string): {
  displayName: string;
  badgeVariant: HumanReadableSummary['actionBadgeVariant'];
  badgeColor: string;
} {
  const norm = action.toLowerCase();
  switch (norm) {
    case 'create':
      return {
        displayName: 'Created',
        badgeVariant: 'success',
        badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      };
    case 'update':
      return {
        displayName: 'Updated',
        badgeVariant: 'info',
        badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      };
    case 'publish':
      return {
        displayName: 'Published',
        badgeVariant: 'purple',
        badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      };
    case 'unpublish':
      return {
        displayName: 'Unpublished',
        badgeVariant: 'warning',
        badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      };
    case 'delete':
      return {
        displayName: 'Deleted',
        badgeVariant: 'destructive',
        badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      };
    case 'rollback':
      return {
        displayName: 'Rolled Back',
        badgeVariant: 'warning',
        badgeColor: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      };
    case 'login':
      return {
        displayName: 'Logged In',
        badgeVariant: 'secondary',
        badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      };
    case 'schema_change':
      return {
        displayName: 'Schema Changed',
        badgeVariant: 'purple',
        badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      };
    default:
      return {
        displayName: action.toUpperCase(),
        badgeVariant: 'default',
        badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      };
  }
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatFullDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function extractKeyChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  const changes: string[] = [];
  if (!before && !after) return changes;

  const b = before || {};
  const a = after || {};

  // Check status transition
  if (
    b.status !== undefined &&
    a.status !== undefined &&
    b.status !== a.status
  ) {
    changes.push(
      `Status changed from "${String(b.status)}" to "${String(a.status)}"`,
    );
  }

  // Check title/name alteration
  const oldTitle = b.title || b.name;
  const newTitle = a.title || a.name;
  if (oldTitle && newTitle && oldTitle !== newTitle) {
    changes.push(`Renamed from "${String(oldTitle)}" to "${String(newTitle)}"`);
  }

  const allKeys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  const ignoredKeys = new Set([
    'updatedAt',
    'createdAt',
    'version',
    'id',
    'applicationId',
  ]);
  const relevantKeys = allKeys.filter((k) => !ignoredKeys.has(k));

  const addedKeys = relevantKeys.filter((k) => !(k in b) && k in a);
  const removedKeys = relevantKeys.filter((k) => k in b && !(k in a));
  const modifiedKeys = relevantKeys.filter(
    (k) =>
      k in b &&
      k in a &&
      JSON.stringify(b[k]) !== JSON.stringify(a[k]) &&
      k !== 'status' &&
      k !== 'title' &&
      k !== 'name',
  );

  if (addedKeys.length > 0) {
    const list =
      addedKeys.slice(0, 3).join(', ') +
      (addedKeys.length > 3 ? ` +${addedKeys.length - 3} more` : '');
    changes.push(`Added fields: ${list}`);
  }

  if (removedKeys.length > 0) {
    const list =
      removedKeys.slice(0, 3).join(', ') +
      (removedKeys.length > 3 ? ` +${removedKeys.length - 3} more` : '');
    changes.push(`Removed fields: ${list}`);
  }

  if (modifiedKeys.length > 0) {
    const list =
      modifiedKeys.slice(0, 4).join(', ') +
      (modifiedKeys.length > 4 ? ` +${modifiedKeys.length - 4} more` : '');
    changes.push(`Modified fields: ${list}`);
  }

  return changes;
}

export function computeStateDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const b = before || {};
  const a = after || {};

  const allKeys = Array.from(
    new Set([...Object.keys(b), ...Object.keys(a)]),
  ).sort();

  for (const key of allKeys) {
    const inBefore = key in b;
    const inAfter = key in a;

    if (!inBefore && inAfter) {
      entries.push({
        path: key,
        changeType: 'added',
        afterValue: a[key],
      });
    } else if (inBefore && !inAfter) {
      entries.push({
        path: key,
        changeType: 'removed',
        beforeValue: b[key],
      });
    } else if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      entries.push({
        path: key,
        changeType: 'modified',
        beforeValue: b[key],
        afterValue: a[key],
      });
    }
  }

  return entries;
}

export function generateHumanReadableSummary(
  log: AuditLogRecord,
): HumanReadableSummary {
  const actorDisplayName = getActorDisplayName(log);
  const actorInitials = getActorInitials(actorDisplayName);
  const resourceTypeDisplayName = getResourceTypeDisplayName(log.resourceType);
  const resourceDisplayName = getResourceDisplayName(log);
  const actionMeta = getActionMeta(log.action);
  const timeAgo = formatRelativeTime(log.timestamp);
  const formattedDate = formatFullDate(log.timestamp);
  const keyChanges = extractKeyChanges(log.beforeState, log.afterState);

  // Formulate natural headline
  let headline = '';
  switch (log.action.toLowerCase()) {
    case 'create':
      headline = `${actorDisplayName} created ${resourceTypeDisplayName.toLowerCase()} "${resourceDisplayName}"`;
      break;
    case 'publish':
      headline = `${actorDisplayName} published live "${resourceDisplayName}"`;
      break;
    case 'unpublish':
      headline = `${actorDisplayName} unpublished "${resourceDisplayName}" to draft`;
      break;
    case 'delete':
      headline = `${actorDisplayName} deleted ${resourceTypeDisplayName.toLowerCase()} "${resourceDisplayName}"`;
      break;
    case 'rollback':
      headline = `${actorDisplayName} rolled back "${resourceDisplayName}" to a prior version`;
      break;
    case 'schema_change':
      headline = `${actorDisplayName} altered the schema for "${resourceDisplayName}"`;
      break;
    case 'login':
      headline = `${actorDisplayName} successfully logged into the CMS`;
      break;
    case 'update':
    default:
      headline = `${actorDisplayName} updated ${resourceTypeDisplayName.toLowerCase()} "${resourceDisplayName}"`;
      break;
  }

  const subtext = `${resourceTypeDisplayName} • ID: ${log.resourceId}`;

  return {
    headline,
    subtext,
    actorDisplayName,
    actorInitials,
    actorType: log.actorType,
    resourceTypeDisplayName,
    resourceDisplayName,
    actionDisplayName: actionMeta.displayName,
    actionBadgeColor: actionMeta.badgeColor,
    actionBadgeVariant: actionMeta.badgeVariant,
    timeAgo,
    formattedDate,
    keyChanges,
  };
}
