import type { KeyboardEvent } from 'react';

/**
 * Keyboard handler that makes a clickable non-button element activate on
 * Enter / Space, like a native button. Ignores key presses that bubble up
 * from focusable children (inputs, buttons, links).
 */
export const activateOnKey =
  (handler: () => void) =>
  (event: KeyboardEvent<HTMLElement>): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };
