import { AuthClient } from './auth/auth.client.js';
import { HttpTransport } from './transport/http.js';
import { ClientConfig } from './types/index.js';
import { ContentModule } from './modules/content.module.js';
import { SchemaModule } from './modules/schema.module.js';
import { MediaModule } from './modules/media.module.js';
import { GraphQLModule } from './modules/graphql.module.js';
import { SearchModule } from './modules/search.module.js';

/** Normalizes a Headless CMS base URL so it ends with an API version prefix (defaulting to `/api/v1`). */
export function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return /\/api\/v\d+$/i.test(trimmed) ? trimmed : `${trimmed}/api/v1`;
}

export class AgenticCmsClient<TMap extends object = Record<string, unknown>> {
  public auth: AuthClient;
  public transport: HttpTransport;
  public content: ContentModule<TMap>;
  public schema: SchemaModule;
  public media: MediaModule;
  public graphql: GraphQLModule;
  public search: SearchModule;

  constructor(config: ClientConfig) {
    this.auth = new AuthClient(config.apiToken);
    const baseUrl = normalizeApiBaseUrl(config.baseUrl);
    this.transport = new HttpTransport(baseUrl, this.auth, {
      appId:
        config.appId ||
        (typeof process !== 'undefined' && process.env?.CMS_APP_ID) ||
        'HEADLESS_CMS',
      apiKey: config.apiKey,
      headers: config.headers,
      retry: config.retry,
    });
    this.auth.setTransport(this.transport);

    this.content = new ContentModule<TMap>(this.transport);
    this.schema = new SchemaModule(this.transport);
    this.media = new MediaModule(this.transport);
    this.graphql = new GraphQLModule(this.transport);
    this.search = new SearchModule(this.transport);
  }
}

export function createClient<TMap extends object = Record<string, unknown>>(
  config: ClientConfig,
): AgenticCmsClient<TMap> {
  return new AgenticCmsClient<TMap>(config);
}
