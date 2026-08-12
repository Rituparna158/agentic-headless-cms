import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { listSchemas } from '@repo/shared-db';
import { Router } from 'express';

import { authenticateToken } from '@repo/middlewares';
import { getDatabaseAdapter } from '@repo/config';
import { GraphQLContext } from '../../types/graphql.types.js';
import { formatGraphQLError } from './format-error.js';
import { buildGraphQLSchema } from './schema-builder.js';

export const graphqlRouter = Router();

// Lazy load ApolloServer
let apolloServerPromise: Promise<ApolloServer<GraphQLContext>> | null = null;

function getApolloServer(): Promise<ApolloServer<GraphQLContext>> {
  apolloServerPromise ??= (async () => {
    const db = getDatabaseAdapter().getDb();
    const [schemas] = await listSchemas(db);
    const schema = buildGraphQLSchema(schemas);

    const server = new ApolloServer<GraphQLContext>({
      schema,
      formatError: formatGraphQLError,
    });
    await server.start();
    return server;
  })();

  return apolloServerPromise;
}

graphqlRouter.use(authenticateToken);

graphqlRouter.use(async (req, res, next) => {
  try {
    const server = await getApolloServer();
    return expressMiddleware(server, {
      context: ({ req: expressReq }) =>
        Promise.resolve({ user: expressReq.user }),
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});
