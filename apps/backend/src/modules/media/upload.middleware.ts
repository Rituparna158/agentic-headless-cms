import multer from 'multer';
import { env } from '../../config/env.js';

/**
 * Memory storage, not disk — the issue's proposed solution is explicit that
 * sharp should process the buffer before it's handed to the storage
 * adapter, so multer's job is just parsing multipart/form-data into a
 * buffer, not persisting anything itself.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_BYTES },
});
