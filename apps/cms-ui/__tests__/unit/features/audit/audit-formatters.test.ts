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
  });

  it('handles actor fallbacks for email only, userId only, and system admin', () => {
    const emailOnlyLog: AuditLogRecord = {
      ...baseLog,
      actorFirstName: undefined,
      actorLastName: undefined,
      actorEmail: 'writer@company.com',
    };
    expect(getActorDisplayName(emailOnlyLog)).toBe('writer@company.com');

    const idOnlyLog: AuditLogRecord = {
      ...baseLog,
      actorFirstName: undefined,
      actorLastName: undefined,
      actorEmail: undefined,
      actorUserId: 'usr-99998888',
    };
    expect(getActorDisplayName(idOnlyLog)).toBe('User (usr-9999)');

    const fallbackLog: AuditLogRecord = {
      ...baseLog,
      actorType: 'user',
      actorFirstName: undefined,
      actorLastName: undefined,
      actorEmail: undefined,
      actorUserId: undefined,
    };
    expect(getActorDisplayName(fallbackLog)).toBe('System Administrator');
    expect(getActorInitials('System')).toBe('SY');
  });

  it('computes added and deleted diff entries accurately', () => {
    const before = { title: 'Old Title', legacyKey: '123' };
    const after = { title: 'Old Title', newKey: '456' };

    const diffs = computeStateDiff(before, after);
    expect(
      diffs.some((d) => d.path === 'newKey' && d.changeType === 'added'),
    ).toBe(true);
    expect(
      diffs.some((d) => d.path === 'legacyKey' && d.changeType === 'removed'),
    ).toBe(true);
  });

  it('generates summary for created, deleted, and rolled back actions', () => {
    const createLog: AuditLogRecord = {
      ...baseLog,
      action: 'create',
      beforeState: null,
      afterState: { title: 'Brand New Post' },
    };
    const createSummary = generateHumanReadableSummary(createLog);
    expect(createSummary.headline).toContain(
      'created content entry "Brand New Post"',
    );

    const deleteLog: AuditLogRecord = {
      ...baseLog,
      action: 'delete',
      beforeState: { title: 'Dead Post' },
      afterState: null,
    };
    const deleteSummary = generateHumanReadableSummary(deleteLog);
    expect(deleteSummary.headline).toContain(
      'deleted content entry "Dead Post"',
    );

    const rollbackLog: AuditLogRecord = {
      ...baseLog,
      action: 'rollback',
      beforeState: { title: 'Bad Version' },
      afterState: { title: 'Restored Version' },
    };
    const rollbackSummary = generateHumanReadableSummary(rollbackLog);
    expect(rollbackSummary.headline).toContain(
      'rolled back "Restored Version"',
    );
  });
});
