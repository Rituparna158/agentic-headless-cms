import { type AuthenticatedUser } from '@mindfiredigital/types';
export interface GraphQLContext {
  user?: AuthenticatedUser;
  appId: string;
}
