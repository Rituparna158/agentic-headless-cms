import { AuthClient } from './auth/auth.client.js';
import { HttpTransport } from './transport/http.js';
import { ClientConfig } from './types/index.js';
import { ContentModule } from './modules/content.module.js';
import { SchemaModule } from './modules/schema.module.js';
import { MediaModule } from './modules/media.module.js';
import { GraphQLModule } from './modules/graphql.module.js';
import { SearchModule } from './modules/search.module.js';

export class AgenticCmsClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
> {
  public auth: AuthClient;
  public transport: HttpTransport;
  public content: ContentModule<TMap>;
  public schema: SchemaModule;
  public media: MediaModule;
  public graphql: GraphQLModule;
  public search: SearchModule;

  constructor(config: ClientConfig) {
    this.auth = new AuthClient(config.apiToken);
    // Remove trailing slash if user included one
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    this.transport = new HttpTransport(baseUrl, this.auth);
    this.auth.setTransport(this.transport);

    this.content = new ContentModule<TMap>(this.transport);
    this.schema = new SchemaModule(this.transport);
    this.media = new MediaModule(this.transport);
    this.graphql = new GraphQLModule(this.transport);
    this.search = new SearchModule(this.transport);
  }
}

export function createClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
>(config: ClientConfig): AgenticCmsClient<TMap> {
  return new AgenticCmsClient<TMap>(config);
}
