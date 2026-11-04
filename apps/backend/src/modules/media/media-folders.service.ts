import { logger } from '@mindfiredigital/logger';
import { ApiError } from '@mindfiredigital/utils';
import {
  MediaFoldersRepository,
  type MediaFolderRecord,
} from '@mindfiredigital/repository';
export class MediaFoldersService {
  private repository = new MediaFoldersRepository();
  async create(
    name: string,
    parentFolderId?: string | null,
    applicationId?: string,
  ): Promise<MediaFolderRecord> {
    try {
      return await this.repository.create({
        name,
        parentFolderId,
        applicationId,
      });
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersService Error in create:');
      throw new ApiError(500, 'Failed to create media folder');
    }
  }
  async list(
    parentFolderId?: string | null,
    applicationId?: string,
  ): Promise<MediaFolderRecord[]> {
    try {
      return await this.repository.list(parentFolderId, applicationId);
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersService Error in list:');
      throw new ApiError(500, 'Failed to list media folders');
    }
  }
  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      logger.error({ err: error }, 'MediaFoldersService Error in delete:');
      throw new ApiError(500, 'Failed to delete media folder');
    }
  }
}
