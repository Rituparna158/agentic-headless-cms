import type { AuthenticatedUser } from '@repo/types';
import type { SchemaRecord } from '@repo/shared-db';
import type { RequestContext } from '@repo/context';
declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
      // Attached by resolveSchema middleware
      schema?: SchemaRecord;
      schemaId?: string;
      context?: RequestContext;
    }
  }
}
