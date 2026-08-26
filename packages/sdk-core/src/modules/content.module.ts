import { HttpTransport } from '../transport/http.js';
import { ApiResponse } from '../types/index.js';
import type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  PaginationMeta,
} from '@repo/types';

type InferEntryType<TMap, TSlug extends string> = TSlug extends keyof TMap
  ? TMap[TSlug]
  : ContentEntryRecord;

export class ContentModule<
  TMap extends Record<string, unknown> = Record<string, unknown>,
> {
  constructor(private transport: HttpTransport) {}

  public async list<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    options?: ListContentEntriesOptions,
  ): Promise<{
    data: InferEntryType<TMap, TSlug>[];
    meta: { pagination: PaginationMeta };
  }> {
    const res = await this.transport.request<
      ApiResponse<{
        data: InferEntryType<TMap, TSlug>[];
        meta: { pagination: PaginationMeta };
      }>
    >(`/content/${schemaSlug}`, {
      params:
        (options as Record<string, string | number | boolean | undefined>) ||
        {},
    });
    return res.data;
  }

  public async findOne<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}`, {
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }

  public async create<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}`, {
      method: 'POST',
      body: JSON.stringify(data),
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }

  public async update<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }

  public async updatePartial<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    data: Record<string, unknown>,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }

  public async delete(schemaSlug: string, entryId: string): Promise<void> {
    await this.transport.request<void>(`/content/${schemaSlug}/${entryId}`, {
      method: 'DELETE',
    });
  }

  public async publish<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}/publish`, {
      method: 'POST',
      params: options as Record<string, string | number | boolean | undefined>,
    });
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

  public async revert<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    versionNo: number,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}/revert`, {
      method: 'POST',
      body: JSON.stringify({ versionNo }),
      params: options as Record<string, string | number | boolean | undefined>,
    });
    return res.data;
  }
}
