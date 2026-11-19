import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Globe,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Loader2,
  Check,
  LayoutTemplate,
  Copy,
  FilePlus2,
  Newspaper,
  FileText,
} from 'lucide-react';
import { collectionsApi } from '../../api/collections.api';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import { useCmsToast } from '@/hooks/useCmsToast';
import { BlogTypePicker } from '@/features/blog/components/BlogTypePicker';
import { BLOG_TYPES } from '@/features/blog/constants/blogTypes';
import { blogApi } from '@/features/blog/api/blog.api';
import {
  DEFAULT_ARTICLE_SETTINGS,
  normalizeUrlPrefix,
} from '@/hooks/useSiteConfig';
import type { ContentCollectionMeta } from '@/features/posts/types/posts.types';
import { getStarterPagesForCategory } from '../../constants/starter-pages.constants';
import { toSlug as slugify } from '@/utils/apiId.util';
import type {
  CreateSiteWizardModalProps,
  WizardStepId as StepId,
  WizardStartMode as StartMode,
} from '../../types/createSiteWizard.types';

export type { CreateSiteWizardModalProps, StepId, StartMode };

const OptionCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}> = ({ selected, onClick, icon, title, description, children }) => (
  <div
    className={`rounded-xl border transition-colors ${
      selected
        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
        : 'border-border bg-card hover:border-primary/40'
    }`}
  >
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="w-full text-left p-4 flex items-start gap-3"
    >
      <span
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border'
        }`}
      >
        {selected && <Check size={10} />}
      </span>
      {icon && (
        <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">
          {description}
        </span>
      </span>
    </button>
    {selected && children && <div className="px-4 pb-4 pl-11">{children}</div>}
  </div>
);

export const CreateSiteWizardModal: React.FC<CreateSiteWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useCmsToast();

  // Basics
  const [siteName, setSiteName] = useState('');
  const [siteSlug, setSiteSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'staging'>('live');

  // How to start
  const [startMode, setStartMode] = useState<StartMode>('blank');
  const [sourceSiteId, setSourceSiteId] = useState('');
  const [templateId, setTemplateId] = useState('');

  // Articles
  const [hasArticles, setHasArticles] = useState(true);
  const [blogTypeIds, setBlogTypeIds] = useState<string[]>(['engineering']);
  const [urlPrefix, setUrlPrefix] = useState(
    DEFAULT_ARTICLE_SETTINGS.urlPrefix,
  );

  // Starter pages
  const [starterPages, setStarterPages] = useState<Record<string, boolean>>({
    home: true,
    about: true,
    contact: true,
    services: false,
  });

  const [stepIndex, setStepIndex] = useState(0);

  const { data: rawCollections } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const existingSites = useMemo(
    () => extractArrayPayload<ContentCollectionMeta>(rawCollections),
    [rawCollections],
  );
  const templates = useMemo(
    () => postsApi.getSharedTemplates(existingSites),
    [existingSites],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId],
  );
  const sourceSite = useMemo(
    () => existingSites.find((s) => s.id === sourceSiteId),
    [existingSites, sourceSiteId],
  );

  const activeCategory = useMemo(() => {
    if (startMode === 'template' && selectedTemplate) {
      return selectedTemplate.category || 'general';
    }
    if (startMode === 'existing' && sourceSite) {
      return (sourceSite.metadata?.category as string) || 'general';
    }
    return 'general';
  }, [startMode, selectedTemplate, sourceSite]);

  const availableStarterPages = useMemo(
    () => getStarterPagesForCategory(activeCategory),
    [activeCategory],
  );

  // Synchronize starter page selections when template category changes
  useEffect(() => {
    const nextSelection: Record<string, boolean> = {};
    availableStarterPages.forEach((p, idx) => {
      nextSelection[p.key] = idx < 3;
    });
    setStarterPages(nextSelection);
  }, [availableStarterPages]);

  const steps: StepId[] = useMemo(
    () =>
      hasArticles
        ? ['basics', 'start', 'articles', 'blog', 'pages', 'review']
        : ['basics', 'start', 'articles', 'pages', 'review'],
    [hasArticles],
  );
  const step = steps[stepIndex] ?? 'basics';
  const finalSlug = siteSlug || slugify(siteName);

  const slugTaken = existingSites.some((s) => s.slug === finalSlug);

  const stepError = (): string | null => {
    switch (step) {
      case 'basics':
        if (!siteName.trim()) return 'Give your website a name to continue.';
        if (!finalSlug) return 'The name needs at least one letter or number.';
        if (slugTaken)
          return 'A website with this address already exists. Try a different name.';
        return null;
      case 'start':
        if (startMode === 'existing' && !sourceSiteId)
          return 'Pick the website to copy from.';
        if (startMode === 'template' && !templateId)
          return 'Pick a template to continue.';
        return null;
      case 'blog':
        if (blogTypeIds.length === 0)
          return 'Pick at least one kind of blog post, or go back and choose pages only.';
        return null;
      default:
        return null;
    }
  };
  const error = stepError();

  const handleNameChange = (name: string) => {
    setSiteName(name);
    const generated = slugify(name);
    setSiteSlug(generated);
    if (!domain || domain.endsWith('.acme.com')) {
      setDomain(generated ? `${generated}.acme.com` : '');
    }
  };

  const resetAndClose = () => {
    setStepIndex(0);
    onClose();
  };

  const createSiteMutation = useMutation({
    mutationFn: async () => {
      const finalDomain = domain || `${finalSlug}.acme.com`;

      // 1. Create the website, optionally starting from another site or template
      let created: { id: string; metadata?: Record<string, unknown> };
      if (startMode === 'existing') {
        const source = existingSites.find((s) => s.id === sourceSiteId);
        if (!source)
          throw new Error('The website to copy from no longer exists.');
        created = await postsApi.forkSchema(source, siteName.trim(), finalSlug);
      } else if (startMode === 'template') {
        const tpl = templates.find((t) => t.id === templateId);
        if (!tpl)
          throw new Error('The selected template is no longer available.');
        created = await postsApi.forkTemplate(tpl, siteName.trim(), finalSlug);
      } else {
        created = await collectionsApi.createSchema({
          name: siteName.trim(),
          slug: finalSlug,
          description: `Digital property for ${siteName.trim()} (${finalDomain})`,
        });
      }

      // 2. Save the answers from the wizard as the website's configuration
      const pickedPages = availableStarterPages.filter(
        (p) => starterPages[p.key],
      );
      await collectionsApi.updateSchema(created.id, {
        metadata: {
          ...(created.metadata ?? {}),
          domain: finalDomain,
          status: environment,
          hasArticles,
          starterPages: pickedPages.map((p) => p.key),
          articles: hasArticles
            ? { sectionName: 'Blog', urlPrefix: normalizeUrlPrefix(urlPrefix) }
            : undefined,
        },
      });

      // 3. Create the starter pages with actual visual layouts and distinct custom schemas
      const failed: string[] = [];
      for (const p of pickedPages) {
        try {
          await collectionsApi.createPage(finalSlug, {
            title: p.title,
            slug: p.slug,
            description: p.description,
            body: p.body,
            _schemas: p.schemas,
          });
        } catch (err) {
          console.error(
            `CreateSiteWizard: failed to create page "${p.title}"`,
            err,
          );
          failed.push(p.title);
        }
      }

      // 4. Create the blog pages (one per chosen blog type) with their templates
      if (hasArticles) {
        for (const id of blogTypeIds) {
          const def = BLOG_TYPES.find((t) => t.id === id);
          if (!def) continue;
          try {
            await blogApi.createBlogType(
              finalSlug,
              def,
              normalizeUrlPrefix(urlPrefix),
            );
          } catch (err) {
            console.error(
              `CreateSiteWizard: failed to create blog type "${def.name}"`,
              err,
            );
            failed.push(`${def.name} blog`);
          }
        }
      }

      return { slug: finalSlug, failedPages: failed };
    },
    onSuccess: ({ slug, failedPages }) => {
      queryClient.invalidateQueries({ queryKey: ['post-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      if (failedPages.length > 0) {
        toast.show({
          title: 'Website created',
          message: `"${siteName}" is ready, but these could not be created: ${failedPages.join(', ')}. You can add them later from Pages & Sitemap or Site Settings.`,
          type: 'warning',
        });
      } else {
        toast.show({
          title: 'Website created',
          message: `"${siteName}" is ready with your starter pages.`,
          type: 'success',
        });
      }
      resetAndClose();
      if (onSuccess) onSuccess(slug);
      else navigate(`/sites/${slug}/posts`);
    },
    onError: (err) => {
      toast.show({
        title: 'Could not create the website',
        message:
          err instanceof Error && err.message
            ? err.message
            : 'Something went wrong while creating the website. Please try again.',
        type: 'error',
      });
    },
  });

  if (!isOpen) return null;

  const isLast = step === 'review';
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const inputClass =
    'w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create a New Website"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                CREATE A NEW WEBSITE
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Question {stepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-1 bg-muted" aria-hidden>
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
          {step === 'basics' && (
            <>
              <h3 className="text-base font-semibold text-foreground">
                What should we call your website?
              </h3>
              <div>
                <label
                  htmlFor="wiz-name"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Website name <span className="text-destructive">*</span>
                </label>
                <input
                  id="wiz-name"
                  autoFocus
                  type="text"
                  value={siteName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme EU Hub, Marketing Portal"
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="wiz-domain"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Website address
                </label>
                <input
                  id="wiz-domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acme-eu.acme.com"
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  You can change this later in Site Settings.
                </p>
              </div>
              <div
                role="radiogroup"
                aria-label="Environment"
                className="grid grid-cols-2 gap-3"
              >
                <OptionCard
                  selected={environment === 'live'}
                  onClick={() => setEnvironment('live')}
                  title="Live"
                  description="Visitors can see it"
                />
                <OptionCard
                  selected={environment === 'staging'}
                  onClick={() => setEnvironment('staging')}
                  title="Staging"
                  description="Private, for testing"
                />
              </div>
            </>
          )}

          {step === 'start' && (
            <>
              <h3 className="text-base font-semibold text-foreground">
                How would you like to start?
              </h3>
              <div
                role="radiogroup"
                aria-label="Starting point"
                className="space-y-3"
              >
                <OptionCard
                  selected={startMode === 'blank'}
                  onClick={() => setStartMode('blank')}
                  icon={<FilePlus2 size={16} />}
                  title="Start fresh"
                  description="A clean website with the standard page structure."
                />
                <OptionCard
                  selected={startMode === 'existing'}
                  onClick={() => setStartMode('existing')}
                  icon={<Copy size={16} />}
                  title="Copy one of my websites"
                  description="Reuse the sections and fields of a website you already have. Its content is not copied."
                >
                  <select
                    aria-label="Website to copy"
                    value={sourceSiteId}
                    onChange={(e) => setSourceSiteId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose a website…</option>
                    {existingSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </OptionCard>
                <OptionCard
                  selected={startMode === 'template'}
                  onClick={() => setStartMode('template')}
                  icon={<LayoutTemplate size={16} />}
                  title="Use a ready-made template"
                  description="Pick a prepared structure such as a blog, shop or course site."
                >
                  <select
                    aria-label="Template"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose a template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {selectedTemplate.description}
                    </p>
                  )}
                </OptionCard>
              </div>
            </>
          )}

          {step === 'articles' && (
            <>
              <h3 className="text-base font-semibold text-foreground">
                Does this website need a blog?
              </h3>
              <div
                role="radiogroup"
                aria-label="Articles"
                className="space-y-3"
              >
                <OptionCard
                  selected={hasArticles}
                  onClick={() => setHasArticles(true)}
                  icon={<Newspaper size={16} />}
                  title="Yes, add a blog"
                  description="Choose from ready-made blog types and write posts in a distraction-free studio."
                />
                <OptionCard
                  selected={!hasArticles}
                  onClick={() => setHasArticles(false)}
                  icon={<FileText size={16} />}
                  title="No, pages only"
                  description="Focus on updating page content such as the hero, features and FAQs. You can add a blog later in Site Settings."
                />
              </div>
            </>
          )}

          {step === 'blog' && (
            <>
              <h3 className="text-base font-semibold text-foreground">
                What kind of blog posts will you publish?
              </h3>
              <p className="text-xs text-muted-foreground -mt-2">
                Each kind comes with ready-made fields and a blog page that is
                already connected, so you can just write and publish. Pick as
                many as you need.
              </p>
              <BlogTypePicker
                selected={blogTypeIds}
                onChange={setBlogTypeIds}
              />
              <div>
                <label
                  htmlFor="wiz-prefix"
                  className="block text-xs font-semibold text-foreground mb-1.5"
                >
                  Blog address prefix
                </label>
                <input
                  id="wiz-prefix"
                  type="text"
                  value={urlPrefix}
                  onChange={(e) => setUrlPrefix(e.target.value)}
                  className={`${inputClass} font-mono max-w-xs`}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  e.g. {normalizeUrlPrefix(urlPrefix)}/
                  {blogTypeIds[0] ?? 'engineering'}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Need something different? A developer can create a custom blog
                type later in Site Settings.
              </p>
            </>
          )}

          {step === 'pages' && (
            <>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Which starter pages should we set up for you?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each page includes ready visual designs and connected schemas
                  configured for the page builder.
                </p>
              </div>
              <div className="space-y-2">
                {availableStarterPages.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <input
                      id={`starter-page-${p.key}`}
                      type="checkbox"
                      checked={!!starterPages[p.key]}
                      onChange={(e) =>
                        setStarterPages((prev) => ({
                          ...prev,
                          [p.key]: e.target.checked,
                        }))
                      }
                      className="mt-1 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <label
                      htmlFor={`starter-page-${p.key}`}
                      aria-label={p.title}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {p.title}
                        </span>
                        <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          {p.slug}
                        </span>
                        {p.badge && (
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {p.description}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <h3 className="text-base font-semibold text-foreground">
                Ready to launch?
              </h3>
              <dl className="rounded-xl border border-border divide-y divide-border text-sm">
                {[
                  ['Name', siteName],
                  ['Address', domain || `${finalSlug}.acme.com`],
                  ['Environment', environment === 'live' ? 'Live' : 'Staging'],
                  [
                    'Starting point',
                    startMode === 'blank'
                      ? 'Start fresh'
                      : startMode === 'existing'
                        ? `Copy of ${sourceSite?.name ?? 'a website'}`
                        : (selectedTemplate?.title ?? 'Template'),
                  ],
                  [
                    'Blog',
                    hasArticles
                      ? `${blogTypeIds
                          .map(
                            (id) => BLOG_TYPES.find((t) => t.id === id)?.name,
                          )
                          .filter(Boolean)
                          .join(', ')} at ${normalizeUrlPrefix(urlPrefix)}`
                      : 'Off (pages only)',
                  ],
                  [
                    'Starter pages',
                    availableStarterPages
                      .filter((p) => starterPages[p.key])
                      .map((p) => p.title)
                      .join(', ') || 'None',
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 px-4 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground text-right">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0 || createSiteMutation.isPending}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {isLast ? (
            <button
              type="button"
              disabled={createSiteMutation.isPending}
              onClick={() => createSiteMutation.mutate()}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {createSiteMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Rocket size={14} />
              )}
              {createSiteMutation.isPending ? 'Creating…' : 'Create website'}
            </button>
          ) : (
            <button
              type="button"
              disabled={Boolean(error)}
              onClick={() =>
                setStepIndex((i) => Math.min(steps.length - 1, i + 1))
              }
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
