import { HttpTransport } from '../transport/http.js';
import { ApiResponse } from '../types/index.js';
import type {
  ContentEntryRecord,
  ContentVersionRecord,
  ListContentEntriesOptions,
  PaginationMeta,
} from '@repo/types';

type InferEntryType<TMap, TSlug extends string> = TSlug extends keyof TMap
  ? unknown extends TMap[TSlug]
    ? ContentEntryRecord
    : TMap[TSlug]
  : ContentEntryRecord;

type InferEntryInput<TMap, TSlug extends string> = TSlug extends keyof TMap
  ? unknown extends TMap[TSlug]
    ? Record<string, unknown>
    : TMap[TSlug] extends { data: infer TData }
      ? string extends keyof TData
        ? TData
        : {
            [K in keyof TData as null extends TData[K] ? never : K]: TData[K];
          } & {
            [K in keyof TData as null extends TData[K] ? K : never]?: TData[K];
          }
      : Record<string, unknown>
  : Record<string, unknown>;

type InferPartialEntryInput<
  TMap,
  TSlug extends string,
> = TSlug extends keyof TMap
  ? unknown extends TMap[TSlug]
    ? Record<string, unknown>
    : TMap[TSlug] extends { data: infer TData }
      ? Partial<TData>
      : Record<string, unknown>
  : Record<string, unknown>;

export class ContentModule<TMap extends object = Record<string, unknown>> {
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
    data: InferEntryInput<TMap, TSlug>,
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
    data: InferEntryInput<TMap, TSlug>,
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
    data: InferPartialEntryInput<TMap, TSlug>,
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

  public async unpublish<TSlug extends keyof TMap & string>(
    schemaSlug: TSlug,
    entryId: string,
    options?: { locale?: string },
  ): Promise<InferEntryType<TMap, TSlug>> {
    const res = await this.transport.request<
      ApiResponse<InferEntryType<TMap, TSlug>>
    >(`/content/${schemaSlug}/${entryId}/unpublish`, {
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
