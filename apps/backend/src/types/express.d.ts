import type { AuthenticatedUser } from '@mindfiredigital/types';
import type { SchemaRecord } from '@mindfiredigital/shared-db';
import type { RequestContext } from '@mindfiredigital/context';
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
