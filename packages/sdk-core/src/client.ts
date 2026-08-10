import { AuthClient } from './auth/auth.client.js';
import { HttpTransport } from './transport/http.js';
import { ClientConfig } from './types/index.js';
import { ContentModule } from './modules/content.module.js';
import { SchemaModule } from './modules/schema.module.js';
import { MediaModule } from './modules/media.module.js';

export class AgenticCmsClient {
  public auth: AuthClient;
  public transport: HttpTransport;
  public content: ContentModule;
  public schema: SchemaModule;
  public media: MediaModule;

  constructor(config: ClientConfig) {
    this.auth = new AuthClient(config.apiToken);
    // Remove trailing slash if user included one
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    this.transport = new HttpTransport(baseUrl, this.auth);
    this.auth.setTransport(this.transport);

    this.content = new ContentModule(this.transport);
    this.schema = new SchemaModule(this.transport);
    this.media = new MediaModule(this.transport);
  }
}

export function createClient(config: ClientConfig): AgenticCmsClient {
  return new AgenticCmsClient(config);
}
