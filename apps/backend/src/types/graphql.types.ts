import { type AuthenticatedUser } from '@repo/shared-types';
export interface GraphQLContext {
  user?: AuthenticatedUser;
}
