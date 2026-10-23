import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  lazy,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@repo/logger/browser';

import {
  collectionsApi,
  PageBodyData,
} from '@/features/collections/api/collections.api';
import type { PageEntry, ContentCollectionMeta } from '@/types/content.types';
import { PageSideDrawer } from '@/components/PageSideDrawer';
import { GrapesJSData, GrapesJSEditorHandle } from './types';
import type { PageBuilderDesign } from '@mindfiredigital/page-builder-react';
import { TemplateImportModal } from '../../components/template/TemplateImportModal';
import { ExistingContentDialog } from '../../components/template/ExistingContentDialog';
import { VersionHistoryDrawer } from '../../components/template/VersionHistoryDrawer';
import {
  TemplateValidationResult,
  ImportActionChoice,
  ContentVersionRecord,
} from '../../types/template.types';
import { PageEditorHeader } from './components/PageEditorHeader';
import { DraftRecoveryBanner } from './components/DraftRecoveryBanner';
import {
  extractPageCustomSchemas,
  buildSchemaFields,
  buildAvailableSchemas,
  extractSchemaValues,
} from '../../utils/pageEditorSchema.util';
import { usePageBuilderStore } from '../../components/page-builder/stores/pageBuilderStore';
import { useCanvasAutoSave } from '../../hooks/useCanvasAutoSave';
import { useToast } from '@repo/shared-ui';
import { slugify } from '../../utils/slugify.util';
import { InlineErrorAlert } from '@/components/ui/InlineErrorAlert';
import { useLiveAnnouncer } from '@/components/ui/LiveAnnouncer';

const CustomBuilderEditor = lazy(
  () => import('../../components/CustomBuilderEditor'),
);
const GrapesJSEditor = lazy(() =>
  import('./GrapesJSEditor').then((m) => ({ default: m.GrapesJSEditor })),
);

