import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

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
