import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const toast = {
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
};

vi.mock('@repo/shared-ui', () => ({ useToast: () => toast }));

import { useCmsToast } from '../../../src/hooks/useCmsToast';

describe('useCmsToast', () => {
  beforeEach(() => vi.clearAllMocks());

  it('defaults to info and uses the message alone without a title', () => {
    const { result } = renderHook(() => useCmsToast());
    result.current.show({ message: 'Hello' } as never);
    expect(toast.info).toHaveBeenCalledWith('Hello');
  });

  it('prefixes the title to the message', () => {
    const { result } = renderHook(() => useCmsToast());
    result.current.show({
      title: 'Saved',
      message: 'Page updated',
      type: 'success',
    } as never);
    expect(toast.success).toHaveBeenCalledWith('Saved — Page updated');
  });

  it('exposes the underlying toast methods', () => {
    const { result } = renderHook(() => useCmsToast());
    result.current.error('boom');
    expect(toast.error).toHaveBeenCalledWith('boom');
  });
});
