import type { AuthenticatedUser } from '@repo/shared-types';

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
    }
  }
}
