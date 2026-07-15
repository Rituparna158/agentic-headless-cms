import type {
  CreateSchemaInput,
  SchemaDefinition,
  UpdateSchemaInput,
} from '@repo/shared-types';
import { apiFetch } from '@/lib/api-client';

/** Shape of a persisted schema row, as returned by the backend (issue #14). */
export interface SchemaRecord {
  id: string;
  name: string;
  slug: string;
  type: 'collection' | 'single_type' | 'component';
  definition: SchemaDefinition;
  status: 'draft' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
}

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
