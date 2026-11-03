import type {
  CreateSchemaInput,
  SchemaRecord,
  UpdateSchemaInput,
  BaseQueryOptions,
  PaginatedResult,
} from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';
import { apiFetch, buildQueryString } from '@/lib/api-client';

export function listSchemas(
  options?: BaseQueryOptions,
): Promise<PaginatedResult<SchemaRecord>> {
  return apiFetch<PaginatedResult<SchemaRecord>>(
    `${API_PATHS.SCHEMAS.BASE}${buildQueryString(options)}`,
  );
}

export function createSchema(input: CreateSchemaInput): Promise<SchemaRecord> {
  return apiFetch<SchemaRecord>(API_PATHS.SCHEMAS.BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSchema(
  id: string,
  input: UpdateSchemaInput,
): Promise<SchemaRecord> {
  return apiFetch<SchemaRecord>(API_PATHS.SCHEMAS.BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteSchema(
  id: string,
  force: boolean = false,
): Promise<void> {
  const url = force
    ? API_PATHS.SCHEMAS.BY_ID(id, true)
    : API_PATHS.SCHEMAS.BY_ID(id);
  return apiFetch<void>(url, {
    method: 'DELETE',
  });
}
