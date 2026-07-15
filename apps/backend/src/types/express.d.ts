import type { AuthenticatedUser } from '@repo/shared-types';
import type { SchemaRecord } from '@repo/shared-db';

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
      /** Set by resolveSchema middleware once a route resolves :schemaSlug. */
      schema?: SchemaRecord;
      schemaId?: string;
    }
  }
}
