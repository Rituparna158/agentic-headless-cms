import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { program } from '../src/cli.js';

describe('Codegen CLI Binary', () => {
  beforeEach(() => {
    // Reset commander parsed options for test isolation
    program.setOptionValue('token', undefined);
    program.setOptionValue('apiKey', undefined);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse options and execute the generator on successful API response', async () => {
    const mockSchemas = [
      {
        id: '1',
        name: 'Product',
        slug: 'products',
        type: 'collection',
        status: 'published',
        version: 1,
        createdAt: '2026-08-25T12:00:00.000Z',
        updatedAt: '2026-08-25T12:00:00.000Z',
        definition: {
          fields: [
            {
              apiId: 'name',
              dataType: 'text',
              isRequired: true,
              isRepeatable: false,
            },
          ],
        },
      },
    ];

    // Mock fetch request
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: mockSchemas,
        },
      }),
    } as Response);

    // Mock filesystem operations
    const mkdirSpy = vi
      .spyOn(fs, 'mkdirSync')
      .mockImplementation(() => undefined);
    const writeSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => undefined);

    // Parse options programmatically
    await program.parseAsync([
      'node',
      'cli.ts',
      '--url',
      'http://localhost:3001',
      '--token',
      'test-token',
      '--output',
      './dist/cms-types.ts',
    ]);

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/schemas?pageSize=1000',
      {
        headers: {
          Authorization: 'Bearer test-token',
          'x-app-id': 'HEADLESS_CMS',
          Accept: 'application/json',
        },
      },
    );

    expect(mkdirSpy).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalled();
  });

  it('should parse options and execute the generator on successful API response with --apiKey', async () => {
    const mockSchemas = [
      {
        id: '1',
        name: 'Product',
        slug: 'products',
        type: 'collection',
        status: 'published',
        version: 1,
        createdAt: '2026-08-25T12:00:00.000Z',
        updatedAt: '2026-08-25T12:00:00.000Z',
        definition: {
          fields: [
            {
              apiId: 'name',
              dataType: 'text',
              isRequired: true,
              isRepeatable: false,
            },
          ],
        },
      },
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: mockSchemas,
        },
      }),
    } as Response);

    const mkdirSpy = vi
      .spyOn(fs, 'mkdirSync')
      .mockImplementation(() => undefined);
    const writeSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => undefined);

    await program.parseAsync([
      'node',
      'cli.ts',
      '--url',
      'http://localhost:3001',
      '--apiKey',
      'test-api-key',
      '--output',
      './dist/cms-types.ts',
    ]);

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/schemas?pageSize=1000',
      {
        headers: {
          'x-api-key': 'test-api-key',
          'x-app-id': 'HEADLESS_CMS',
          Accept: 'application/json',
        },
      },
    );

    expect(mkdirSpy).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalled();
  });

  it('should exit with code 1 if neither token nor apiKey is provided', async () => {
    await expect(
      program.parseAsync([
        'node',
        'cli.ts',
        '--url',
        'http://localhost:3001',
        '--output',
        './dist/cms-types.ts',
      ]),
    ).rejects.toThrow('process.exit called');
  });

  it('should exit with code 1 if the CMS API returns a non-200 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    await expect(
      program.parseAsync([
        'node',
        'cli.ts',
        '--url',
        'http://localhost:3001',
        '--token',
        'invalid-token',
        '--output',
        './dist/cms-types.ts',
      ]),
    ).rejects.toThrow('process.exit called');
  });
});
