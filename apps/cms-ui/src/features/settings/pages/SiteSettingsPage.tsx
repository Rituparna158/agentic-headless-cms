import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  Globe,
  Upload,
  ShieldAlert,
  FileText,
  Layers,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { useCmsToast } from '@/hooks/useCmsToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BlogSetupPanel } from '@/features/blog/components/BlogSetupPanel';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { collectionsApi } from '@/features/collections/api/collections.api';
import { postsApi } from '@/features/posts/api/posts.api';
import { useCan } from '@/hooks/useCan';
import { useSiteConfig, normalizeUrlPrefix } from '@/hooks/useSiteConfig';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { DeleteSiteModal } from '@/components/modals/DeleteSiteModal';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type { SiteSettingsTab } from '../types/settings.types';

export const SiteSettingsPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SiteSettingsTab>('general');

  const config = useSiteConfig(siteId);
  const activeSite = config.site;
  const queryClient = useQueryClient();
  const roles = useAuthStore((st) => st.user?.roles);
  const can = useCan(siteId);
  const canManageSettings = can('manage_settings');
  const isAdmin = Boolean(
    roles?.some((r: string) =>
      ['admin', 'super_admin'].includes(r.toLowerCase()),
    ),
  );
  const canDeleteSite = canManageSettings || isAdmin;
  const canCreateCustomBlog = Boolean(
    roles?.some((r: string) =>
      ['admin', 'super_admin', 'developer', 'designer'].includes(
        r.toLowerCase(),
      ),
    ),
  );
  const toast = useCmsToast();

  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [articlesEnabled, setArticlesEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicWebsite, setPublicWebsite] = useState(false);
  const [acceptSubmissions, setAcceptSubmissions] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [pickingLogo, setPickingLogo] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [seoTitleTemplate, setSeoTitleTemplate] = useState('%page% | %site%');
  const [seoDescription, setSeoDescription] = useState('');
  const [socialImage, setSocialImage] = useState('');
  const [urlPrefix, setUrlPrefix] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  // Live count of content entries belonging to this site
  const { data: entriesCountData } = useQuery({
    queryKey: ['site-entries-count', activeSite?.slug],
    queryFn: () =>
      postsApi.listPagesPaged(activeSite!.slug, { page: 1, pageSize: 1 }),
    enabled: Boolean(activeSite?.slug),
    staleTime: 30 * 1000,
  });
  const totalEntries =
    entriesCountData?.total ??
    activeSite?.entryCount ??
    activeSite?.linkedPagesCount ??
    0;

  const siteMeta = (activeSite?.metadata ?? {}) as Record<string, unknown>;
  const seoMeta = (siteMeta.seo ?? {}) as Record<string, string>;

  // Load the saved configuration once the website is available
  const loadedSiteId = React.useRef<string | null>(null);
  useEffect(() => {
    if (!activeSite || loadedSiteId.current === activeSite.id) return;
    loadedSiteId.current = activeSite.id;
    setSiteName(activeSite.name);
    setDomain(config.domain);
    setArticlesEnabled(config.articlesEnabled);
    setMaintenanceMode(config.maintenanceMode);
    setPublicWebsite(siteMeta.publicWebsite === true);
    setAcceptSubmissions(siteMeta.acceptSubmissions === true);
    setLogoUrl(typeof siteMeta.logoUrl === 'string' ? siteMeta.logoUrl : '');
    setSeoTitleTemplate(seoMeta.titleTemplate || '%page% | %site%');
    setSeoDescription(seoMeta.description || '');
    setSocialImage(seoMeta.socialImage || '');
    setUrlPrefix(config.article.urlPrefix);
    setSavedSnapshot(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite]);

  const currentValues = {
    siteName,
    domain,
    articlesEnabled,
    maintenanceMode,
    publicWebsite,
    acceptSubmissions,
    logoUrl,
    seoTitleTemplate,
    seoDescription,
    socialImage,
    urlPrefix,
  };
  const currentSnapshot = JSON.stringify(currentValues);
  // The first snapshot after loading is the clean baseline
  useEffect(() => {
    if (loadedSiteId.current && savedSnapshot === null) {
      setSavedSnapshot(currentSnapshot);
    }
  }, [currentSnapshot, savedSnapshot]);
  const isDirty = savedSnapshot !== null && savedSnapshot !== currentSnapshot;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeSite) throw new Error('Website not found');
      return collectionsApi.updateSchema(activeSite.id, {
        name: siteName.trim() || activeSite.name,
        metadata: {
          ...siteMeta,
          domain: domain.trim(),
          hasArticles: articlesEnabled,
          maintenanceMode,
          publicWebsite,
          acceptSubmissions: publicWebsite && acceptSubmissions,
          logoUrl,
          seo: {
            titleTemplate: seoTitleTemplate,
            description: seoDescription,
            socialImage,
          },
          articles: {
            sectionName: 'Blog',
            urlPrefix: normalizeUrlPrefix(urlPrefix),
          },
        },
      });
    },
    onSuccess: () => {
      setSavedSnapshot(currentSnapshot);
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      toast.show({
        title: 'Settings saved',
        message: 'Your website settings were updated.',
        type: 'success',
      });
    },
    onError: () => {
      toast.show({
        title: 'Could not save settings',
        message: 'Please check your connection and try again.',
        type: 'error',
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const deleteSiteMutation = useMutation({
    mutationFn: async (force: boolean) => {
      if (!activeSite) throw new Error('Website not found');
      return collectionsApi.deleteSchema(activeSite.id, force);
    },
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      toast.show({
        title: 'Website deleted',
        message: `"${activeSite?.name}" was permanently deleted.`,
        type: 'success',
      });
      navigate('/');
    },
    onError: (err: unknown) => {
      const errorObj = err as {
        response?: {
          data?: { error?: { message?: string }; message?: string };
        };
        message?: string;
      };
      const msg =
        errorObj?.response?.data?.error?.message ||
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Could not delete website. Please ensure Force Delete is enabled if content exists.';
      setDeleteErrorMessage(msg);
      toast.show({
        title: 'Could not delete website',
        message: msg,
        type: 'error',
      });
    },
  });

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      {/* Header */}
      <header className="px-8 py-5 border-b border-border bg-card/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Site Settings & Module Config
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage domain routing, identity, and content modules for this
            website property.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className={`${CMS_THEME_CLASSES.buttons.primary} disabled:opacity-50`}
        >
          <Save size={14} />
          <span>Save Changes</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="px-8 border-b border-border bg-muted/30 flex gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          General Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('domains')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'domains'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Domains & SSL
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'seo'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          SEO & Social Defaults
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'modules'
              ? 'border-primary text-foreground font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Features & Modules
        </button>
      </div>

      {/* Content Form Body */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-8">
        {activeTab === 'general' && (
          <>
            {/* Section 1: Website Identity */}
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Website Identity
                </h2>
                <p className="text-xs text-muted-foreground">
                  Define the public name and core domain identifying this
                  property.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="h-14 w-14 shrink-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={getMediaFileUrl(logoUrl)}
                      alt="Site logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Upload size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-foreground">
                    Logo
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Shown by the Logo block in the page builder, and used as the
                    sharing image when a page has none.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickingLogo(true)}
                  className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs`}
                >
                  {logoUrl ? 'Change' : 'Choose'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="site-display-name"
                    className="block text-xs font-medium text-foreground mb-1.5"
                  >
                    Site Display Name
                  </label>
                  <input
                    id="site-display-name"
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label
                    htmlFor="site-primary-domain"
                    className="block text-xs font-medium text-foreground mb-1.5"
                  >
                    Primary Domain
                  </label>
                  <div className="relative">
                    <Globe
                      size={14}
                      className="absolute left-3 top-2.5 text-muted-foreground"
                    />
                    <input
                      id="site-primary-domain"
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-foreground mb-1.5">
                  Favicon & Browser Icon
                </span>
                <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground border border-border">
                    🌐
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">
                      favicon-32x32.png
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PNG, ICO up to 512KB
                    </p>
                  </div>
                  <button
                    type="button"
                    className={CMS_THEME_CLASSES.buttons.secondary}
                  >
                    <Upload size={13} />
                    <span>Upload New</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            {canDeleteSite && (
              <section className="space-y-4 pt-6 border-t border-destructive/20">
                <div>
                  <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Danger Zone
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Irreversible actions that permanently delete this website
                    and its data.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Delete Website Property
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Permanently remove &quot;{activeSite?.name}&quot; and all
                      linked pages, posts, media links, and submissions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteErrorMessage(null);
                      setIsDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-lg transition-colors shrink-0 shadow-sm"
                  >
                    <Trash2 size={14} />
                    <span>Delete Website</span>
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'domains' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  Public website
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Lets anyone open your published pages at{' '}
                  <span className="font-mono">
                    /live/{activeSite?.slug ?? 'your-site'}
                  </span>{' '}
                  without logging in. Only published pages and posts are shown;
                  drafts and author details are never exposed. Save to apply.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={publicWebsite}
                aria-label="Public website"
                onClick={() => setPublicWebsite(!publicWebsite)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  publicWebsite ? 'bg-emerald-600' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    publicWebsite ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div
              className={`flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 ${publicWebsite ? '' : 'opacity-50'}`}
            >
              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  Accept form messages and comments
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Lets visitors send contact forms and leave comments. They are
                  saved in the <strong>Inbox</strong>; comments only appear on
                  your site after you approve them. Needs Public website to be
                  on.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={acceptSubmissions && publicWebsite}
                aria-label="Accept form messages and comments"
                disabled={!publicWebsite}
                onClick={() => setAcceptSubmissions(!acceptSubmissions)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                  acceptSubmissions && publicWebsite
                    ? 'bg-emerald-600'
                    : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    acceptSubmissions && publicWebsite
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Domains &amp; SSL
              </h2>
              <p className="text-xs text-muted-foreground">
                The address visitors use to reach this website.
              </p>
            </div>
            <div>
              <label
                htmlFor="settings-domain"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Primary Domain
              </label>
              <div className="relative max-w-md">
                <Globe
                  size={14}
                  className="absolute left-3 top-2.5 text-muted-foreground"
                />
                <input
                  id="settings-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card text-xs text-muted-foreground">
              SSL certificates and DNS verification are managed by your hosting
              provider. Contact your IT administrator to point a new domain at
              this website.
            </div>
          </section>
        )}

        {activeTab === 'seo' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                SEO &amp; Social Defaults
              </h2>
              <p className="text-xs text-muted-foreground">
                Fallback values used when a page does not set its own.
              </p>
            </div>
            <div className="max-w-xl space-y-4">
              <div>
                <label
                  htmlFor="seo-title"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Page Title Template
                </label>
                <input
                  id="seo-title"
                  type="text"
                  value={seoTitleTemplate}
                  onChange={(e) => setSeoTitleTemplate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Use <code>%page%</code> for the page title and{' '}
                  <code>%site%</code> for the site name.
                </p>
              </div>
              <div>
                <label
                  htmlFor="seo-desc"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Default Meta Description
                </label>
                <textarea
                  id="seo-desc"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {seoDescription.length}/160 characters recommended
                </p>
              </div>
              <div>
                <label
                  htmlFor="seo-image"
                  className="block text-xs font-medium text-foreground mb-1.5"
                >
                  Default Social Share Image URL
                </label>
                <input
                  id="seo-image"
                  type="text"
                  value={socialImage}
                  onChange={(e) => setSocialImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'modules' && (
          <>
            {/* Section 2: Content Module Activation */}
            <section className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Content Module Activation
                </h2>
                <p className="text-xs text-muted-foreground">
                  Turn publishing capabilities on or off without writing any
                  code.
                </p>
              </div>

              <div className="space-y-3">
                {/* Module 1: Static Pages */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Static Pages Engine
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Manages static site architecture, URLs, and section
                        templates.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                    Always Active
                  </span>
                </div>

                {/* Module 2: Articles & Storytelling */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Blog
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Enables the long-form storytelling canvas in the Posts
                        publishing studio.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArticlesEnabled(!articlesEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                      articlesEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                        articlesEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {articlesEnabled && (
                  <BlogSetupPanel
                    siteSlug={siteId ?? ''}
                    urlPrefix={urlPrefix}
                    onUrlPrefixChange={setUrlPrefix}
                    canCreateCustom={canCreateCustomBlog}
                  />
                )}

                {/* Module 3: Maintenance Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">
                        Maintenance Mode
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Directs all public visitors to a &ldquo;Coming Soon /
                        Maintenance&rdquo; splash screen.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                      maintenanceMode ? 'bg-amber-600' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                        maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      {pickingLogo && (
        <MediaAssetPickerModal
          isOpen
          title="Choose your logo"
          onClose={() => setPickingLogo(false)}
          onSelect={(asset) => {
            setLogoUrl(asset.url);
            setPickingLogo(false);
          }}
        />
      )}
      {isDeleteModalOpen && activeSite && (
        <DeleteSiteModal
          site={{
            id: activeSite.id,
            name: activeSite.name,
            slug: activeSite.slug,
            entryCount: totalEntries,
          }}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteErrorMessage(null);
          }}
          onConfirm={(force) => deleteSiteMutation.mutate(force)}
          isPending={deleteSiteMutation.isPending}
          isError={deleteSiteMutation.isError}
          errorMessage={deleteErrorMessage}
        />
      )}
    </div>
  );
};
