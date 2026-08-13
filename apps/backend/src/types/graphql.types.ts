import { type AuthenticatedUser } from '@repo/types';
export interface GraphQLContext {
  user?: AuthenticatedUser;
  appId: string;
}
