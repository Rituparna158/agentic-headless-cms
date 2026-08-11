import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchModule } from '../../src/modules/search.module.js';
import { HttpTransport } from '../../src/transport/http.js';

describe('SearchModule', () => {
  let transport: HttpTransport;
  let searchModule: SearchModule;

  beforeEach(() => {
    transport = {
      request: vi.fn(),
    } as unknown as HttpTransport;
    searchModule = new SearchModule(transport);
  });

  it('should execute a search with query parameters', async () => {
    const mockData = {
      data: [{ id: 'article1' }],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    };

    (transport.request as import('vitest').Mock).mockResolvedValueOnce({
      data: mockData,
    });

    const result = await searchModule.search('articles', 'hello world', {
      page: 1,
      pageSize: 10,
    });

    expect(transport.request).toHaveBeenCalledWith('/content/articles', {
      method: 'GET',
      params: {
        search: 'hello world',
        locale: undefined,
        page: 1,
        pageSize: 10,
      },
    });
    expect(result).toEqual(mockData);
  });
});