export function PageEditorPage() {
  const { schemaSlug, pageId } = useParams<{
    schemaSlug: string;
    pageId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { announce } = useLiveAnnouncer();

  const pageQuery = useQuery({
    queryKey: ['page', schemaSlug, pageId],
    queryFn: ({ signal }) =>
      collectionsApi.getPage(schemaSlug!, pageId!, { signal }),
    enabled: !!schemaSlug && !!pageId,
  });

  const collectionQuery = useQuery({
    queryKey: ['schema', schemaSlug],
    queryFn: ({ signal }) =>
      collectionsApi.getSchemaBySlug(schemaSlug!, { signal }),
    enabled: !!schemaSlug,
  });
  const activeCollection = (collectionQuery.data ||
    null) as unknown as ContentCollectionMeta;

  const [isSchemaDrawerOpen, setIsSchemaDrawerOpen] = useState(false);

  (window as { __IS_CMS_PREVIEW__?: boolean }).__IS_CMS_PREVIEW__ = false;

  useEffect(() => {
    if (pageId) {
      usePageBuilderStore.getState().resetStoreForPage(pageId);
    }
  }, [pageId]);

  const pageData = pageQuery.data?.data as Record<string, unknown> | undefined;

  const pageCustomSchemas = useMemo(
    () => extractPageCustomSchemas(pageData),
    [pageData],
  );

  const schemaFields = useMemo(
    () => buildSchemaFields(pageCustomSchemas),
    [pageCustomSchemas],
  );

  const availableSchemas = useMemo(
    () => buildAvailableSchemas(pageCustomSchemas),
    [pageCustomSchemas],
  );

  const schemaValues = useMemo(() => extractSchemaValues(pageData), [pageData]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [initialBody, setInitialBody] = useState<unknown>(undefined);
  const [isBuilderReady, setIsBuilderReady] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState<'grapesjs' | 'custom'>(
    'grapesjs',
  );

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExistingDialogOpen, setIsExistingDialogOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const pendingTemplateResult = useRef<TemplateValidationResult | null>(null);
  const grapesEditorRef = useRef<GrapesJSEditorHandle>(null);
  const bodyRef = useRef<unknown>([]);

  const handleTemplateImport = (result: TemplateValidationResult) => {
    const isEmpty = grapesEditorRef.current?.isCanvasEmpty() ?? true;
    if (isEmpty) {
      grapesEditorRef.current?.loadTemplate(result, 'replace');
      toast.success('Template imported successfully!');
    } else {
      pendingTemplateResult.current = result;
      setIsExistingDialogOpen(true);
    }
  };

  const handleExistingContentConfirm = (choice: ImportActionChoice) => {
    if (pendingTemplateResult.current) {
      grapesEditorRef.current?.loadTemplate(
        pendingTemplateResult.current,
        choice,
      );
      if (choice === 'replace') {
        toast.success(
          'Template replaced canvas. You can press Ctrl+Z to undo.',
        );
      } else {
        toast.success('Template appended below existing content.');
      }
      pendingTemplateResult.current = null;
    }
  };

  const handleRevertSuccess = (revertedData: ContentVersionRecord['data']) => {
    if (revertedData.title) setTitle(revertedData.title);
    if (revertedData.slug) setSlug(revertedData.slug);
    if (revertedData.body) {
      grapesEditorRef.current?.loadRawData(
        revertedData.body as Partial<GrapesJSData>,
      );
    }
  };

  useEffect(() => {
    if (pageQuery.data) {
      const pData = (pageQuery.data.data || {}) as Record<string, unknown>;
      setTitle(typeof pData.title === 'string' ? pData.title : '');
      setSlug(typeof pData.slug === 'string' ? pData.slug : '');

      const bodyData =
        (pData.body as Record<string, unknown> | unknown[]) ?? undefined;

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

  const {
    isDirty,
    lastAutoSavedAt,
    hasRecoverableDraft,
    recoveredDraft,
    restoreDraft,
    discardDraft,
    clearLocalDraft,
  } = useCanvasAutoSave({
    pageId,
    schemaSlug,
    title,
    slug,
    bodyRef,
    activeBuilder,
    enabled: isBuilderReady,
    serverUpdatedAt: pageQuery.data?.updatedAt,
    onRestoreDraft: (draft) => {
      if (draft.title) setTitle(draft.title);
      if (draft.slug) setSlug(draft.slug);
      if (draft.body) {
        bodyRef.current = draft.body;
        if (draft.builderType === 'grapesjs') {
          grapesEditorRef.current?.loadRawData(
            draft.body as Partial<GrapesJSData>,
          );
        } else {
          setInitialBody(draft.body);
        }
      }
      announce('Recovered unsaved local draft onto canvas', 'polite');
      toast.success('Recovered unsaved local draft!');
    },
  });

  // Announce canvas hydration readiness
  useEffect(() => {
    if (isBuilderReady) {
      announce('Visual page builder hydrated and ready for editing', 'polite');
    }
  }, [isBuilderReady, announce]);

  // Announce recoverable draft detection
  useEffect(() => {
    if (hasRecoverableDraft) {
      announce(
        'Unsaved local draft detected from a previous session',
        'polite',
      );
    }
  }, [hasRecoverableDraft, announce]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const pData = (pageQuery.data?.data as Record<string, unknown>) || {};
      const sValues: Record<string, unknown> = {};
      const rawSchemas = pData._schemas;
      if (Array.isArray(rawSchemas)) {
        for (const s of rawSchemas as Array<{
          values?: Record<string, unknown>;
        }>) {
          if (s && s.values && typeof s.values === 'object') {
            Object.assign(sValues, s.values);
          }
        }
      }

      return collectionsApi.updatePage(schemaSlug!, pageId!, {
        ...sValues,
        ...pData,
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        body: bodyRef.current ?? [],
      });
    },
    onMutate: async () => {
      announce('Saving page changes to cloud...', 'polite');
      await queryClient.cancelQueries({
        queryKey: ['page', schemaSlug, pageId],
      });
      const previousPage = queryClient.getQueryData<PageEntry>([
        'page',
        schemaSlug,
        pageId,
      ]);

      queryClient.setQueryData<PageEntry>(
        ['page', schemaSlug, pageId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              title: title.trim(),
              slug: slug.trim() || slugify(title),
              body: bodyRef.current as PageBodyData,
            },
            updatedAt: new Date().toISOString(),
          };
        },
      );

      return { previousPage };
    },
    onSuccess: async () => {
      await clearLocalDraft();
      usePageBuilderStore.getState().markClean(pageId!);
      queryClient.invalidateQueries({ queryKey: ['pages', schemaSlug] });
      queryClient.invalidateQueries({ queryKey: ['page', schemaSlug, pageId] });
      announce('Page saved successfully to cloud', 'polite');
      toast.success('Page saved successfully!');
    },
    onError: (error, _variables, context) => {
      if (context?.previousPage) {
        queryClient.setQueryData(
          ['page', schemaSlug, pageId],
          context.previousPage,
        );
      }
      browserLogger.error('Save failed:', error);
      announce('Failed to save page changes to cloud', 'assertive');
      toast.error(
        'Failed to save page. Please check your connection or try again.',
      );
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    usePageBuilderStore.getState().markDirty(true);
    if (!slugManuallyEdited) {
      setSlug(slugify(newTitle));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugManuallyEdited(true);
    usePageBuilderStore.getState().markDirty(true);
  };

  const handleDesignChange = useCallback((newDesign: unknown) => {
    bodyRef.current = newDesign;
    usePageBuilderStore.getState().markDirty(true);
  }, []);

  const handleSave = () => {
    if (!title.trim() || !schemaSlug || !pageId) return;
    updateMutation.mutate();
  };

  if (pageQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (pageQuery.isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <InlineErrorAlert
          title="Failed to load page"
          message={pageQuery.error}
          onRetry={() => pageQuery.refetch()}
          isRetrying={pageQuery.isFetching}
          onBack={() => navigate(`/collections/${schemaSlug}`)}
          backText="Back to Pages"
          className="max-w-xl w-full"
        />
      </div>
    );
  }

  if (!pageQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground text-base">Page not found</p>
        <button
          onClick={() => navigate(`/collections/${schemaSlug}`)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 text-sm shadow-sm"
        >
          Back to Pages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh]">
      <PageEditorHeader
        schemaSlug={schemaSlug!}
        slug={slug}
        title={title}
        onTitleChange={handleTitleChange}
        onSlugChange={handleSlugChange}
        activeBuilder={activeBuilder}
        availableSchemasCount={availableSchemas.length}
        onOpenSchemaDrawer={() => setIsSchemaDrawerOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
        lastAutoSavedAt={lastAutoSavedAt}
        isSaving={updateMutation.isPending}
        isDirty={isDirty}
        onSave={handleSave}
        onNavigateBack={() => navigate(`/collections/${schemaSlug}`)}
      />

      {hasRecoverableDraft && (
        <DraftRecoveryBanner
          draft={recoveredDraft}
          onRestore={restoreDraft}
          onDiscard={discardDraft}
        />
      )}

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
              id={pageId!}
              initialDesign={initialBody as PageBuilderDesign}
              onChange={handleDesignChange}
              title={title}
            />
          </Suspense>
        )}
        {isBuilderReady && activeBuilder === 'grapesjs' && (
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-xs text-zinc-500">
                Loading Canvas Editor...
              </div>
            }
          >
            <GrapesJSEditor
              ref={grapesEditorRef}
              initialData={initialBody as Partial<GrapesJSData>}
              onChange={handleDesignChange}
              brandTitle={title || 'Page Builder'}
              schemaFields={schemaFields}
              availableSchemas={availableSchemas}
              schemaValues={schemaValues}
            />
          </Suspense>
        )}
      </div>

      <TemplateImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleTemplateImport}
      />
      <ExistingContentDialog
        isOpen={isExistingDialogOpen}
        onClose={() => setIsExistingDialogOpen(false)}
        onConfirm={handleExistingContentConfirm}
      />
      {schemaSlug && pageId && (
        <VersionHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          schemaSlug={schemaSlug}
          pageId={pageId}
          currentPageData={{
            title,
            slug,
            body: bodyRef.current,
          }}
          onRevertSuccess={handleRevertSuccess}
        />
      )}
      <PageSideDrawer
        isOpen={isSchemaDrawerOpen}
        onClose={() => setIsSchemaDrawerOpen(false)}
        collection={activeCollection}
        page={pageQuery.data}
        onSavePage={async (pId, data, publishImmediately) => {
          await collectionsApi.updatePage(schemaSlug!, pId, {
            ...data,
            title: typeof data.title === 'string' ? data.title : title,
            slug: typeof data.slug === 'string' ? data.slug : slug,
          });
          if (publishImmediately) {
            await collectionsApi.publishPage(schemaSlug!, pId);
          }
          queryClient.invalidateQueries({
            queryKey: ['page', schemaSlug, pId],
          });
          queryClient.invalidateQueries({
            queryKey: ['pages', schemaSlug],
          });
          toast.success(
            publishImmediately
              ? 'Page published live!'
              : 'Page schemas saved successfully!',
          );
        }}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
