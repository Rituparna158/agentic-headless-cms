import { eq, isNull } from 'drizzle-orm';
import { mediaFolders, RecordNotFoundError } from '@repo/shared-db';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import { ApiError } from '@repo/utils';
import type { CreateMediaFolderInput } from '@repo/types';

export type MediaFolderRecord = typeof mediaFolders.$inferSelect;

export class MediaFoldersRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async create(input: CreateMediaFolderInput): Promise<MediaFolderRecord> {
    try {
      logger.info(
        { name: input.name },
        'MediaFoldersRepository: creating folder',
      );
      const [folder] = await this.db
        .insert(mediaFolders)
        .values({
          name: input.name,
          parentFolderId: input.parentFolderId ?? null,
        })
        .returning();

      if (!folder) {
        throw new RecordNotFoundError(
          'Insert of media folder returned no row.',
        );
      }
      return folder;
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersRepository Error in create:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, 'Failed to create media folder');
    }
  }

  async findById(id: string): Promise<MediaFolderRecord | null> {
    try {
      const [folder] = await this.db
        .select()
        .from(mediaFolders)
        .where(eq(mediaFolders.id, id))
        .limit(1);
      return folder ?? null;
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersRepository Error in findById:');
      throw new ApiError(500, 'Failed to fetch media folder');
    }
  }

  async list(parentFolderId?: string | null): Promise<MediaFolderRecord[]> {
    try {
      logger.info(
        { parentFolderId },
        'MediaFoldersRepository: listing folders',
      );

      const where =
        parentFolderId === 'root'
          ? isNull(mediaFolders.parentFolderId)
          : parentFolderId
            ? eq(mediaFolders.parentFolderId, parentFolderId)
            : isNull(mediaFolders.parentFolderId);

      const folders = await this.db
        .select()
        .from(mediaFolders)
        .where(where)
        .orderBy(mediaFolders.name);

      return folders;
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersRepository Error in list:');
      throw new ApiError(500, 'Failed to list media folders');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      logger.info({ id }, 'MediaFoldersRepository: deleting folder');
      const [deleted] = await this.db
        .delete(mediaFolders)
        .where(eq(mediaFolders.id, id))
        .returning();

      if (!deleted) {
        throw new RecordNotFoundError(`Folder ${id} does not exist`);
      }
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersRepository Error in delete:');
      if (error instanceof RecordNotFoundError) throw error;
      throw new ApiError(500, 'Failed to delete media folder');
    }
  }
}
