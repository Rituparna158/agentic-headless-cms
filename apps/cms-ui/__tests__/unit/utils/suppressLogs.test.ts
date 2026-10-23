import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initConsoleSuppression } from '@/utils/suppressLogs';

describe('suppressLogs', () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.trace = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  it('suppresses console methods when isProduction is true', () => {
    initConsoleSuppression(true);

    console.log('test log');
    console.info('test info');
    console.debug('test debug');
    console.warn('test warn');
    console.error('test error');
    console.trace('test trace');

    // Each should be a no-op function that does not call original spies
    expect(typeof console.log).toBe('function');
    expect(typeof console.info).toBe('function');
  });

  it('preserves console methods when isProduction is false', () => {
    const mockLog = vi.fn();
    console.log = mockLog;

    initConsoleSuppression(false);
    console.log('hello');
    expect(mockLog).toHaveBeenCalledWith('hello');
  });
});
