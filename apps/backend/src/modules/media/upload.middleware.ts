import multer from 'multer';
import { env } from '@repo/config';
/** Memory storage for multer */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
});
