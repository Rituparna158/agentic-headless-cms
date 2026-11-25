import { useEffect, useRef, useState, useCallback } from 'react';
import { useCmsToast } from './useCmsToast';

export interface UsePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  maxConsecutiveFailures?: number;
  failureAlertMessage?: string;
}

export interface UsePollingState {
  isPolling: boolean;
  consecutiveFailures: number;
  isPaused: boolean;
  retry: () => void;
}

/**
 * Resilient, visibility-aware polling hook.
 *
 * Guarantees:
 * 1. Pauses automatically when `document.hidden` is true and resumes on `visibilitychange`.
 * 2. Waits for previous async tick to settle before scheduling next (zero overlapping requests).
 * 3. Counts consecutive failures and alerts the user if polling fails 3 times in a row.
 * 4. Cleans up all timers and abort controllers cleanly on unmount.
 */
export function usePolling(
  pollingFn: (signal: AbortSignal) => Promise<unknown>,
  options: UsePollingOptions = {},
): UsePollingState {
  const {
    intervalMs = 5000,
    enabled = true,
    maxConsecutiveFailures = 3,
    failureAlertMessage = 'Live update connection lost. Retrying...',
  } = options;

  const toast = useCmsToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const pollingFnRef = useRef(pollingFn);
  pollingFnRef.current = pollingFn;

  const [isPolling, setIsPolling] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const failureAlertFiredRef = useRef(false);
  const isMountedRef = useRef(true);

  const scheduleNextTick = useCallback((delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      void executeTick();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- executeTick is stable
  }, []);

  const executeTick = useCallback(async () => {
    if (!isMountedRef.current || !enabled) return;

    if (typeof document !== 'undefined' && document.hidden) {
      setIsPaused(true);
      return;
    }

    setIsPaused(false);
    setIsPolling(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await pollingFnRef.current(abortController.signal);
      if (!isMountedRef.current) return;

      setConsecutiveFailures(0);
      failureAlertFiredRef.current = false;
      scheduleNextTick(intervalMs);
    } catch {
      if (!isMountedRef.current) return;
      if (abortController.signal.aborted) return;

      setConsecutiveFailures((prev) => {
        const next = prev + 1;
        if (next >= maxConsecutiveFailures && !failureAlertFiredRef.current) {
          failureAlertFiredRef.current = true;
          toastRef.current.warning(failureAlertMessage);
        }
        return next;
      });

      // Backoff on failure (up to 30s)
      scheduleNextTick(Math.min(intervalMs * 2, 30000));
    } finally {
      if (isMountedRef.current) {
        setIsPolling(false);
      }
    }
  }, [
    enabled,
    intervalMs,
    maxConsecutiveFailures,
    failureAlertMessage,
    scheduleNextTick,
  ]);

  const retry = useCallback(() => {
    setConsecutiveFailures(0);
    failureAlertFiredRef.current = false;
    void executeTick();
  }, [executeTick]);

  // Main lifecycle: starts polling and listens for visibilitychange
  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && enabled) {
        setIsPaused(false);
        void executeTick();
      } else if (typeof document !== 'undefined' && document.hidden) {
        setIsPaused(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (enabled) {
      void executeTick();
    }

    return () => {
      isMountedRef.current = false;
      if (typeof document !== 'undefined') {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, executeTick]);

  return {
    isPolling,
    consecutiveFailures,
    isPaused,
    retry,
  };
}
