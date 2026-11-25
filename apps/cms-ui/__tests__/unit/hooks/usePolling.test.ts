import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePolling } from '@/hooks/usePolling';

// Mock useCmsToast
const mockToastWarning = vi.fn();
vi.mock('@/hooks/useCmsToast', () => ({
  useCmsToast: () => ({
    warning: mockToastWarning,
    show: vi.fn(),
  }),
}));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('usePolling Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
  });

  it('polls at specified intervals when document is visible', async () => {
    const pollingFn = vi.fn().mockResolvedValue({ status: 'ok' });

    const { result, unmount } = renderHook(() =>
      usePolling(pollingFn, { intervalMs: 30, enabled: true }),
    );

    // Wait for multiple polling cycles
    await sleep(120);
    expect(pollingFn.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.current.consecutiveFailures).toBe(0);

    unmount();
  });

  it('pauses when document is hidden and resumes on visibility change', async () => {
    const pollingFn = vi.fn().mockResolvedValue({ status: 'ok' });

    const { result, unmount } = renderHook(() =>
      usePolling(pollingFn, { intervalMs: 40, enabled: true }),
    );

    await sleep(20);
    const initialCalls = pollingFn.mock.calls.length;
    expect(initialCalls).toBeGreaterThanOrEqual(1);

    // Hide document
    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isPaused).toBe(true);

    // Wait while hidden
    await sleep(60);
    const callsWhileHidden = pollingFn.mock.calls.length;

    // Unhide document
    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        value: false,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await sleep(40);
    expect(result.current.isPaused).toBe(false);
    expect(pollingFn.mock.calls.length).toBeGreaterThan(callsWhileHidden);

    unmount();
  });

  it('tracks consecutive failures and triggers toast alert on 3 consecutive errors', async () => {
    const pollingFn = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result, unmount } = renderHook(() =>
      usePolling(pollingFn, {
        intervalMs: 25,
        enabled: true,
        maxConsecutiveFailures: 3,
        failureAlertMessage: 'Live update connection lost.',
      }),
    );

    // Wait for ticks to fail consecutively
    await sleep(150);

    expect(result.current.consecutiveFailures).toBeGreaterThanOrEqual(3);
    expect(mockToastWarning).toHaveBeenCalledWith(
      'Live update connection lost.',
    );

    unmount();
  });
});
