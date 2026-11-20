import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider, DialogProvider } from '@repo/shared-ui';
import { LiveAnnouncerProvider } from './components/ui/LiveAnnouncer';
import { AuthLayout } from './components/Layout/AuthLayout';
import { AuthGuard } from './components/Guard/AuthGuard';
import { AuthHydrator } from './components/Guard/AuthHydrator';
import { SiteLanding } from '@/components/Guard/SiteLanding';
import { RoleGuard } from './components/Guard/RoleGuard';
import { AdminOrSupportGuard } from './components/Guard/AdminOrSupportGuard';

const LoginPage = React.lazy(() =>
  import('./pages/Login/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const AccessDeniedPage = React.lazy(() =>
  import('./pages/AccessDenied/AccessDeniedPage').then((m) => ({
    default: m.AccessDeniedPage,
  })),
);
const ForgotPasswordPage = React.lazy(() =>
  import('./pages/ForgotPassword/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = React.lazy(() =>
  import('./pages/ResetPassword/ResetPasswordPage').then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const AcceptInvitePage = React.lazy(() =>
  import('./pages/AcceptInvite/AcceptInvitePage').then((m) => ({
    default: m.AcceptInvitePage,
  })),
);
const MfaResetCompletePage = React.lazy(() =>
  import('./pages/MfaResetComplete/MfaResetCompletePage').then((m) => ({
    default: m.MfaResetCompletePage,
  })),
);
const DashboardLayout = React.lazy(() =>
  import('./components/Layout/DashboardLayout').then((m) => ({
    default: m.DashboardLayout,
  })),
);
const SiteWorkspaceLayout = React.lazy(() =>
  import('./components/Layout/SiteWorkspaceLayout').then((m) => ({
    default: m.SiteWorkspaceLayout,
  })),
);
const DashboardHome = React.lazy(() =>
  import('./pages/Dashboard/DashboardHome').then((m) => ({
    default: m.DashboardHome,
  })),
);
const RolesAccessPage = React.lazy(() =>
  import('./features/access/pages/RolesAccessPage').then((m) => ({
    default: m.RolesAccessPage,
  })),
);
const UsersAccessPage = React.lazy(() =>
  import('./features/access/pages/UsersAccessPage').then((m) => ({
    default: m.UsersAccessPage,
  })),
);
const SecurityPage = React.lazy(() =>
  import('./pages/Security/SecurityPage').then((m) => ({
    default: m.SecurityPage,
  })),
);
const AuditLogPage = React.lazy(() =>
  import('./features/audit/pages/AuditLogPage').then((m) => ({
    default: m.AuditLogPage,
  })),
);
const RequestAccessPage = React.lazy(() =>
  import('./pages/RequestAccess/RequestAccessPage').then((m) => ({
    default: m.RequestAccessPage,
  })),
);
const MfaRequestsPage = React.lazy(() =>
  import('./features/access/pages/MfaRequestsPage').then((m) => ({
    default: m.MfaRequestsPage,
  })),
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFound/NotFoundPage').then((m) => ({
    default: m.NotFoundPage,
  })),
);
const GeneralErrorPage = React.lazy(() =>
  import('./pages/GeneralError/GeneralErrorPage').then((m) => ({
    default: m.GeneralErrorPage,
  })),
);
const CollectionsListPage = React.lazy(() =>
  import('./features/collections/pages/CollectionsListPage').then((m) => ({
    default: m.CollectionsListPage,
  })),
);
const CollectionEntriesPage = React.lazy(() =>
  import('./features/collections/pages/CollectionEntriesPage').then((m) => ({
    default: m.CollectionEntriesPage,
  })),
);
const PageEditorPage = React.lazy(() =>
  import('./features/collections/pages/editors/PageEditorPage').then((m) => ({
    default: m.PageEditorPage,
  })),
);
const PublicSitePage = React.lazy(() =>
  import('./features/render/PublicSitePage').then((m) => ({
    default: m.PublicSitePage,
  })),
);
const InboxPage = React.lazy(() =>
  import('./features/inbox/pages/InboxPage').then((m) => ({
    default: m.InboxPage,
  })),
);
const SiteContentPage = React.lazy(() =>
  import('./features/site-content/pages/SiteContentPage').then((m) => ({
    default: m.SiteContentPage,
  })),
);
const SitePreviewPage = React.lazy(() =>
  import('./features/render/SitePreviewPage').then((m) => ({
    default: m.SitePreviewPage,
  })),
);
const PostsManagementPage = React.lazy(() =>
  import('./features/posts/pages/PostsManagementPage').then((m) => ({
    default: m.PostsManagementPage,
  })),
);
const MediaLibraryPage = React.lazy(() =>
  import('./features/media/pages/MediaLibraryPage').then((m) => ({
    default: m.MediaLibraryPage,
  })),
);
const NavigationMenusPage = React.lazy(() =>
  import('./features/menus/pages/NavigationMenusPage').then((m) => ({
    default: m.NavigationMenusPage,
  })),
);
const SiteSettingsPage = React.lazy(() =>
  import('./features/settings/pages/SiteSettingsPage').then((m) => ({
    default: m.SiteSettingsPage,
  })),
);
const PagesHierarchyPage = React.lazy(() =>
  import('./features/pages-hierarchy/pages/PagesHierarchyPage').then((m) => ({
    default: m.PagesHierarchyPage,
  })),
);
const DeveloperSchemasPage = React.lazy(() =>
  import('./features/developer/pages/DeveloperSchemasPage').then((m) => ({
    default: m.DeveloperSchemasPage,
  })),
);
const DeveloperTemplatesPage = React.lazy(() =>
  import('./features/developer/pages/DeveloperTemplatesPage').then((m) => ({
    default: m.DeveloperTemplatesPage,
  })),
);
const PageContentEditorPage = React.lazy(() =>
  import('./features/posts/pages/PageContentEditorPage').then((m) => ({
    default: m.PageContentEditorPage,
  })),
);
const PostStudioPage = React.lazy(() =>
  import('./features/blog/pages/PostStudioPage').then((m) => ({
    default: m.PostStudioPage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const FullPageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Renders nothing; keeps the document title in sync with the route. */
const TitleSync = () => {
  useDocumentTitle();
  return null;
};

export const App = () => {
  return (
    <ErrorBoundary fallback={<GeneralErrorPage />}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider defaultPosition="bottom-right">
          <DialogProvider>
            <LiveAnnouncerProvider>
              <BrowserRouter>
                <TitleSync />
                <AuthHydrator>
                  <Suspense fallback={<FullPageLoader />}>
                    <Routes>
                      {/* Auth Routes */}
                      <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/access-denied"
                          element={<AccessDeniedPage />}
                        />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPasswordPage />}
                        />
                        <Route
                          path="/reset-password"
                          element={<ResetPasswordPage />}
                        />
                        <Route
                          path="/accept-invite"
                          element={<AcceptInvitePage />}
                        />
                        <Route
                          path="/mfa-reset-complete"
                          element={<MfaResetCompletePage />}
                        />
                        <Route
                          path="/request-access"
                          element={<RequestAccessPage />}
                        />
                      </Route>

                      {/* Protected Routes */}
                      <Route element={<AuthGuard />}>
                        {/* 1. Global Tier: Company Command Center Layout */}
                        <Route path="/" element={<DashboardLayout />}>
                          <Route index element={<DashboardHome />} />
                          <Route path="sites" element={<DashboardHome />} />
                          <Route
                            element={
                              <RoleGuard requiredCapability="manage_users" />
                            }
                          >
                            <Route path="users" element={<UsersAccessPage />} />
                            <Route
                              path="users/roles"
                              element={<RolesAccessPage />}
                            />
                          </Route>
                          <Route element={<AdminOrSupportGuard />}>
                            <Route
                              path="users/mfa-requests"
                              element={<MfaRequestsPage />}
                            />
                          </Route>
                          <Route
                            element={
                              <RoleGuard requiredCapability="manage_settings" />
                            }
                          >
                            <Route path="security" element={<SecurityPage />} />
                            <Route
                              path="audit-logs"
                              element={<AuditLogPage />}
                            />
                            <Route
                              path="audit-log"
                              element={<AuditLogPage />}
                            />
                          </Route>
                          <Route
                            element={
                              <RoleGuard
                                requiredCapability={[
                                  'manage_media',
                                  'manage_content',
                                ]}
                              />
                            }
                          >
                            <Route
                              path="media"
                              element={<MediaLibraryPage />}
                            />
                          </Route>

                          {/* Legacy Fallback Routes */}
                          <Route
                            element={
                              <RoleGuard
                                requiredCapability={[
                                  'manage_content',
                                  'publish_content',
                                ]}
                              />
                            }
                          >
                            <Route
                              path="posts"
                              element={<PostsManagementPage />}
                            />
                            <Route
                              path="posts/*"
                              element={<PostsManagementPage />}
                            />
                            <Route
                              path="collections"
                              element={<CollectionsListPage />}
                            />
                            <Route
                              path="collections/:schemaSlug"
                              element={<CollectionEntriesPage />}
                            />
                            <Route
                              path="collections/:schemaSlug/:pageId"
                              element={<PageEditorPage />}
                            />
                          </Route>
                          <Route path="*" element={<NotFoundPage />} />
                        </Route>

                        {/* 2. Site Workspace Tier: Scoped to Website with 2nd Sidebar */}
                        <Route
                          path="/sites/:siteId"
                          element={<SiteWorkspaceLayout />}
                        >
                          <Route index element={<SiteLanding />} />
                          <Route
                            element={
                              <RoleGuard
                                requiredCapability={[
                                  'manage_content',
                                  'publish_content',
                                ]}
                              />
                            }
                          >
                            <Route
                              path="posts"
                              element={<PostsManagementPage />}
                            />
                            <Route path="inbox" element={<InboxPage />} />
                            <Route
                              path="posts/editor/:pageId"
                              element={<PageContentEditorPage />}
                            />
                            <Route
                              path="posts/blog/:pageId/:postId"
                              element={<PostStudioPage />}
                            />
                            <Route
                              path="posts/*"
                              element={<PostsManagementPage />}
                            />
                            <Route
                              path="pages"
                              element={<PagesHierarchyPage />}
                            />
                            <Route
                              path="pages/:pageId"
                              element={<PageEditorPage />}
                            />
                          </Route>
                          <Route
                            element={
                              <RoleGuard
                                requiredCapability={[
                                  'manage_media',
                                  'manage_content',
                                ]}
                              />
                            }
                          >
                            <Route
                              path="media"
                              element={<MediaLibraryPage />}
                            />
                          </Route>
                          <Route
                            element={
                              <RoleGuard requiredCapability="manage_appearance" />
                            }
                          >
                            <Route
                              path="menus"
                              element={<NavigationMenusPage />}
                            />
                            <Route
                              path="design"
                              element={<SiteContentPage />}
                            />
                          </Route>
                          <Route
                            element={
                              <RoleGuard requiredCapability="manage_settings" />
                            }
                          >
                            <Route
                              path="settings"
                              element={<SiteSettingsPage />}
                            />
                          </Route>
                          {/* Role-Gated Developer Studio */}
                          <Route
                            element={
                              <RoleGuard requiredCapability="manage_settings" />
                            }
                          >
                            <Route
                              path="developer/schemas"
                              element={<DeveloperSchemasPage />}
                            />
                            <Route
                              path="developer/templates"
                              element={<DeveloperTemplatesPage />}
                            />
                          </Route>
                        </Route>

                        {/* Standalone Protected Routes (No Dashboard UI) */}
                        <Route
                          element={
                            <RoleGuard requiredCapability="manage_content" />
                          }
                        >
                          <Route
                            path="/collections/:schemaSlug/preview/*"
                            element={<SitePreviewPage />}
                          />
                          <Route
                            path="/sites/:siteId/preview/*"
                            element={<SitePreviewPage />}
                          />
                        </Route>
                      </Route>

                      {/* Public website (no login) */}
                      <Route
                        path="/live/:siteSlug/*"
                        element={<PublicSitePage />}
                      />

                      {/* Error Pages */}
                      <Route path="/error" element={<GeneralErrorPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </AuthHydrator>
              </BrowserRouter>
            </LiveAnnouncerProvider>
          </DialogProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
