import { HttpTransport } from '../transport/http.js';
import { ApiResponse } from '../types/index.js';
import type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  ListContentEntriesResult,
} from '@repo/types';

export class ContentModule {
  constructor(private transport: HttpTransport) {}

  public async list(
    schemaSlug: string,
    options?: ListContentEntriesOptions,
  ): Promise<ListContentEntriesResult> {
    const res = await this.transport.request<
      ApiResponse<ListContentEntriesResult>
    >(`/content/${schemaSlug}`, {
      params:
        (options as Record<string, string | number | boolean | undefined>) ||
        {},
    });
    return res.data;
  }

  public async findOne(
    schemaSlug: string,
    entryId: string,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}/${entryId}`,
      {
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }

  public async create(
    schemaSlug: string,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }

  public async update(
    schemaSlug: string,
    entryId: string,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}/${entryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }

  public async updatePartial(
    schemaSlug: string,
    entryId: string,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}/${entryId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }

  public async delete(schemaSlug: string, entryId: string): Promise<void> {
    await this.transport.request<void>(`/content/${schemaSlug}/${entryId}`, {
      method: 'DELETE',
    });
  }

  public async publish(
    schemaSlug: string,
    entryId: string,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}/${entryId}/publish`,
      {
        method: 'POST',
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }

  public async versions(
    schemaSlug: string,
    entryId: string,
    options?: { locale?: string },
  ): Promise<ContentVersionRecord[]> {
    const res = await this.transport.request<
      ApiResponse<ContentVersionRecord[]>
    >(`/content/${schemaSlug}/${entryId}/versions`, {
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }

  public async revert(
    schemaSlug: string,
    entryId: string,
    versionNo: number,
    options?: { locale?: string },
  ): Promise<ContentEntryRecord> {
    const res = await this.transport.request<ApiResponse<ContentEntryRecord>>(
      `/content/${schemaSlug}/${entryId}/revert`,
      {
        method: 'POST',
        body: JSON.stringify({ versionNo }),
        params: options as Record<
          string,
          string | number | boolean | undefined
        >,
      },
    );
    return res.data;
  }
}
