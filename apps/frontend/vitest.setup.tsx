import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

configure({ asyncUtilTimeout: 10000 });

// vitest.config.ts sets globals: false, so RTL's usual auto-cleanup (which
// hooks into a global afterEach) never registers — without this, each test
// renders into the same jsdom document without unmounting the previous
// one, so getByLabelText etc. find duplicate elements from prior tests.
afterEach(cleanup);

// jsdom doesn't implement these — Radix UI's Select (and other popover-based
// primitives) call them during layout/positioning, so components using them
// throw on mount under jsdom without a stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Mock framer-motion to prevent jsdom/vitest from hanging due to heavy animations
vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: new Proxy(
      {},
      {
        get:
          (_, tag: string) =>
          ({
            initial: _initial,
            animate: _animate,
            exit: _exit,
            variants: _variants,
            transition: _transition,
            whileHover: _whileHover,
            whileTap: _whileTap,
            onAnimationComplete: _onAnimationComplete,
            ...props
          }: Record<string, unknown>) =>
            React.createElement(tag, props),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useMotionValue: () => ({ set: () => {}, get: () => 0 }),
    useSpring: (val: unknown) => val,
    useTransform: () => ({ set: () => {}, get: () => 0 }),
    useAnimation: () => ({ start: () => {}, stop: () => {} }),
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  };
});

// Mock AnimatedInput which causes jsdom/vitest to hang and throw act warnings
vi.mock('@repo/shared-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared-ui')>();
  const React = await import('react');
  return {
    ...actual,
    AnimatedInput: function MockAnimatedInput(props: Record<string, unknown>) {
      return React.createElement(
        'div',
        { className: props.className as string | undefined },
        React.createElement(
          'label',
          { htmlFor: props.id as string | undefined },
          props.placeholder as React.ReactNode,
        ),
        React.createElement('input', {
          id: props.id as string | undefined,
          type: (props.type as string | undefined) || 'text',
          value: props.value as string | readonly string[] | number | undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (typeof props.onChange === 'function') {
              props.onChange(e.target.value);
            }
          },
          disabled: props.disabled as boolean | undefined,
          placeholder: props.placeholder as string | undefined,
          'data-testid': 'mock-animated-input',
        }),
      );
    },
  };
});
