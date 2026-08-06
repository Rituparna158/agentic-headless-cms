import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@repo/constants';
import { MediaFoldersService } from './media-folders.service.js';

const mediaFoldersService = new MediaFoldersService();

export const createFolder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, parentFolderId } = req.body as {
      name: string;
      parentFolderId?: string;
    };
    const folder = await mediaFoldersService.create(name, parentFolderId);
    res.status(HTTP_STATUS.CREATED).json({ data: folder });
  } catch (error) {
    next(error);
  }
};

export const listFolders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parentFolderId =
      typeof req.query.parentFolderId === 'string'
        ? req.query.parentFolderId
        : undefined;
    const folders = await mediaFoldersService.list(parentFolderId);
    res.status(HTTP_STATUS.OK).json({ data: folders });
  } catch (error) {
    next(error);
  }
};

export const deleteFolder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await mediaFoldersService.delete(req.params.id as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};
