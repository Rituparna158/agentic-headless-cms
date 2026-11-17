import { describe, it, expect, vi } from 'vitest';
import { activateOnKey } from '../../../src/utils/a11y.util';

const evt = (key: string, same = true) => {
  const el = {};
  return {
    key,
    target: same ? el : {},
    currentTarget: el,
    preventDefault: vi.fn(),
  } as never;
};

describe('activateOnKey', () => {
  it.each(['Enter', ' '])('fires on %j', (key) => {
    const fn = vi.fn();
    const e = evt(key);
    activateOnKey(fn)(e);
    expect(fn).toHaveBeenCalledOnce();
    expect(
      (e as { preventDefault: () => void }).preventDefault,
    ).toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const fn = vi.fn();
    activateOnKey(fn)(evt('a'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores keys bubbling from child controls', () => {
    const fn = vi.fn();
    activateOnKey(fn)(evt('Enter', false));
    expect(fn).not.toHaveBeenCalled();
  });
});
