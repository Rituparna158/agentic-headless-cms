import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Palette, Plus, Edit2, Lock, Loader2, Layout } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CMS_THEME_CLASSES } from '@/tokens/colorTokens';
import { postsApi, extractArrayPayload } from '../../posts/api/posts.api';
import type { PageEntry } from '@/types/content.types';
import type { DeveloperTemplateItem } from '../types/developer.types';

export const DeveloperTemplatesPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();

  // Fetch real pages and layout templates for the CURRENT website
  const { data: rawPages, isLoading } = useQuery({
    queryKey: ['site-templates', siteId],
    queryFn: () => (siteId ? postsApi.listPagesForCollection(siteId) : []),
    enabled: Boolean(siteId),
    staleTime: 5 * 60 * 1000,
  });

  const templates: DeveloperTemplateItem[] = useMemo(() => {
    const pages = extractArrayPayload<PageEntry>(rawPages);
    return pages.map((p) => {
      const title = p.title || (p.data?.title as string) || p.slug;
      const slug = p.slug || (p.data?.slug as string) || p.id;
      const schemas =
        (p.data?._schemas as Array<{ name?: string; slug?: string }>) || [];
      const schemaNames = schemas.map((s) => s.name || s.slug).filter(Boolean);

      return {
        id: p.id,
        title: `${title} Layout Template`,
        slug: slug.replace(/^\//, ''),
        description: `Visual layout template bound to page route /${slug.replace(/^\//, '')}`,
        boundSchema:
          schemaNames.length > 0
            ? schemaNames.join(', ')
            : 'Default Visual Layout',
        pageId: p.id,
      };
    });
  }, [rawPages]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-200">
      <header className="px-8 py-5 border-b border-border bg-card/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/" className="hover:text-foreground transition-colors">
              Websites
            </Link>
            <span>/</span>
            <span className="capitalize">{siteId}</span>
            <span>/</span>
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <Lock size={11} /> Developer Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="h-6 w-6 text-amber-500" />
            Page Layout Templates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visual HTML & CSS layout blocks and component templates scoped to{' '}
            {siteId || 'this website'}.
          </p>
        </div>

        <Link
          to={`/sites/${siteId}/pages`}
          className={CMS_THEME_CLASSES.buttons.primary}
        >
          <Plus size={14} />
          <span>New Page Layout</span>
        </Link>
      </header>

      {/* Role-Gate Developer Notice */}
      <div className="px-8 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500 flex items-center gap-2 font-medium">
        <Lock size={13} className="shrink-0" />
        <span>
          Layout templates define visual rendering structures for your site
          pages without locking content.
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-xs">Loading layout templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
            <Layout className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">
              No layout templates found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add pages to this website to configure their visual layout
              templates.
            </p>
            <Link
              to={`/sites/${siteId}/pages`}
              className={CMS_THEME_CLASSES.buttons.primary}
            >
              <Plus size={14} />
              <span>Create First Page</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col hover:border-amber-500/50 transition-all group"
              >
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Layout Block
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      /{tpl.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-amber-500 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Bound Schema:</span>
                    <span className="font-semibold text-foreground truncate max-w-[160px]">
                      {tpl.boundSchema}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border-t border-border flex items-center justify-end gap-2">
                  <Link
                    to={`/sites/${siteId}/pages/${tpl.pageId}`}
                    className={`${CMS_THEME_CLASSES.buttons.secondary} text-xs py-1 px-2.5`}
                  >
                    <Edit2 size={12} />
                    <span>Open in Page Builder</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
