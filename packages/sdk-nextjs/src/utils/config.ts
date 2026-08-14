/** Reads CMS connection config from env*/
export function resolveEnvConfig(overrides?: {
  baseUrl?: string;
  apiToken?: string;
}): { baseUrl: string; apiToken: string } {
  const baseUrl = overrides?.baseUrl ?? process.env['CMS_API_URL'];
  const apiToken = overrides?.apiToken ?? process.env['CMS_API_TOKEN'];
  if (!baseUrl) throw new Error('[sdk-nextjs] CMS_API_URL is missing.');
  if (!apiToken) throw new Error('[sdk-nextjs] CMS_API_TOKEN is missing.');
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiToken };
}
