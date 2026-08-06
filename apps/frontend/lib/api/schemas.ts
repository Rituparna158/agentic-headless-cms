import type {
  CreateSchemaInput,
  SchemaRecord,
  UpdateSchemaInput,
} from '@repo/types';
import { API_PATHS } from '@/lib/constants/api-paths';
import { apiFetch } from '@/lib/api-client';

export function listSchemas(): Promise<SchemaRecord[]> {
  return apiFetch<SchemaRecord[]>(API_PATHS.SCHEMAS.BASE);
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
