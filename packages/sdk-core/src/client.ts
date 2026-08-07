import { AuthClient } from './auth/auth.client.js';
import { HttpTransport } from './transport/http.js';
import { ClientConfig } from './types/index.js';

export class AgenticCmsClient {
  public auth: AuthClient;
  public transport: HttpTransport;

  constructor(config: ClientConfig) {
    this.auth = new AuthClient(config.apiToken);
    this.transport = new HttpTransport(config.baseUrl, this.auth);
  }
}

export function createClient(config: ClientConfig): AgenticCmsClient {
  return new AgenticCmsClient(config);
}
