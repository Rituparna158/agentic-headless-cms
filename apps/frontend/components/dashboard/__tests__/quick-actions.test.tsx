import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from '../quick-actions';

describe('QuickActions', () => {
  it('routes each action to its correct creation screen', () => {
    render(<QuickActions />);

    expect(screen.getByRole('link', { name: '+ New Entry' })).toHaveAttribute(
      'href',
      '/content',
    );
    expect(
      screen.getByRole('link', { name: '+ Content-Type' }),
    ).toHaveAttribute('href', '/content-types/new');
    expect(screen.getByRole('link', { name: 'Upload Media' })).toHaveAttribute(
      'href',
      '/media',
    );
  });
});
