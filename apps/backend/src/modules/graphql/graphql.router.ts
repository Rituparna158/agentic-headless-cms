import { Router } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { listSchemas } from '@repo/shared-db';
import { getDatabaseAdapter } from '../../config/database.js';
import { authenticateToken } from '../../common/middlewares/auth.middleware.js';
import { buildGraphQLSchema } from './schema-builder.js';
import { formatGraphQLError } from './format-error.js';
import type { GraphQLContext } from './graphql.context.js';

export const graphqlRouter = Router();

// Built lazily (not at createApp() time) so importing/creating the Express
// app never requires a live database connection — tests construct the app
// via createApp() against a fully mocked DB layer and never touch this
// route, and unrelated routes shouldn't pay a DB round-trip at boot just
// because GraphQL exists. Cached as a promise so concurrent first requests
// share one build instead of racing to construct the schema twice.
let apolloServerPromise: Promise<ApolloServer<GraphQLContext>> | null = null;

function getApolloServer(): Promise<ApolloServer<GraphQLContext>> {
  apolloServerPromise ??= (async () => {
    const db = getDatabaseAdapter().getDb();
    const schemas = await listSchemas(db);
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
