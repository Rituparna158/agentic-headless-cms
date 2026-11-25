export const ROUTES = {
  // Standalone & Authentication
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ACCEPT_INVITE: '/accept-invite',
  ACCESS_DENIED: '/access-denied',
  MFA_RESET_COMPLETE: '/mfa-reset-complete',
  REQUEST_ACCESS: '/request-access',
  ERROR: '/error',

  // Global Command Center Tier
  SITES: '/sites',
  USERS: '/users',
  ROLES: '/users/roles',
  MFA_REQUESTS: '/users/mfa-requests',
  SECURITY: '/security',
  AUDIT_LOGS: '/audit-logs',
  MEDIA: '/media',
  POSTS: '/posts',
  COLLECTIONS: '/collections',

  // Parameterised routes for collections
  collectionEntries: (schemaSlug: string) => `/collections/${schemaSlug}`,
  collectionPageEditor: (schemaSlug: string, pageId: string) =>
    `/collections/${schemaSlug}/${pageId}`,
  collectionPreview: (schemaSlug: string, path: string = '') =>
    `/collections/${schemaSlug}/preview/${path}`.replace(/\/+$/, ''),

  // Site Workspace Tier (scoped to siteId)
  site: (siteId: string) => `/sites/${siteId}`,
  sitePosts: (siteId: string) => `/sites/${siteId}/posts`,
  siteInbox: (siteId: string) => `/sites/${siteId}/inbox`,
  sitePostEditor: (siteId: string, pageId: string) =>
    `/sites/${siteId}/posts/editor/${pageId}`,
  siteBlogPostStudio: (siteId: string, pageId: string, postId: string) =>
    `/sites/${siteId}/posts/blog/${pageId}/${postId}`,
  sitePages: (siteId: string) => `/sites/${siteId}/pages`,
  sitePageEditor: (siteId: string, pageId: string) =>
    `/sites/${siteId}/pages/${pageId}`,
  siteMedia: (siteId: string) => `/sites/${siteId}/media`,
  siteMenus: (siteId: string) => `/sites/${siteId}/menus`,
  siteDesign: (siteId: string) => `/sites/${siteId}/design`,
  siteSettings: (siteId: string) => `/sites/${siteId}/settings`,
  siteTheme: (siteId: string) => `/sites/${siteId}/theme`,
  siteDeveloperSchemas: (siteId: string) =>
    `/sites/${siteId}/developer/schemas`,
  siteDeveloperTemplates: (siteId: string) =>
    `/sites/${siteId}/developer/templates`,
  sitePreview: (siteId: string, path: string = '') =>
    `/sites/${siteId}/preview/${path}`.replace(/\/+$/, ''),

  // Public live site
  publicLiveSite: (siteSlug: string, path: string = '') =>
    `/live/${siteSlug}/${path}`.replace(/\/+$/, ''),
} as const;

export type RouteKey = keyof typeof ROUTES;
