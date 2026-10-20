import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  enabled,
  onEscape,
  restoreFocus = true,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Capture the trigger element before opening
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element within the container
    const focusable =
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusable[0];
    if (firstFocusable) {
      requestAnimationFrame(() => {
        firstFocusable.focus();
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
  }, [enabled, onEscape, restoreFocus]);

  return containerRef;
}
