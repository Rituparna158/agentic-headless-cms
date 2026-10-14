import { describe, it, expect } from 'vitest';
import {
  getActorDisplayName,
  getActorInitials,
  getResourceTypeDisplayName,
  getResourceDisplayName,
  getActionMeta,
  computeStateDiff,
  generateHumanReadableSummary,
} from '../../../../src/features/audit/utils/audit-formatters';
import type { AuditLogRecord } from '../../../../src/features/audit/types/audit.types';

describe('audit-formatters', () => {
  const baseLog: AuditLogRecord = {
    id: 'log-12345678-abcd',
    applicationId: 'app-default',
    actorType: 'user',
    actorUserId: 'usr-12345678',
    actorEmail: 'admin@example.com',
    actorFirstName: 'Admin',
    actorLastName: 'User',
    action: 'publish',
    resourceType: 'content',
    resourceId: 'entry-98765432',
    timestamp: '2026-10-14T10:00:00.000Z',
    beforeState: { status: 'draft', title: 'Summer Campaign' },
    afterState: { status: 'published', title: 'Summer Campaign' },
    context: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
  };

  it('formats human readable actor display name and initials', () => {
    expect(getActorDisplayName(baseLog)).toBe('Admin User');
    expect(getActorInitials('Admin User')).toBe('AU');

    const agentLog: AuditLogRecord = {
      ...baseLog,
      actorType: 'agent',
      actorAgentId: 'agent-auto-writer',
    };
    expect(getActorDisplayName(agentLog)).toContain('AI Agent');

    const systemLog: AuditLogRecord = {
      ...baseLog,
      actorType: 'system',
    };
    expect(getActorDisplayName(systemLog)).toBe('Automated System');
  });

  it('formats resource names accurately', () => {
    expect(getResourceTypeDisplayName('content')).toBe('Content Entry');
    expect(getResourceTypeDisplayName('schema')).toBe('Content Schema');
    expect(getResourceDisplayName(baseLog)).toBe('Summer Campaign');
  });

  it('determines action meta badges and labels', () => {
    const publishMeta = getActionMeta('publish');
    expect(publishMeta.displayName).toBe('Published');
    expect(publishMeta.badgeVariant).toBe('purple');

    const createMeta = getActionMeta('create');
    expect(createMeta.displayName).toBe('Created');
    expect(createMeta.badgeVariant).toBe('success');
  });

  it('computes state diff accurately', () => {
    const diffs = computeStateDiff(baseLog.beforeState, baseLog.afterState);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.path).toBe('status');
    expect(diffs[0]!.changeType).toBe('modified');
    expect(diffs[0]!.beforeValue).toBe('draft');
    expect(diffs[0]!.afterValue).toBe('published');
  });

  it('generates human readable summary with headline and details', () => {
    const summary = generateHumanReadableSummary(baseLog);
    expect(summary.headline).toContain('Admin User');
    expect(summary.headline).toContain('published live "Summer Campaign"');
    expect(summary.actionDisplayName).toBe('Published');
    expect(summary.keyChanges).toContain(
      'Status changed from "draft" to "published"',
    );
  });
});
