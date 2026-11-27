import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardResources } from '@/components/dashboard/dashboard-resources';
import { useAuthStore } from '@/stores/auth-store';

describe('DashboardResources', () => {
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

  it('renders all platform modules including Webhooks and Roles & Permissions for admin users', () => {
    render(<DashboardResources />);

    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Content Type Builder')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.getByText('Webhooks & Events')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
  });

  it('hides Webhooks & Events and Roles & Permissions for viewer role', () => {
    useAuthStore.setState({
      user: {
        id: 'viewer-1',
        email: 'viewer@example.com',
        firstName: 'Viewer',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['viewer'],
        permissions: [{ action: 'read', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    render(<DashboardResources />);

    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Content Type Builder')).toBeInTheDocument();
    expect(screen.getByText('Media Library')).toBeInTheDocument();
    expect(screen.queryByText('Webhooks & Events')).not.toBeInTheDocument();
    expect(screen.queryByText('Roles & Permissions')).not.toBeInTheDocument();
  });
});
