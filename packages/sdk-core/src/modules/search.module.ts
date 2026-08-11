import { HttpTransport } from '../transport/http.js';
import type { ApiResponse, SearchOptions } from '../types/index.js';
import type { ListContentEntriesResult } from '@repo/types';

export class SearchModule {
  constructor(private transport: HttpTransport) {}

  public async search(
    schemaSlug: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<ListContentEntriesResult> {
    const params: Record<string, string | number | undefined> = {
      search: query,
      locale: options.locale,
      page: options.page,
      pageSize: options.pageSize,
    };

    const res = await this.transport.request<
      ApiResponse<ListContentEntriesResult>
    >(`/content/${schemaSlug}`, {
      method: 'GET',
      params,
    });

    return res.data;
  }
}
