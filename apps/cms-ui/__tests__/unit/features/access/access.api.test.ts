import { describe, it, expect, vi, beforeEach } from 'vitest';

const rh = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/api/requestHandler', () => ({ requestHandler: rh }));

import { accessApi } from '../../../../src/features/access/api/access.api';

describe('accessApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(rh).forEach((f) => f.mockResolvedValue({ data: {} }));
  });

  it('roles CRUD', async () => {
    await accessApi.getRoles();
    await accessApi.getRoles({ page: 2, pageSize: 5 } as never);
    await accessApi.getRole('r1');
    await accessApi.createRole({ name: 'x' } as never);
    await accessApi.updateRole('r1', { name: 'y' } as never);
    await accessApi.deleteRole('r1');
    expect(rh.get.mock.calls[0]![0]).toBe('/access/roles');
    expect(rh.get.mock.calls[1]![0]).toContain('/access/roles?');
    expect(rh.get).toHaveBeenCalledWith('/access/roles/r1');
    expect(rh.post).toHaveBeenCalledWith('/access/roles', { name: 'x' });
    expect(rh.put).toHaveBeenCalledWith('/access/roles/r1', { name: 'y' });
    expect(rh.delete).toHaveBeenCalledWith('/access/roles/r1');
  });

  it('schemas and users', async () => {
    await accessApi.getSchemas();
    await accessApi.getUsers();
    await accessApi.inviteUser({ email: 'a@b.c' } as never);
    await accessApi.deleteUser('u1');
    await accessApi.updateUserRole('u1', 'r2');
    expect(rh.get).toHaveBeenCalledWith('/schemas');
    expect(rh.get).toHaveBeenCalledWith('/access/users');
    expect(rh.post).toHaveBeenCalledWith('/access/users/invite', {
      email: 'a@b.c',
    });
    expect(rh.delete).toHaveBeenCalledWith('/access/users/u1');
    expect(rh.patch).toHaveBeenCalledWith('/access/users/u1/role', {
      roleId: 'r2',
    });
  });

  it('getMfaRequests builds the query', async () => {
    await accessApi.getMfaRequests();
    await accessApi.getMfaRequests(
      'pending' as never,
      {
        page: 3,
        pageSize: 10,
        sort: 'createdAt',
        search: 'bob',
      } as never,
    );
    expect(rh.get.mock.calls[0]![0]).toBe('/access/mfa-requests');
    const q = new URLSearchParams(rh.get.mock.calls[1]![0].split('?')[1]);
    expect(Object.fromEntries(q)).toEqual({
      status: 'pending',
      page: '3',
      pageSize: '10',
      sort: 'createdAt',
      search: 'bob',
    });
  });

  it('approve / reject MFA requests', async () => {
    await accessApi.approveMfaRequest('m1');
    await accessApi.rejectMfaRequest('m1');
    expect(rh.post).toHaveBeenCalledWith('/access/mfa-requests/m1/approve');
    expect(rh.post).toHaveBeenCalledWith('/access/mfa-requests/m1/reject');
  });
});
