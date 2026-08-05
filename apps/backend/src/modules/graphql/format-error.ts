import type { GraphQLFormattedError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import { HttpError } from '@repo/utils';

// Format GraphQL error codes
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
