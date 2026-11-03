import '@testing-library/jest-dom';
import * as matchers from 'vitest-axe/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// Mock HTMLCanvasElement.getContext for jsdom axe text/ligature contrast checks
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => ({
    measureText: () => ({ width: 0 }),
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

// Mock window.getComputedStyle with pseudoElement support for jsdom
if (typeof window !== 'undefined' && window.getComputedStyle) {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = (elt: Element, _pseudoElt?: string | null) => {
    return originalGetComputedStyle(elt);
  };
}
