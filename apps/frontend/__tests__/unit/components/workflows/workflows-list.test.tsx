import type { WorkflowRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowsList } from '@/components/workflows/workflows-list';

const {
  mockListWorkflows,
  mockDeleteWorkflow,
  mockListSchemas,
  mockListRoles,
} = vi.hoisted(() => ({
  mockListWorkflows: vi.fn(),
  mockDeleteWorkflow: vi.fn(),
  mockListSchemas: vi.fn(),
  mockListRoles: vi.fn(),
}));

vi.mock('@/lib/api/workflows', () => ({
  listWorkflows: mockListWorkflows,
  deleteWorkflow: mockDeleteWorkflow,
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

vi.mock('@/lib/api/access', () => ({
  listRoles: mockListRoles,
}));

const mockWorkflow: WorkflowRecord = {
  id: 'wf-1',
  name: 'Standard Editorial Review',
  description: 'Standard 3-stage review pipeline for articles',
  applicationId: 'app-1',
  isDefault: true,
  stages: [
    {
      id: 's-1',
      name: 'Draft',
      slug: 'draft',
      color: '#64748b',
      order: 0,
      isInitial: true,
      isFinal: false,
    },
    {
      id: 's-2',
      name: 'In Review',
      slug: 'in_review',
      color: '#3b82f6',
      order: 1,
      isInitial: false,
      isFinal: false,
    },
    {
      id: 's-3',
      name: 'Approved',
      slug: 'approved',
      color: '#10b981',
      order: 2,
      isInitial: false,
      isFinal: true,
    },
  ],
  transitions: [
    {
      id: 't-1',
      name: 'Send to Review',
      fromStage: 'draft',
      toStage: 'in_review',
      requiredRoleIds: [],
    },
    {
      id: 't-2',
      name: 'Approve',
      fromStage: 'in_review',
      toStage: 'approved',
      requiredRoleIds: ['editor'],
    },
  ],
  assignedSchemaIds: ['schema-1', 'schema-2'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkflowsList />
    </QueryClientProvider>,
  );
}

describe('WorkflowsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListWorkflows.mockResolvedValue({
      data: [],
      meta: { pagination: { total: 0 } },
    });
    mockListSchemas.mockResolvedValue({ data: [] });
    mockListRoles.mockResolvedValue({ data: [] });
  });

  it('renders empty state when there are no workflows', async () => {
    renderList();
    expect(
      await screen.findByText('No workflows configured'),
    ).toBeInTheDocument();
    expect(screen.getByText('Create First Workflow')).toBeInTheDocument();
  });

  it('renders existing workflows with stages, default badge, and schema links', async () => {
    mockListWorkflows.mockResolvedValue({
      data: [mockWorkflow],
      meta: { pagination: { total: 1 } },
    });
    renderList();

    expect(
      await screen.findByText('Standard Editorial Review'),
    ).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('2 Content Types Linked')).toBeInTheDocument();
    expect(screen.getByText('3 stages')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('opens the builder drawer when New Workflow is clicked', async () => {
    const user = userEvent.setup();
    renderList();

    const newBtn = await screen.findByRole('button', { name: /New Workflow/i });
    await user.click(newBtn);

    expect(await screen.findByText('Create New Workflow')).toBeInTheDocument();
  });

  it('opens confirmation modal and deletes a workflow', async () => {
    const user = userEvent.setup();
    mockListWorkflows.mockResolvedValue({
      data: [mockWorkflow],
      meta: { pagination: { total: 1 } },
    });
    mockDeleteWorkflow.mockResolvedValue(undefined);

    renderList();

    // Open 3-dot actions dropdown
    const menuBtn = await screen.findByRole('button', {
      name: /Actions for Standard Editorial Review/i,
    });
    await user.click(menuBtn);

    const deleteOption = await screen.findByText('Delete');
    await user.click(deleteOption);

    expect(await screen.findByText('Delete Workflow')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteWorkflow).toHaveBeenCalledWith('wf-1');
    });
  });
});
