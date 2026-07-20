import { eq } from 'drizzle-orm';
import { getDatabaseAdapter } from '../../config/database.js';
import { locales, RecordNotFoundError } from '@repo/shared-db';

export class LocalesRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async list() {
    return this.db.select().from(locales);
  }

  async getByCode(code: string) {
    const [locale] = await this.db
      .select()
      .from(locales)
      .where(eq(locales.code, code))
      .limit(1);
    return locale;
  }

  async create(data: { code: string; name: string; isDefault?: boolean }) {
    const [locale] = await this.db.insert(locales).values(data).returning();
    return locale;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(locales)
      .where(eq(locales.id, id))
      .returning({ id: locales.id });
    if (!deleted) throw new RecordNotFoundError('Locale not found');
    return deleted;
  }
}
