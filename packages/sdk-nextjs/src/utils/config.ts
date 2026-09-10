export function resolveEnvConfig(overrides?: {
  baseUrl?: string;
  apiToken?: string;
  appId?: string;
  apiKey?: string;
}): { baseUrl: string; apiToken: string; appId?: string; apiKey?: string } {
  const baseUrl = overrides?.baseUrl ?? process.env['CMS_API_URL'];
  const apiToken = overrides?.apiToken ?? process.env['CMS_API_TOKEN'];
  const appId = overrides?.appId ?? process.env['CMS_APP_ID'];
  const apiKey = overrides?.apiKey ?? process.env['CMS_API_KEY'];
  if (!baseUrl) throw new Error('[sdk-nextjs] CMS_API_URL is missing.');
  if (!apiToken) throw new Error('[sdk-nextjs] CMS_API_TOKEN is missing.');
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiToken, appId, apiKey };
}
