import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeMediaModule } from '../src/modules/media-node.module.js';
import type { HttpTransport } from '@mindfiredigital/sdk-core';
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
    expect(fileArg.type).toBe('image/jpeg');

    expect(result).toEqual(mockResponse.data);
  });

  it('infers image/png and respects explicit mimeType override', async () => {
    const mockResponse = { data: { id: 'a2', originalFilename: 'probe.png' } };
    vi.mocked(transport.request).mockResolvedValue(mockResponse);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('png-bytes'));

    await media.uploadFromPath('/tmp/probe.png');
    const pngBody = vi.mocked(transport.request).mock.calls[0]![1]
      ?.body as FormData;
    expect((pngBody.get('file') as File).type).toBe('image/png');

    await media.uploadFromPath('/tmp/custom.bin', {
      mimeType: 'application/x-custom',
    });
    const customBody = vi.mocked(transport.request).mock.calls[1]![1]
      ?.body as FormData;
    expect((customBody.get('file') as File).type).toBe('application/x-custom');
  });
});
