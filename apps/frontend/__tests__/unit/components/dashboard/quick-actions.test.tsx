import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { useAuthStore } from '@/stores/auth-store';

describe('QuickActions', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['admin'],
        permissions: [{ action: '*', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });
  });

  it('routes each action to its correct screen for admin users', () => {
    render(<QuickActions />);

    expect(
      screen.getByRole('link', { name: 'Manage Content' }),
    ).toHaveAttribute('href', '/content');
    expect(
      screen.getByRole('link', { name: '+ New Content Type' }),
    ).toHaveAttribute('href', '/content-types/new');
    expect(screen.getByRole('link', { name: 'Upload Media' })).toHaveAttribute(
      'href',
      '/media',
    );
  });

  it('hides + New Content Type action for non-admin users without schema creation rights', () => {
    useAuthStore.setState({
      user: {
        id: 'author-1',
        email: 'author@example.com',
        firstName: 'Author',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['author'],
        permissions: [
          { action: 'create', schemaId: 'some-schema', effect: 'allow' },
        ],
      },
      status: 'authenticated',
    });

    render(<QuickActions />);

    expect(
      screen.getByRole('link', { name: 'Manage Content' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Upload Media' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '+ New Content Type' }),
    ).not.toBeInTheDocument();
  });

  it('hides both + New Content Type and Upload Media for viewer role without write permissions', () => {
    useAuthStore.setState({
      user: {
        id: 'viewer-1',
        email: 'viewer@example.com',
        firstName: 'Viewer',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['viewer'],
        permissions: [
          { action: 'read', schemaId: 'some-schema', effect: 'allow' },
        ],
      },
      status: 'authenticated',
    });

    render(<QuickActions />);

    expect(
      screen.getByRole('link', { name: 'Manage Content' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '+ New Content Type' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Upload Media' }),
    ).not.toBeInTheDocument();
  });
});
