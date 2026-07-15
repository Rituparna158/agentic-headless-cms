import { ContentRepository } from './content.repository.js';
import { DEFAULT_LOCALE } from '@repo/shared-types';

export class ContentService {
  private repository: ContentRepository;

  constructor() {
    this.repository = new ContentRepository();
  }

  async listEntries(schemaId: string, locale: string = DEFAULT_LOCALE) {
    return this.repository.listEntries(schemaId, locale);
  }

  async getEntryById(entryId: string, locale: string = DEFAULT_LOCALE) {
    return this.repository.getEntryById(entryId, locale);
  }

  async createDraft(
    schemaId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    return this.repository.createEntry(schemaId, data, userId, locale);
  }

  async updateDraft(
    entryId: string,
    data: Record<string, unknown>,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    return this.repository.updateEntryDraft(entryId, data, userId, locale);
  }

  async publishEntry(
    entryId: string,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    return this.repository.publishEntry(entryId, userId, locale);
  }

  async revertEntry(
    entryId: string,
    versionNo: number,
    userId: string,
    locale: string = DEFAULT_LOCALE,
  ) {
    return this.repository.revertEntry(entryId, versionNo, userId, locale);
  }

  async deleteEntry(entryId: string) {
    return this.repository.deleteEntry(entryId);
  }
}
