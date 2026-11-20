export const APP_TITLE = 'Agentic CMS';

/** [path segment prefix, page title]; matched by longest prefix. */
export const ROUTE_TITLES: ReadonlyArray<readonly [string, string]> = [
  ['/login', 'Sign in'],
  ['/forgot-password', 'Forgot password'],
  ['/reset-password', 'Reset password'],
  ['/accept-invite', 'Accept invite'],
  ['/mfa-reset-complete', 'MFA reset'],
  ['/request-access', 'Request access'],
  ['/access-denied', 'Access denied'],
  ['/sites', 'Websites'],
  ['/users', 'Users & access'],
  ['/users/roles', 'Roles'],
  ['/users/mfa-requests', 'MFA requests'],
  ['/security', 'Security'],
  ['/audit-logs', 'Audit log'],
  ['/audit-log', 'Audit log'],
  ['/media', 'Media library'],
  ['/collections', 'Collections'],
  ['/posts', 'Content'],
  ['/error', 'Error'],
];
