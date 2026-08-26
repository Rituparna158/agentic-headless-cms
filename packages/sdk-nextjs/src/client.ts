import { AgenticCmsClient } from '@repo/sdk-core';
import type { ClientConfig } from '@repo/sdk-core';
import { resolveEnvConfig } from './utils/config.js';

let _client: AgenticCmsClient<Record<string, unknown>> | null = null;

/** Returns a module-level singleton client initialised from env vars. */
export function getCmsClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
>(): AgenticCmsClient<TMap> {
  if (_client) return _client as unknown as AgenticCmsClient<TMap>;
  _client = new AgenticCmsClient(resolveEnvConfig());
  return _client as unknown as AgenticCmsClient<TMap>;
}

/** Creates a fresh (non-singleton) client - useful for overrides and testing. */
export function createNextjsClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
>(config?: Partial<ClientConfig>): AgenticCmsClient<TMap> {
  return new AgenticCmsClient<TMap>(
    resolveEnvConfig({ baseUrl: config?.baseUrl, apiToken: config?.apiToken }),
  );
}

/** Resets the singleton. Only used in tests. */
export function _resetClientSingleton(): void {
  _client = null;
}
