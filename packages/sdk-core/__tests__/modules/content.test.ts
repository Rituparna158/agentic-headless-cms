import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../../src/transport/http.js';
import { AuthClient } from '../../src/auth/auth.client.js';
import { ContentModule } from '../../src/modules/content.module.js';

describe('ContentModule', () => {
  let transport: HttpTransport;
  let content: ContentModule;

  beforeEach(() => {
    const authClient = new AuthClient();
    transport = new HttpTransport('https://api.example.com', authClient);
    content = new ContentModule(transport);

    vi.spyOn(transport, 'request').mockImplementation(async () => {
      return { data: 'mockData' };
    });
  });

  it('list', async () => {
    await content.list('articles', { page: 1, sort: 'asc' });
    expect(transport.request).toHaveBeenCalledWith('/content/articles', {
      params: { page: 1, sort: 'asc' },
    });
  });

  it('findOne', async () => {
    await content.findOne('articles', '123', { locale: 'en' });
    expect(transport.request).toHaveBeenCalledWith('/content/articles/123', {
      params: { locale: 'en' },
    });
  });

  it('create', async () => {
    await content.create('articles', { title: 'Test' }, { locale: 'fr' });
    expect(transport.request).toHaveBeenCalledWith('/content/articles', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
      params: { locale: 'fr' },
    });
  });

  it('update', async () => {
    await content.update('articles', '123', { title: 'Updated' });
    expect(transport.request).toHaveBeenCalledWith('/content/articles/123', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated' }),
      params: undefined,
    });
  });

  it('delete', async () => {
    await content.delete('articles', '123');
    expect(transport.request).toHaveBeenCalledWith('/content/articles/123', {
      method: 'DELETE',
    });
  });

  it('publish', async () => {
    await content.publish('articles', '123');
    expect(transport.request).toHaveBeenCalledWith(
      '/content/articles/123/publish',
      {
        method: 'POST',
        params: undefined,
      },
    );
  });

  it('versions', async () => {
    await content.versions('articles', '123');
    expect(transport.request).toHaveBeenCalledWith(
      '/content/articles/123/versions',
      {
        params: undefined,
      },
    );
  });

  it('revert', async () => {
    await content.revert('articles', '123', 5);
    expect(transport.request).toHaveBeenCalledWith(
      '/content/articles/123/revert',
      {
        method: 'POST',
        body: JSON.stringify({ versionNo: 5 }),
        params: undefined,
      },
    );
  });
});
