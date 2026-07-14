import type { CreateSchemaInput, UpdateSchemaInput } from '@repo/shared-types';
import { SchemaRepository } from './schema.repository.js';

export class SchemaService {
  private repository: SchemaRepository;

  constructor() {
    this.repository = new SchemaRepository();
  }

  async create(input: CreateSchemaInput, actorUserId: string) {
    return this.repository.create({ ...input, actorUserId });
  }

  async list() {
    return this.repository.list();
  }

  async update(id: string, input: UpdateSchemaInput, actorUserId: string) {
    return this.repository.update(id, { ...input, actorUserId });
  }
}

export const schemaService = new SchemaService();
