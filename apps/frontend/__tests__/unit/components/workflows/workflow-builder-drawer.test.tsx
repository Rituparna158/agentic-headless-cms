import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowBuilderDrawer } from '@/components/workflows/workflow-builder-drawer';
import type { WorkflowRecord } from '@repo/types';

const {
  mockCreateWorkflow,
  mockUpdateWorkflow,
  mockListWorkflows,
  mockGetActiveEntriesInStage,
  mockListSchemas,
  mockListRoles,
} = vi.hoisted(() => ({
  mockCreateWorkflow: vi.fn(),
  mockUpdateWorkflow: vi.fn(),
  mockListWorkflows: vi.fn(),
  mockGetActiveEntriesInStage: vi.fn(),
  mockListSchemas: vi.fn(),
  mockListRoles: vi.fn(),
}));

vi.mock('@/lib/api/workflows', () => ({
  createWorkflow: mockCreateWorkflow,
  updateWorkflow: mockUpdateWorkflow,
  listWorkflows: mockListWorkflows,
  getActiveEntriesInStage: mockGetActiveEntriesInStage,
}));

vi.mock('@/lib/api/schemas', () => ({
  listSchemas: mockListSchemas,
}));

vi.mock('@/lib/api/access', () => ({
  listRoles: mockListRoles,
}));

const existingWorkflow: WorkflowRecord = {
  id: 'wf-123',
  name: 'Existing Review',
  description: 'Custom description',
  applicationId: 'app-1',
  isDefault: false,
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
      name: 'Approved',
      slug: 'approved',
      color: '#10b981',
      order: 1,
      isInitial: false,
      isFinal: true,
    },
  ],
  transitions: [
    {
      id: 't-1',
      name: 'Approve',
      fromStage: 'draft',
      toStage: 'approved',
      requiredRoleIds: ['editor'],
    },
  ],
  assignedSchemaIds: ['schema-1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderDrawer(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowRecord | null;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkflowBuilderDrawer {...props} />
    </QueryClientProvider>,
  );
}

describe('WorkflowBuilderDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListWorkflows.mockResolvedValue({
      data: [
        {
          id: 'wf-default',
          name: 'Global Editorial Pipeline',
          isDefault: true,
          assignedSchemaIds: [],
        },
      ],
    });
    mockListSchemas.mockResolvedValue({
      data: [{ id: 'schema-1', name: 'Articles', slug: 'articles' }],
    });
    mockListRoles.mockResolvedValue({
      data: [
        { id: 'role-1', name: 'admin' },
        { id: 'role-2', name: 'editor' },
      ],
    });
    mockGetActiveEntriesInStage.mockResolvedValue({ count: 0 });
  });

  it('populates with existing workflow details in edit mode', async () => {
    renderDrawer({
      open: true,
      onOpenChange: vi.fn(),
      workflow: existingWorkflow,
    });

    expect(
      await screen.findByText('Edit Workflow: Existing Review'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Review')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Custom description')).toBeInTheDocument();
  });

  it('creates a new workflow when form is submitted with valid inputs', async () => {
    const user = userEvent.setup();
    mockCreateWorkflow.mockResolvedValue({
      id: 'new-wf',
      name: 'New Pipeline',
    });
    const onOpenChange = vi.fn();

    renderDrawer({
      open: true,
      onOpenChange,
      workflow: null,
    });

    const nameInput = await screen.findByPlaceholderText(
      'e.g. Editorial Review Pipeline',
    );
    fireEvent.change(nameInput, { target: { value: 'New Pipeline' } });

    const loadTemplateBtn = screen.getByRole('button', {
      name: /Load Standard Template/i,
    });
    await user.click(loadTemplateBtn);

    const createBtn = screen.getByRole('button', { name: 'Create Workflow' });
    await user.click(createBtn);

    await waitFor(() => {
      expect(mockCreateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Pipeline',
          stages: expect.arrayContaining([
            expect.objectContaining({ isInitial: true }),
            expect.objectContaining({ isFinal: true }),
          ]),
        }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('allows switching tabs to view transitions and assigned content types', async () => {
    const user = userEvent.setup();
    renderDrawer({
      open: true,
      onOpenChange: vi.fn(),
      workflow: existingWorkflow,
    });

    const transitionsTab = await screen.findByRole('button', {
      name: /Transitions/i,
    });
    await user.click(transitionsTab);

    expect(screen.getByText('Allowed Stage Transitions')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Approve')).toBeInTheDocument();

    const schemasTab = screen.getByRole('button', {
      name: /Assigned Content Types/i,
    });
    await user.click(schemasTab);

    expect(await screen.findByText('Articles')).toBeInTheDocument();
  });

  it('prompts confirmation when toggling Default Pipeline if another default exists', async () => {
    const user = userEvent.setup();
    renderDrawer({
      open: true,
      onOpenChange: vi.fn(),
      workflow: null,
    });

    const defaultSwitch = await screen.findByRole('switch', {
      name: /apply automatically to new content types/i,
    });
    expect(defaultSwitch).not.toBeChecked();

    await user.click(defaultSwitch);

    expect(
      await screen.findByText('Replace Default Pipeline?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /"Global Editorial Pipeline" is currently the default pipeline. Making this workflow default will replace it as the fallback for all unassigned content types./,
      ),
    ).toBeInTheDocument();

    const replaceBtn = screen.getByRole('button', { name: 'Replace Default' });
    await user.click(replaceBtn);

    await waitFor(() => {
      expect(defaultSwitch).toBeChecked();
    });
  });

  it('keeps switch off when Keep Current is clicked on replace default confirmation', async () => {
    const user = userEvent.setup();
    renderDrawer({
      open: true,
      onOpenChange: vi.fn(),
      workflow: null,
    });

    const defaultSwitch = await screen.findByRole('switch', {
      name: /apply automatically to new content types/i,
    });
    expect(defaultSwitch).not.toBeChecked();

    await user.click(defaultSwitch);

    expect(
      await screen.findByText('Replace Default Pipeline?'),
    ).toBeInTheDocument();

    const keepCurrentBtn = screen.getByRole('button', { name: 'Keep Current' });
    await user.click(keepCurrentBtn);

    await waitFor(() => {
      expect(defaultSwitch).not.toBeChecked();
    });
  });

  it('blocks removing a stage if active content entries are currently sitting in that stage', async () => {
    mockGetActiveEntriesInStage.mockResolvedValue({ count: 2 });
    const user = userEvent.setup();
    renderDrawer({
      open: true,
      onOpenChange: vi.fn(),
      workflow: existingWorkflow,
    });

    expect(await screen.findByDisplayValue('Approved')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', {
      name: 'Remove stage Approved',
    });
    await user.click(removeBtn);

    expect(mockGetActiveEntriesInStage).toHaveBeenCalledWith(
      'wf-123',
      'approved',
    );
    // Stage must not be removed from the form
    expect(screen.getByDisplayValue('Approved')).toBeInTheDocument();
  });
});
