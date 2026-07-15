import type { GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import { HttpError } from '../../common/errors/http-error.js';

/**
 * Apollo's default error formatting reports every resolver-thrown error as
 * `extensions.code: "INTERNAL_SERVER_ERROR"` — a client can't distinguish
 * "you're not allowed to do this" from "the server crashed" without this.
 * Resolvers throw the same HttpError subclasses the REST layer's error
 * handler understands (see graphql.context.ts's assertPermission), so this
 * maps them to conventional GraphQL error codes instead.
 */
export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const original = unwrapResolverError(error);

  if (!(original instanceof HttpError)) {
    return formattedError;
  }

  const code = httpErrorToGraphQLCode(original);

  return {
    ...formattedError,
    message: original.message,
    extensions: {
      ...formattedError.extensions,
      code,
    },
  };
}

function httpErrorToGraphQLCode(error: HttpError): string {
  switch (error.statusCode) {
    case 400:
      return 'BAD_USER_INPUT';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}
