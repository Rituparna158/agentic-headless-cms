import { LocalesRepository } from './locales.repository.js';
import { CreateLocaleInput } from '../../types/locales.types.js';
import { ERROR_MESSAGES } from '@repo/shared-types';

export class LocalesService {
  constructor(
    private readonly repository: LocalesRepository = new LocalesRepository(),
  ) {}

  async list() {
    return this.repository.list();
  }

  async create(data: CreateLocaleInput) {
    const existing = await this.repository.getByCode(data.code);
    if (existing) {
      throw new Error(ERROR_MESSAGES.LOCALES.CODE_ALREADY_EXISTS);
    }
    return this.repository.create({
      code: data.code,
      name: data.name,
      isDefault: data.isDefault ?? false,
    });
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
