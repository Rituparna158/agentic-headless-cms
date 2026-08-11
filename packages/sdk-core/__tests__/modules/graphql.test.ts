import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphQLModule } from '../../src/modules/graphql.module.js';
import { HttpTransport } from '../../src/transport/http.js';
import { ApiError } from '../../src/errors/index.js';

describe('GraphQLModule', () => {
  let transport: HttpTransport;
  let graphql: GraphQLModule;

  beforeEach(() => {
    transport = {
      getBaseUrl: vi.fn().mockReturnValue('http://localhost:4000/api/v1'),
      request: vi.fn(),
    } as unknown as HttpTransport;
    graphql = new GraphQLModule(transport);
  });

  it('should execute a query successfully', async () => {
    (transport.request as import('vitest').Mock).mockResolvedValueOnce({
      data: { hello: 'world' },
    });

    const result = await graphql.query('{ hello }');

    expect(transport.request).toHaveBeenCalledWith(
      'http://localhost:4000/graphql',
      {
        method: 'POST',
        body: JSON.stringify({ query: '{ hello }', variables: undefined }),
      },
    );
    expect(result).toEqual({ hello: 'world' });
  });

  it('should execute a mutation with variables successfully', async () => {
    (transport.request as import('vitest').Mock).mockResolvedValueOnce({
      data: { update: true },
    });

    const result = await graphql.mutation(
      'mutation($id: ID!) { update(id: $id) }',
      {
        id: '123',
      },
    );

    expect(transport.request).toHaveBeenCalledWith(
      'http://localhost:4000/graphql',
      {
        method: 'POST',
        body: JSON.stringify({
          query: 'mutation($id: ID!) { update(id: $id) }',
          variables: { id: '123' },
        }),
      },
    );
    expect(result).toEqual({ update: true });
  });

  it('should throw ApiError if response contains GraphQL errors', async () => {
    (transport.request as import('vitest').Mock).mockResolvedValue({
      errors: [{ message: 'Not authorized' }],
    });

    await expect(graphql.query('{ secret }')).rejects.toThrow(ApiError);
    await expect(graphql.query('{ secret }')).rejects.toThrow('Not authorized');
  });

  it('should throw ApiError if response is missing data', async () => {
    (transport.request as import('vitest').Mock).mockResolvedValueOnce({});

    await expect(graphql.query('{ broken }')).rejects.toThrow(
      'GraphQL response missing data',
    );
  });
});
