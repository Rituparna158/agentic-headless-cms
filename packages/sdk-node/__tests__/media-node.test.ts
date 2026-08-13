import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeMediaModule } from '../src/modules/media-node.module.js';
import type { HttpTransport } from '@repo/sdk-core';
import * as fs from 'fs';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('NodeMediaModule', () => {
  let transport: HttpTransport;
  let media: NodeMediaModule;

  beforeEach(() => {
    transport = {
      request: vi.fn(),
    } as unknown as HttpTransport;

    media = new NodeMediaModule(transport);
    vi.clearAllMocks();
  });

  it('uploads from path', async () => {
    const mockResponse = { data: { id: 'a1', originalFilename: 'test.jpg' } };
    vi.mocked(transport.request).mockResolvedValueOnce(mockResponse);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake-image-data'));

    const result = await media.uploadFromPath('/tmp/test.jpg', {
      altText: 'A test image',
    });

    expect(fs.readFileSync).toHaveBeenCalledWith('/tmp/test.jpg');

    // Assert transport request is called with correct parameters
    expect(transport.request).toHaveBeenCalledTimes(1);

    const callArgs = vi.mocked(transport.request).mock.calls[0]!;
    expect(callArgs[0]).toBe('/media');
    expect(callArgs[1]?.method).toBe('POST');

    // Check that formData is passed correctly
    const body = callArgs[1]?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('altText')).toBe('A test image');

    const fileArg = body.get('file') as File;
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toBe('test.jpg');

    expect(result).toEqual(mockResponse.data);
  });
});
