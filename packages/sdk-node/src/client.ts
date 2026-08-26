import { AgenticCmsClient, type ClientConfig } from '@repo/sdk-core';
import { AdminModule } from './modules/admin.module.js';
import { NodeMediaModule } from './modules/media-node.module.js';

export class AgenticCmsNodeClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
> extends AgenticCmsClient<TMap> {
  public admin: AdminModule;
  public media: NodeMediaModule;

  constructor(config: ClientConfig) {
    super(config);
    this.admin = new AdminModule(this.transport);
    this.media = new NodeMediaModule(this.transport);
  }
}

export function createNodeClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
>(config?: Partial<ClientConfig>): AgenticCmsNodeClient<TMap> {
  const apiUrl = config?.baseUrl || process.env.CMS_API_URL;
  const apiToken = config?.apiToken || process.env.CMS_API_TOKEN;

  if (!apiUrl) {
    throw new Error(
      'createNodeClient: CMS_API_URL is missing. Please provide it in config or set CMS_API_URL environment variable.',
    );
  }

  if (!apiToken) {
    throw new Error(
      'createNodeClient: CMS_API_TOKEN is missing. Please provide it in config or set CMS_API_TOKEN environment variable.',
    );
  }

  return new AgenticCmsNodeClient<TMap>({
    baseUrl: apiUrl,
    apiToken,
  });
}
