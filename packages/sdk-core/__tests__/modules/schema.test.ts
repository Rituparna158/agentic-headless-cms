import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../../src/transport/http.js';
import { AuthClient } from '../../src/auth/auth.client.js';
import { SchemaModule } from '../../src/modules/schema.module.js';

describe('SchemaModule', () => {
  let transport: HttpTransport;
  let schemaModule: SchemaModule;

  beforeEach(() => {
    const authClient = new AuthClient();
    transport = new HttpTransport('https://api.example.com', authClient);
    schemaModule = new SchemaModule(transport);

    vi.spyOn(transport, 'request').mockImplementation(async () => {
      return { data: 'mockData' };
    });
  });

  it('list', async () => {
    await schemaModule.list();
    expect(transport.request).toHaveBeenCalledWith('/schemas');
  });

  it('create', async () => {
    const def = {
      name: 'Test',
      slug: 'test',
      type: 'collection' as const,
      fields: [],
    };
    await schemaModule.create(def);
    expect(transport.request).toHaveBeenCalledWith('/schemas', {
      method: 'POST',
      body: JSON.stringify(def),
    });
  });

  it('update', async () => {
    const def = { name: 'Updated' };
    await schemaModule.update('123', def);
    expect(transport.request).toHaveBeenCalledWith('/schemas/123', {
      method: 'PUT',
      body: JSON.stringify(def),
    });
  });

  it('delete', async () => {
    await schemaModule.delete('123');
    expect(transport.request).toHaveBeenCalledWith('/schemas/123', {
      method: 'DELETE',
      params: undefined,
    });
  });

  it('delete with force', async () => {
    await schemaModule.delete('123', true);
    expect(transport.request).toHaveBeenCalledWith('/schemas/123', {
      method: 'DELETE',
      params: { force: 'true' },
    });
  });
});
