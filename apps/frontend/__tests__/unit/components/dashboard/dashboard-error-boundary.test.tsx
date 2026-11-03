import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardErrorBoundary from '@/app/(dashboard)/error';

describe('DashboardErrorBoundary', () => {
  it('renders error message and triggers reset on Retry click', () => {
    const reset = vi.fn();
    const error = new Error('Database connection failed');

    render(<DashboardErrorBoundary error={error} reset={reset} />);

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
