import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

function TrapComponent({
  enabled = true,
  onEscape,
  restoreFocus = true,
  initialFocusSelector,
  hasChildren = true,
}: {
  enabled?: boolean;
  onEscape?: () => void;
  restoreFocus?: boolean;
  initialFocusSelector?: string;
  hasChildren?: boolean;
}) {
  const containerRef = useFocusTrap<HTMLDivElement>({
    enabled,
    onEscape,
    restoreFocus,
    initialFocusSelector,
  });

  return (
    <div ref={containerRef} data-testid="trap-container">
      {hasChildren ? (
        <>
          <input data-testid="input-1" type="text" />
          <button data-testid="btn-action">Action</button>
          <a data-testid="link-target" href="#test">
            Target
          </a>
        </>
      ) : (
        <p>No focusable elements</p>
      )}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('focuses preferred button element over input by default', async () => {
    render(<TrapComponent enabled={true} />);

    // Wait for requestAnimationFrame focus
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('btn-action'));
    });
  });

  it('focuses element specified by initialFocusSelector', async () => {
    render(
      <TrapComponent
        enabled={true}
        initialFocusSelector="[data-testid='input-1']"
      />,
    );

    await vi.waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId('input-1'));
    });
  });

  it('calls onEscape when Escape key is pressed', () => {
    const handleEscape = vi.fn();
    render(<TrapComponent enabled={true} onEscape={handleEscape} />);

    fireEvent.keyDown(screen.getByTestId('trap-container'), {
      key: 'Escape',
    });

    expect(handleEscape).toHaveBeenCalledTimes(1);
  });

  it('wraps focus from last to first on Tab press', () => {
    render(<TrapComponent enabled={true} />);
    const link = screen.getByTestId('link-target');
    link.focus();

    fireEvent.keyDown(screen.getByTestId('trap-container'), {
      key: 'Tab',
      shiftKey: false,
    });

    expect(document.activeElement).toBe(screen.getByTestId('input-1'));
  });

  it('wraps focus from first to last on Shift+Tab press', () => {
    render(<TrapComponent enabled={true} />);
    const input = screen.getByTestId('input-1');
    input.focus();

    fireEvent.keyDown(screen.getByTestId('trap-container'), {
      key: 'Tab',
      shiftKey: true,
    });

    expect(document.activeElement).toBe(screen.getByTestId('link-target'));
  });

  it('prevents default Tab when container has no focusable elements', () => {
    render(<TrapComponent enabled={true} hasChildren={false} />);

    const container = screen.getByTestId('trap-container');
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    container.dispatchEvent(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
