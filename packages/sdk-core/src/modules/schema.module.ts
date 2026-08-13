import { HttpTransport } from '../transport/http.js';
import { ApiResponse } from '../types/index.js';
import type {
  SchemaRecord,
  CreateSchemaInput,
  UpdateSchemaInput,
} from '@repo/types';

import type { BaseQueryOptions, PaginatedResult } from '@repo/types';

export class SchemaModule {
  constructor(private transport: HttpTransport) {}

  public async list(
    options?: BaseQueryOptions,
  ): Promise<PaginatedResult<SchemaRecord>> {
    const res = options
      ? await this.transport.request<
          ApiResponse<PaginatedResult<SchemaRecord>>
        >('/schemas', {
          params: options as Record<string, string | number>,
        })
      : await this.transport.request<
          ApiResponse<PaginatedResult<SchemaRecord>>
        >('/schemas');
    return res.data;
  }

  public async get(slug: string): Promise<SchemaRecord> {
    const listResponse = await this.list({ page: 1, pageSize: 1000 });
    const schema = listResponse.data.find((s) => s.slug === slug);
    if (!schema) {
      throw new Error(`Schema with slug "${slug}" not found`);
    }
    return schema;
  }

  public async create(definition: CreateSchemaInput): Promise<SchemaRecord> {
    const res = await this.transport.request<ApiResponse<SchemaRecord>>(
      '/schemas',
      {
        method: 'POST',
        body: JSON.stringify(definition),
      },
    );
    return res.data;
  }

  public async update(
    schemaId: string,
    definition: UpdateSchemaInput,
  ): Promise<SchemaRecord> {
    const res = await this.transport.request<ApiResponse<SchemaRecord>>(
      `/schemas/${schemaId}`,
      {
        method: 'PUT',
        body: JSON.stringify(definition),
      },
    );
    return res.data;
  }

  public async delete(schemaId: string, force?: boolean): Promise<void> {
    await this.transport.request<void>(`/schemas/${schemaId}`, {
      method: 'DELETE',
      params: force ? { force: 'true' } : undefined,
    });
  }
}
