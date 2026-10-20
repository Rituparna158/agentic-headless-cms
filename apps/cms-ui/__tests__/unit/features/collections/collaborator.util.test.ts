import { describe, it, expect } from 'vitest';
import { normalizeCollaborator } from '@/features/collections/utils/collaborator.util';

describe('collaborator.util', () => {
  it('returns default admin fallback when actor is empty and no current user is provided', () => {
    const res = normalizeCollaborator('');
    expect(res).toEqual({
      key: 'admin',
      displayName: 'Admin',
      email: '',
      initials: 'A',
    });
  });

  it('uses current user name and email when actor is empty', () => {
    const user = {
      id: 'user-1',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
    };
    const res = normalizeCollaborator(undefined, user);
    expect(res).toEqual({
      key: 'alice@example.com',
      displayName: 'Alice Smith',
      email: 'alice@example.com',
      initials: 'A',
    });
  });

  it('normalizes admin keyword aliases when matching current user', () => {
    const user = {
      id: 'admin-id',
      email: 'sysadmin@agentic-cms.com',
      firstName: 'System',
      lastName: 'Admin',
    };
    const res = normalizeCollaborator('admin', user);
    expect(res.key).toBe('sysadmin@agentic-cms.com');
    expect(res.displayName).toBe('System Admin');
    expect(res.email).toBe('sysadmin@agentic-cms.com');
  });

  it('normalizes standalone admin keyword without current user email', () => {
    const res = normalizeCollaborator('cms admin');
    expect(res).toEqual({
      key: 'admin',
      displayName: 'Admin',
      email: '',
      initials: 'A',
    });
  });

  it('normalizes raw email addresses', () => {
    const res = normalizeCollaborator('editor.john@company.com');
    expect(res).toEqual({
      key: 'editor.john@company.com',
      displayName: 'editor.john@company.com',
      email: 'editor.john@company.com',
      initials: 'E',
    });
  });

  it('normalizes UUID actors', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const res = normalizeCollaborator(uuid);
    expect(res).toEqual({
      key: uuid.toLowerCase(),
      displayName: 'User',
      email: '',
      initials: 'U',
    });

    const user = {
      id: uuid,
      email: 'uuid.user@example.com',
      firstName: 'Bob',
      lastName: 'Builder',
    };
    const userRes = normalizeCollaborator(uuid, user);
    expect(userRes.displayName).toBe('Bob Builder');
    expect(userRes.email).toBe('uuid.user@example.com');
  });

  it('normalizes plain text names', () => {
    const res = normalizeCollaborator('Marketing Team');
    expect(res).toEqual({
      key: 'marketing team',
      displayName: 'Marketing Team',
      email: '',
      initials: 'M',
    });
  });
});
