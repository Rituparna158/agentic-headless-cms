import { useEffect, useRef, useState, useCallback } from 'react';
import type { CanvasDraftRecord } from '../types/collections.types';
import {
  saveCanvasDraft,
  getCanvasDraft,
  deleteCanvasDraft,
} from '../storage/canvasDraftStorage';
import { CANVAS_AUTO_SAVE_INTERVAL_MS } from '../constants/collections.constants';
import { usePageBuilderStore } from '../components/page-builder/stores/pageBuilderStore';

export interface UseCanvasAutoSaveOptions {
  pageId?: string;
  schemaSlug?: string;
  title: string;
  slug: string;
  bodyRef: React.RefObject<unknown>;
  activeBuilder: 'grapesjs' | 'custom';
  enabled?: boolean;
  intervalMs?: number;
  serverUpdatedAt?: string;
  onRestoreDraft?: (draft: CanvasDraftRecord) => void;
}

export function useCanvasAutoSave({
  pageId,
  schemaSlug,
  title,
  slug,
  bodyRef,
  activeBuilder,
  enabled = true,
  intervalMs = CANVAS_AUTO_SAVE_INTERVAL_MS,
  serverUpdatedAt,
  onRestoreDraft,
}: UseCanvasAutoSaveOptions) {
  const isDirty = usePageBuilderStore((state) => state.isDirty);
  const markDirty = usePageBuilderStore((state) => state.markDirty);
  const markClean = usePageBuilderStore((state) => state.markClean);
  const snapshotComponentState = usePageBuilderStore(
    (state) => state.snapshotComponentState,
  );
  const restoreComponentState = usePageBuilderStore(
    (state) => state.restoreComponentState,
  );

  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number | null>(null);
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [recoveredDraft, setRecoveredDraft] =
    useState<CanvasDraftRecord | null>(null);

  useEffect(() => {
    if (!pageId || !enabled) return;

    let isMounted = true;
    (async () => {
      try {
        const draft = await getCanvasDraft(pageId);
        if (!isMounted || !draft) return;

        const serverTimestamp = serverUpdatedAt
          ? new Date(serverUpdatedAt).getTime()
          : 0;

        if (draft.isDirty && draft.updatedAt > serverTimestamp + 2000) {
          setRecoveredDraft(draft);
          setHasRecoverableDraft(true);
        }
      } catch (err) {
        console.warn('[useCanvasAutoSave] Error checking local draft:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pageId, enabled, serverUpdatedAt]);

  const latestDataRef = useRef({
    pageId,
    schemaSlug,
    title,
    slug,
    bodyRef,
    activeBuilder,
    isDirty,
  });

  useEffect(() => {
    latestDataRef.current = {
      pageId,
      schemaSlug,
      title,
      slug,
      bodyRef,
      activeBuilder,
      isDirty,
    };
  }, [pageId, schemaSlug, title, slug, bodyRef, activeBuilder, isDirty]);

  useEffect(() => {
    if (!pageId || !enabled) return;

    const timer = setInterval(async () => {
      const {
        pageId: currentId,
        schemaSlug: currentSlug,
        title: currentTitle,
        slug: currentPath,
        bodyRef: currentBodyRef,
        activeBuilder: currentBuilder,
        isDirty: currentDirty,
      } = latestDataRef.current;

      if (!currentId || !currentDirty) return;

      try {
        const componentState = snapshotComponentState();
        const record: CanvasDraftRecord = {
          pageId: currentId,
          schemaSlug: currentSlug || '',
          title: currentTitle,
          slug: currentPath,
          body: currentBodyRef.current,
          updatedAt: Date.now(),
          isDirty: true,
          builderType: currentBuilder,
          componentState,
        };

        await saveCanvasDraft(record);
        setLastAutoSavedAt(record.updatedAt);
      } catch (err) {
        console.warn('[useCanvasAutoSave] Auto-save failed:', err);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [pageId, enabled, intervalMs, snapshotComponentState]);

  const restoreDraft = useCallback(() => {
    if (!recoveredDraft) return;

    if (recoveredDraft.componentState) {
      restoreComponentState(recoveredDraft.componentState);
    }
    markDirty(true);
    setHasRecoverableDraft(false);

    if (onRestoreDraft) {
      onRestoreDraft(recoveredDraft);
    }
  }, [recoveredDraft, restoreComponentState, markDirty, onRestoreDraft]);

  const discardDraft = useCallback(async () => {
    if (!pageId) return;
    await deleteCanvasDraft(pageId);
    setHasRecoverableDraft(false);
    setRecoveredDraft(null);
  }, [pageId]);

  const clearLocalDraft = useCallback(async () => {
    if (!pageId) return;
    await deleteCanvasDraft(pageId);
    markClean(pageId);
    setHasRecoverableDraft(false);
    setRecoveredDraft(null);
  }, [pageId, markClean]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    isDirty,
    lastAutoSavedAt,
    hasRecoverableDraft,
    recoveredDraft,
    restoreDraft,
    discardDraft,
    clearLocalDraft,
  };
}
