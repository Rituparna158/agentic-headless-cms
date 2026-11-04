import type { AuthenticatedUser } from '@mindfiredigital/types';
import type { SchemaRecord } from '@mindfiredigital/shared-db';
import type { RequestContext } from '@mindfiredigital/context';
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
