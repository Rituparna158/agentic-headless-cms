import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeneralErrorPage } from '../../../../src/pages/GeneralError/GeneralErrorPage';

describe('GeneralErrorPage', () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reloadMock = vi.fn();
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        reload: reloadMock,
        assign: assignMock,
        href: 'http://localhost/error',
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error heading and actions', () => {
    render(<GeneralErrorPage />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('reloads the page on Try Again click', () => {
    render(<GeneralErrorPage />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('redirects to the dashboard on Back to Dashboard click', () => {
    render(<GeneralErrorPage />);
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(assignMock).toHaveBeenCalledWith('/');
  });
});
