import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminModule } from '../src/modules/admin.module.js';
import type { HttpTransport } from '@repo/sdk-core';

describe('AdminModule', () => {
  let transport: HttpTransport;
  let admin: AdminModule;

  beforeEach(() => {
    transport = {
      request: vi.fn(),
    } as unknown as HttpTransport;

    admin = new AdminModule(transport);
  });

  it('lists users', async () => {
    const mockResponse = { data: { data: [{ id: 'u1' }], meta: { total: 1 } } };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);

    const result = await admin.listUsers({ page: 2 });

    expect(transport.request).toHaveBeenCalledWith('/access/users', {
      params: { page: 2 },
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('invites a user', async () => {
    const mockResponse = {
      data: {
        message: 'sent',
        user: { id: '1', email: 'test@test.com', status: 'invited' },
      },
    };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);

    const result = await admin.inviteUser(
      'test@test.com',
      'r1',
      'First',
      'Last',
    );

    expect(transport.request).toHaveBeenCalledWith('/access/users/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@test.com',
        roleId: 'r1',
        firstName: 'First',
        lastName: 'Last',
      }),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('lists roles', async () => {
    const mockResponse = { data: { data: [{ id: 'r1' }], meta: { total: 1 } } };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);

    const result = await admin.listRoles();

    expect(transport.request).toHaveBeenCalledWith('/access/roles', {
      params: {},
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('creates a token', async () => {
    const mockResponse = { data: { id: 't1', rawToken: 'abc' } };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);

    const result = await admin.createToken('Test Token', 'user', 'r1');

    expect(transport.request).toHaveBeenCalledWith('/access/tokens', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Token',
        type: 'user',
        roleId: 'r1',
        scopes: undefined,
      }),
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('revokes a token', async () => {
    const mockResponse = { data: { success: true } };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);

    const result = await admin.revokeToken('t1');

    expect(transport.request).toHaveBeenCalledWith('/access/tokens/t1', {
      method: 'DELETE',
    });
    expect(result).toEqual(mockResponse.data);
  });
});
