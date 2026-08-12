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
    const res = await this.transport.request<
      ApiResponse<PaginatedResult<SchemaRecord>>
    >('/schemas', {
      params: options as Record<string, string | number>,
    });
    return res.data;
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
