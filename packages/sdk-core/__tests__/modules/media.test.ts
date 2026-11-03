import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../../src/transport/http.js';
import { AuthClient } from '../../src/auth/auth.client.js';
import { MediaModule } from '../../src/modules/media.module.js';

describe('MediaModule', () => {
  let transport: HttpTransport;
  let media: MediaModule;

  beforeEach(() => {
    const authClient = new AuthClient();
    transport = new HttpTransport('https://api.example.com', authClient);
    media = new MediaModule(transport);

    vi.spyOn(transport, 'request').mockImplementation(async () => {
      return { data: 'mockData' };
    });
  });

  it('list', async () => {
    await media.list({ page: 1 });
    expect(transport.request).toHaveBeenCalledWith('/media', {
      params: { page: 1 },
    });
  });

  it('get', async () => {
    await media.get('123');
    expect(transport.request).toHaveBeenCalledWith('/media/123');
  });

  it('delete', async () => {
    await media.delete('123');
    expect(transport.request).toHaveBeenCalledWith('/media/123', {
      method: 'DELETE',
    });
  });

  it('upload', async () => {
    const file = new Blob(['test content'], { type: 'text/plain' });

    await media.upload(file, { altText: 'alt', folderId: 'folder1' });

    const callArgs = (transport.request as import('vitest').Mock).mock
      .calls[0]!;
    expect(callArgs[0]).toBe('/media');
    expect(callArgs[1].method).toBe('POST');

    const formData = callArgs[1].body as FormData;
    expect(formData).toBeInstanceOf(FormData);
    const formDataFile = formData.get('file') as Blob;
    expect(formDataFile.size).toBe(file.size);
    expect(formDataFile.type).toBe(file.type);
    expect(formData.get('altText')).toBe('alt');
    expect(formData.get('folderId')).toBe('folder1');
  });
});
