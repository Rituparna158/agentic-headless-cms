import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocusSelector?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  enabled,
  onEscape,
  restoreFocus = true,
  initialFocusSelector,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Capture the trigger element before opening
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Focus initial element if specified, or first non-input/first focusable
    const focusable =
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    let targetToFocus: HTMLElement | null = null;

    if (initialFocusSelector) {
      targetToFocus =
        container.querySelector<HTMLElement>(initialFocusSelector);
    }

    if (!targetToFocus && focusable.length > 0) {
      // Prefer focusing buttons/links over editable inputs to avoid cursor hijacking
      const preferred = Array.from(focusable).find(
        (el) => el.tagName === 'BUTTON' || el.tagName === 'A',
      );
      targetToFocus = preferred || focusable[0] || null;
    }

    if (targetToFocus) {
      requestAnimationFrame(() => {
        targetToFocus?.focus();
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }

      if (event.key === 'Tab') {
        const currentElements =
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (currentElements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = currentElements[0];
        const last = currentElements[currentElements.length - 1];

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            !container.contains(document.activeElement)
          ) {
            event.preventDefault();
            last?.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !container.contains(document.activeElement)
          ) {
            event.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (
        restoreFocus &&
        triggerElementRef.current &&
        typeof triggerElementRef.current.focus === 'function'
      ) {
        triggerElementRef.current.focus();
      }
    };
  }, [enabled, initialFocusSelector, onEscape, restoreFocus]);

  return containerRef;
}
