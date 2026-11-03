import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

const Bomb = () => {
  throw new Error('Explosion');
};

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('should catch errors and render fallback UI', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Explosion')).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
