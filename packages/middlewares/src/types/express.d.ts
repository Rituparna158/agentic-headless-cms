import type { AuthenticatedUser } from '@repo/types';
import type { SchemaRecord } from '@repo/shared-db';
import type { RequestContext } from '@repo/context';
declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
      schema?: SchemaRecord;
      schemaId?: string;
      id?: string | number | object;
      context?: RequestContext;
    }
  }
}
