import type {
  CreateSchemaInput,
  SchemaRecord,
  UpdateSchemaInput,
} from '@repo/shared-types';
import { apiFetch } from '@/lib/api-client';

export function listSchemas(): Promise<SchemaRecord[]> {
  return apiFetch<SchemaRecord[]>('/api/v1/schemas');
}

export function createSchema(input: CreateSchemaInput): Promise<SchemaRecord> {
  return apiFetch<SchemaRecord>('/api/v1/schemas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateSchema(
  id: string,
  input: UpdateSchemaInput,
): Promise<SchemaRecord> {
  return apiFetch<SchemaRecord>(`/api/v1/schemas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteSchema(
  id: string,
  force: boolean = false,
): Promise<void> {
  const url = force
    ? `/api/v1/schemas/${id}?force=true`
    : `/api/v1/schemas/${id}`;
  return apiFetch<void>(url, {
    method: 'DELETE',
  });
}
