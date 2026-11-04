import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { listSchemas } from '@mindfiredigital/shared-db';
import { Router } from 'express';
import { eventBus } from '@mindfiredigital/events';
import { EVENT_NAMES } from '@mindfiredigital/constants';

import type { AuditEventPayload } from '@mindfiredigital/types';
import { authenticateToken } from '@mindfiredigital/middlewares';
import { getDatabaseAdapter } from '@mindfiredigital/config';
import { GraphQLContext } from '../../types/graphql.types.js';
import { formatGraphQLError } from './format-error.js';
import { buildGraphQLSchema } from './schema-builder.js';

export const graphqlRouter = Router();

// Lazy load ApolloServer with automatic cache invalidation on schema mutations
let currentServer: ApolloServer<GraphQLContext> | null = null;
let apolloServerPromise: Promise<ApolloServer<GraphQLContext>> | null = null;

export function invalidateGraphQLSchema(): void {
  if (currentServer) {
    currentServer.stop().catch(() => {});
    currentServer = null;
  }
  apolloServerPromise = null;
}

// Invalidate dynamic schema whenever schemas are modified
eventBus.on(EVENT_NAMES.AUDIT_LOG, (payload: AuditEventPayload) => {
  if (payload.resourceType === 'schema') {
    invalidateGraphQLSchema();
  }
});

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
    currentServer = server;
    return server;
  })();

  return apolloServerPromise;
}

graphqlRouter.use(authenticateToken);

graphqlRouter.use(async (req, res, next) => {
  try {
    const server = await getApolloServer();
    return expressMiddleware(server, {
      context: ({ req: expressReq }) => {
        const appId = expressReq.headers['x-app-id'] as string;
        if (!appId) throw new Error('x-app-id header is required');
        return Promise.resolve({ user: expressReq.user, appId });
      },
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});
