import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginsTab } from '@/components/settings/plugins/plugins-tab';
import type { PluginSummary } from '@/lib/api/plugins';
import { useAuthStore } from '@/stores/auth-store';

const {
  mockGetPlugins,
  mockGetPlugin,
  mockUpdatePluginStatus,
  mockUpdatePluginConfig,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockGetPlugins: vi.fn(),
  mockGetPlugin: vi.fn(),
  mockUpdatePluginStatus: vi.fn(),
  mockUpdatePluginConfig: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/lib/api/plugins', () => ({
  getPlugins: mockGetPlugins,
  getPlugin: mockGetPlugin,
  updatePluginStatus: mockUpdatePluginStatus,
  updatePluginConfig: mockUpdatePluginConfig,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const samplePlugins: PluginSummary[] = [
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    version: '1.2.0',
    description: 'Generates sitemaps and meta tags automatically.',
    author: 'Mindfire Digital',
    status: 'active',
    isEnabled: true,
    config: {
      sitemapUrl: 'https://example.com/sitemap.xml',
      apiKey: '***masked***',
    },
    loadedAt: '2026-10-14T00:00:00Z',
    routes: [
      { method: 'GET', path: '/sitemap' },
      { method: 'POST', path: '/reindex' },
    ],
    hooks: ['content.beforeCreate', 'content.afterPublish'],
  },
  {
    id: 'slack-notifier',
    name: 'Slack Notifier',
    version: '0.9.1',
    description: 'Sends notifications to Slack on content changes.',
    author: 'Community',
    status: 'disabled',
    isEnabled: false,
    config: {
      webhookUrl: 'https://hooks.slack.com/services/xxx',
    },
    loadedAt: '2026-10-14T00:00:00Z',
    routes: [],
    hooks: ['content.afterPublish'],
  },
];

function renderPluginsTab() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PluginsTab />
    </QueryClientProvider>,
  );
}

describe('PluginsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlugins.mockResolvedValue(samplePlugins);
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        email: 'admin@agentic.cms',
        firstName: 'Super',
        lastName: 'Admin',
        roles: ['admin'],
        mfaEnabled: false,
      },
      status: 'authenticated',
      error: null,
      mfaToken: null,
    });
  });

  it('shows empty state when no plugins are installed', async () => {
    mockGetPlugins.mockResolvedValue([]);
    renderPluginsTab();

    expect(await screen.findByText('No plugins installed')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Extend your CMS functionality by dropping custom or community plugins/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders all installed plugins with cards, badges, and status', async () => {
    renderPluginsTab();

    expect(await screen.findByText('SEO Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    expect(screen.getByText('v0.9.1')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('2 Hooks')).toBeInTheDocument();
    expect(screen.getByText('2 Routes')).toBeInTheDocument();
    expect(screen.getByText('1 Hook')).toBeInTheDocument();
    expect(screen.getByText('0 Routes')).toBeInTheDocument();

    // Stats
    expect(screen.getByText(/1 Active \/ 2 Installed/)).toBeInTheDocument();
  });

  it('allows an admin to toggle plugin status on/off', async () => {
    const user = userEvent.setup();
    mockUpdatePluginStatus.mockResolvedValue({
      ...samplePlugins[0],
      isEnabled: false,
      status: 'disabled',
    });

    renderPluginsTab();
    await screen.findByText('SEO Optimizer');

    const toggle = screen.getByRole('switch', {
      name: 'Toggle SEO Optimizer status',
    });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    await waitFor(() =>
      expect(mockUpdatePluginStatus).toHaveBeenCalledWith(
        'seo-optimizer',
        false,
      ),
    );
  });

  it('disables the toggle if the user is not an admin', async () => {
    useAuthStore.setState({
      user: {
        id: 'viewer-1',
        email: 'viewer@agentic.cms',
        firstName: 'Viewer',
        lastName: 'User',
        roles: ['viewer'],
        mfaEnabled: false,
      },
      status: 'authenticated',
      error: null,
      mfaToken: null,
    });

    renderPluginsTab();
    await screen.findByText('SEO Optimizer');

    expect(
      screen.getByText(/You are viewing plugins with read-only permissions/i),
    ).toBeInTheDocument();

    const toggle = screen.getByRole('switch', {
      name: 'Toggle SEO Optimizer status',
    });
    expect(toggle).toBeDisabled();
  });

  it('filters plugins based on search input', async () => {
    const user = userEvent.setup();
    renderPluginsTab();
    await screen.findByText('SEO Optimizer');

    const searchInput = screen.getByPlaceholderText('Search plugins...');
    await user.type(searchInput, 'slack');

    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.queryByText('SEO Optimizer')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'nonexistent-plugin');

    expect(
      await screen.findByText('No matching plugins found'),
    ).toBeInTheDocument();
  });

  it('opens the configuration drawer when clicking Configure', async () => {
    const user = userEvent.setup();
    renderPluginsTab();
    await screen.findByText('SEO Optimizer');

    const configureButtons = screen.getAllByRole('button', {
      name: /Configure/i,
    });
    const configureButton = configureButtons[0];
    expect(configureButton).toBeDefined();
    if (!configureButton) throw new Error('Configure button not found');
    await user.click(configureButton);

    // Drawer should open displaying plugin configuration
    expect(
      await screen.findByText('Plugin Configuration & Secrets'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Subscribed Lifecycle Hooks \(2\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Exposed API Routes \(2\)/)).toBeInTheDocument();
  });
});
