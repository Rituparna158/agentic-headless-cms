import { HttpTransport } from '../transport/http.js';
import { ApiError } from '../errors/index.js';
import type { GraphQLResponse } from '../types/index.js';

export class GraphQLModule {
  constructor(private transport: HttpTransport) {}

  public async query<T = unknown>(
    document: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.execute<T>(document, variables);
  }

  public async mutation<T = unknown>(
    document: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.execute<T>(document, variables);
  }

  private async execute<T>(
    document: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const origin = new URL(this.transport.getBaseUrl()).origin;
    const graphqlUrl = `${origin}/graphql`;

    const response = await this.transport.request<GraphQLResponse<T>>(
      graphqlUrl,
      {
        method: 'POST',
        body: JSON.stringify({ query: document, variables }),
      },
    );

    if (response.errors && response.errors.length > 0) {
      const message = response.errors[0]?.message || 'GraphQL Error';
      throw new ApiError(400, message, response.errors);
    }

    if (response.data === undefined) {
      throw new ApiError(500, 'GraphQL response missing data', response);
    }

    return response.data;
  }
}
