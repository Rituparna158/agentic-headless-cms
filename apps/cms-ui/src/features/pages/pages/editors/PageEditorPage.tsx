import {
  useState,
  useCallback,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Eye } from 'lucide-react';

import { pagesApi } from '../../api/pages.api';
import { usePageSchema } from '../../hooks/usePageSchema';
import { GrapesJSData } from './types';
import { PageBuilderDesign } from '@mindfiredigital/page-builder-react';

const CustomBuilderEditor = lazy(
  () => import('../../components/CustomBuilderEditor'),
);
import { usePageBuilderStore } from '../../components/page-builder/stores/pageBuilderStore';
import { GrapesJSEditor } from './GrapesJSEditor';

function slugify(text: string): string {
  return (
    '/' +
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const schemaQuery = usePageSchema();

  const pageQuery = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesApi.getPage(id!),
    enabled: !!id && !!schemaQuery.data,
  });

  (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ = false;

  useEffect(() => {
    usePageBuilderStore.getState().resetStore();
  }, [id]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [initialBody, setInitialBody] = useState<unknown>(undefined);
  const [isBuilderReady, setIsBuilderReady] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState<'grapesjs' | 'custom'>(
    'grapesjs',
  );

  const bodyRef = useRef<unknown>([]);

  useEffect(() => {
    if (pageQuery.data) {
      setTitle(pageQuery.data.data.title);
      setSlug(pageQuery.data.data.slug);

      const bodyData = pageQuery.data.data.body as
        | Record<string, unknown>
        | unknown[];

      // Determine initial builder if not yet set (on first load)
      let currentBuilder = activeBuilder;
      if (!isBuilderReady) {
        if (Array.isArray(bodyData) && bodyData.length > 0) {
          currentBuilder = 'custom';
        } else if (
          (bodyData as Record<string, unknown>)?.builder === 'custom'
        ) {
          currentBuilder = 'custom';
        } else {
          currentBuilder = 'grapesjs';
        }
        setActiveBuilder(currentBuilder);
      }

      if (currentBuilder === 'grapesjs') {
        const safeBodyData =
          (bodyData as Record<string, unknown>)?.builder === 'grapesjs'
            ? bodyData
            : {
                builder: 'grapesjs',
                html: '',
                css: '',
                components: [],
                styles: [],
              };
        setInitialBody(safeBodyData);
        bodyRef.current = safeBodyData;
      } else {
        const safeBodyData = Array.isArray(bodyData) ? bodyData : [];
        setInitialBody(safeBodyData);
        bodyRef.current = safeBodyData;
      }
      setIsBuilderReady(true);
    }
  }, [pageQuery.data, activeBuilder, isBuilderReady]);

  const updateMutation = useMutation({
    mutationFn: () =>
      pagesApi.updatePage(id!, {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        body: bodyRef.current ?? [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['page', id] });
      alert('Page saved successfully!');
    },
    onError: (error) => {
      console.error('Save failed:', error);
      alert('Failed to save page. Please check your connection or try again.');
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
  };

  const handleDesignChange = useCallback((newDesign: unknown) => {
    bodyRef.current = newDesign;
  }, []);

  useEffect(() => {
    // Left intentionally blank if we need future initialization,
    // otherwise the hook could be removed entirely.
  }, []);

  const handleSave = () => {
    if (!title.trim()) return;
    updateMutation.mutate();
  };

  if (pageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Page not found</p>
        <button
          onClick={() => navigate('/pages')}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Back to Pages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pages')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Page Title"
              className="text-lg font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            />
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="/page-slug"
              className="text-sm font-mono bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              window.open(
                `/preview${slug.startsWith('/') ? '' : '/'}${slug}`,
                '_blank',
              )
            }
            disabled={!slug}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Page Builder Canvas */}
      <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
        <style>{`
          #functions-panel {
            overflow-y: auto !important;
            max-height: calc(100vh - 120px) !important;
            padding-bottom: 40px !important;
          }
        `}</style>
        {isBuilderReady && activeBuilder === 'custom' && (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Loading custom builder...
              </div>
            }
          >
            <CustomBuilderEditor
              id={id!}
              initialDesign={initialBody as PageBuilderDesign}
              onChange={handleDesignChange}
              title={title}
            />
          </Suspense>
        )}
        {isBuilderReady && activeBuilder === 'grapesjs' && (
          <GrapesJSEditor
            initialData={initialBody as Partial<GrapesJSData>}
            onChange={handleDesignChange}
            brandTitle={title || 'Page Builder'}
          />
        )}
      </div>
    </div>
  );
}
