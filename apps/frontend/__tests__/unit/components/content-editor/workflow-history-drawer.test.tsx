import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkflowHistoryDrawer } from '@/components/content-editor/workflow-history-drawer';
import type { WorkflowHistoryRecord } from '@repo/types';

const { mockGetWorkflowHistory } = vi.hoisted(() => ({
  mockGetWorkflowHistory: vi.fn(),
}));

vi.mock('@/lib/api/workflows', () => ({
  getWorkflowHistory: mockGetWorkflowHistory,
}));

const mockHistory: WorkflowHistoryRecord[] = [
  {
    id: 'h-1',
    entryId: 'entry-1',
    workflowId: 'wf-1',
    fromStage: 'draft',
    toStage: 'in_review',
    action: 'Submit for Review',
    comment: 'First draft completed.',
    actorType: 'user',
    actorUserId: 'user-editor-1',
    applicationId: 'app-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'h-2',
    entryId: 'entry-1',
    workflowId: 'wf-1',
    fromStage: 'in_review',
    toStage: 'approved',
    action: 'Approve',
    comment: 'Looks great to publish.',
    actorType: 'user',
    actorUserId: 'user-admin-1',
    applicationId: 'app-1',
    createdAt: new Date().toISOString(),
  },
];

function renderDrawer(props: {
  schemaSlug: string;
  entryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WorkflowHistoryDrawer {...props} />
    </QueryClientProvider>,
  );
}

describe('WorkflowHistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no past transitions', async () => {
    mockGetWorkflowHistory.mockResolvedValue([]);

    renderDrawer({
      schemaSlug: 'articles',
      entryId: 'entry-1',
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(
      await screen.findByText('No stage transitions recorded yet'),
    ).toBeInTheDocument();
  });

  it('renders history items with stage movements, actors, and review comments', async () => {
    mockGetWorkflowHistory.mockResolvedValue(mockHistory);

    renderDrawer({
      schemaSlug: 'articles',
      entryId: 'entry-1',
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(await screen.findByText('Submit for Review')).toBeInTheDocument();
    expect(screen.getByText('First draft completed.')).toBeInTheDocument();
    expect(screen.getByText('user-editor-1')).toBeInTheDocument();

    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Looks great to publish.')).toBeInTheDocument();
    expect(screen.getByText('user-admin-1')).toBeInTheDocument();
  });
});
