import { BadRequestError } from '@repo/utils';

/**
 * Validates a webhook URL to prevent Server-Side Request Forgery (SSRF)
 * and ensure standard HTTP/HTTPS protocols.
 */
export function validateWebhookUrl(
  urlString: string,
  allowLocal = process.env.NODE_ENV !== 'production',
): void {
  if (!urlString || typeof urlString !== 'string') {
    throw new BadRequestError('Webhook URL is required');
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new BadRequestError('Invalid webhook URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new BadRequestError('Webhook URL protocol must be HTTP or HTTPS');
  }

  // Non-production exception: allow localhost for local testing and benchmarks
  if (allowLocal) {
    return;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block loopback addresses
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    throw new BadRequestError(
      'Webhook URL cannot target loopback addresses in production',
    );
  }

  // Block cloud metadata services (AWS, GCP, Azure, OpenStack)
  if (
    hostname === '169.254.169.254' ||
    hostname.endsWith('.internal') ||
    hostname.startsWith('169.254.')
  ) {
    throw new BadRequestError(
      'Webhook URL cannot target internal cloud metadata services',
    );
  }

  // Block RFC 1918 private IPv4 subnets
  const isPrivateIpv4 =
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^127\./.test(hostname) ||
    /^0\./.test(hostname);

  if (isPrivateIpv4) {
    throw new BadRequestError(
      'Webhook URL cannot target private network addresses in production',
    );
  }
}
