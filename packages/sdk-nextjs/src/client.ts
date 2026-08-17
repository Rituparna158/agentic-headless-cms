import { AgenticCmsClient } from '@repo/sdk-core';
import type { ClientConfig } from '@repo/sdk-core';
import { resolveEnvConfig } from './utils/config.js';

let _client: AgenticCmsClient | null = null;

/** Returns a module-level singleton client initialised from env vars. */
export function getCmsClient(): AgenticCmsClient {
  if (_client) return _client;
  _client = new AgenticCmsClient(resolveEnvConfig());
  return _client;
}

/** Creates a fresh (non-singleton) client - useful for overrides and testing. */
export function createNextjsClient(
  config?: Partial<ClientConfig>,
): AgenticCmsClient {
  return new AgenticCmsClient(
    resolveEnvConfig({ baseUrl: config?.baseUrl, apiToken: config?.apiToken }),
  );
}

/** Resets the singleton. Only used in tests. */
export function _resetClientSingleton(): void {
  _client = null;
}
