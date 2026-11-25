import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ApprovalsPage from '@/app/(dashboard)/approvals/page';
import { useAuthStore } from '@/stores/auth-store';

const { mockGetPendingReviews, mockTransitionEntry } = vi.hoisted(() => ({
  mockGetPendingReviews: vi.fn(),
  mockTransitionEntry: vi.fn(),
}));

vi.mock('@/lib/api/workflows', () => ({
  getPendingReviews: mockGetPendingReviews,
  transitionEntry: mockTransitionEntry,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('ApprovalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'editor-1',
        email: 'editor@example.com',
        firstName: 'Editor',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['editor'],
        permissions: [{ action: '*', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });
  });

  it('renders access denied message for pure Author role', async () => {
    useAuthStore.setState({
      user: {
        id: 'author-1',
        email: 'author@example.com',
        firstName: 'Author',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['author'],
        permissions: [{ action: 'create', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    renderWithClient(<ApprovalsPage />);

    expect(
      await screen.findByText('Review Access Required'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /The Approvals queue is reserved for Editors and Administrators/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders empty state when there are no pending reviews', async () => {
    mockGetPendingReviews.mockResolvedValueOnce({
      total: 0,
      items: [],
    });

    renderWithClient(<ApprovalsPage />);

    expect(await screen.findByText('All Caught Up!')).toBeInTheDocument();
    expect(
      screen.getByText(
        /There are no content items currently waiting for your review/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders pending review items in the table', async () => {
    mockGetPendingReviews.mockResolvedValueOnce({
      total: 1,
      items: [
        {
          entryId: 'entry-123',
          schemaId: 'schema-1',
          schemaName: 'Blog Post',
          schemaSlug: 'blog-post',
          currentStage: 'review',
          stageName: 'Under Review',
          stageColor: '#f59e0b',
          title: 'A Great Article',
          updatedAt: '2026-11-20T10:00:00.000Z',
          authorEmail: 'author@example.com',
          authorName: 'Author User',
        },
      ],
    });

    renderWithClient(<ApprovalsPage />);

    expect(await screen.findByText('A Great Article')).toBeInTheDocument();
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Author User')).toBeInTheDocument();
    expect(screen.getByText('1 pending')).toBeInTheDocument();
  });

  it('allows quick approval of an item', async () => {
    const user = userEvent.setup();
    mockGetPendingReviews.mockResolvedValue({
      total: 1,
      items: [
        {
          entryId: 'entry-123',
          schemaId: 'schema-1',
          schemaName: 'Blog Post',
          schemaSlug: 'blog-post',
          currentStage: 'review',
          stageName: 'Under Review',
          stageColor: '#f59e0b',
          title: 'A Great Article',
          updatedAt: '2026-11-20T10:00:00.000Z',
          authorEmail: 'author@example.com',
          authorName: 'Author User',
        },
      ],
    });
    mockTransitionEntry.mockResolvedValueOnce({
      entryId: 'entry-123',
      currentStage: 'approved',
    });

    renderWithClient(<ApprovalsPage />);

    expect(
      await screen.findByRole('link', { name: /review in editor/i }),
    ).toBeInTheDocument();

    const moreBtn = await screen.findByRole('button', {
      name: /more actions/i,
    });
    await user.click(moreBtn);

    const approveItem = await screen.findByText('Approve');
    await user.click(approveItem);

    expect(mockTransitionEntry).toHaveBeenCalledWith('blog-post', 'entry-123', {
      toStage: 'approved',
    });
  });

  it('excludes self-submitted items from the reviewer action inbox and shows all caught up', async () => {
    useAuthStore.setState({
      user: {
        id: 'editor-1',
        email: 'editor@example.com',
        firstName: 'Editor',
        lastName: 'User',
        mfaEnabled: false,
        roles: ['editor'],
        permissions: [{ action: '*', schemaId: null, effect: 'allow' }],
      },
      status: 'authenticated',
    });

    mockGetPendingReviews.mockResolvedValue({
      total: 1,
      items: [
        {
          entryId: 'entry-mine',
          schemaId: 'schema-1',
          schemaName: 'Blog Post',
          schemaSlug: 'blog-post',
          currentStage: 'review',
          stageName: 'Under Review',
          stageColor: '#f59e0b',
          title: 'My Own Submission',
          updatedAt: '2026-11-20T10:00:00.000Z',
          authorEmail: 'editor@example.com',
          authorName: 'Editor User',
        },
      ],
    });

    renderWithClient(<ApprovalsPage />);

    expect(await screen.findByText('All Caught Up!')).toBeInTheDocument();
    expect(screen.queryByText('My Own Submission')).not.toBeInTheDocument();
  });

  it('opens request changes modal and submits feedback to return entry to draft', async () => {
    const user = userEvent.setup();
    mockGetPendingReviews.mockResolvedValue({
      total: 1,
      items: [
        {
          entryId: 'entry-123',
          schemaId: 'schema-1',
          schemaName: 'Blog Post',
          schemaSlug: 'blog-post',
          currentStage: 'review',
          stageName: 'Under Review',
          stageColor: '#f59e0b',
          title: 'A Great Article',
          updatedAt: '2026-11-20T10:00:00.000Z',
          authorEmail: 'author@example.com',
          authorName: 'Author User',
        },
      ],
    });
    mockTransitionEntry.mockResolvedValueOnce({
      entryId: 'entry-123',
      currentStage: 'draft',
    });

    renderWithClient(<ApprovalsPage />);

    const moreBtn = await screen.findByRole('button', {
      name: /more actions/i,
    });
    await user.click(moreBtn);

    const requestChangesBtn = await screen.findByText('Request Changes');
    await user.click(requestChangesBtn);

    expect(
      await screen.findByRole('heading', { name: 'Request Changes' }),
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Explain what needs to be changed before this can be approved/i,
    );
    await user.type(textarea, 'Please fix the typo in paragraph 2.');

    const sendFeedbackBtn = screen.getByRole('button', {
      name: /send feedback/i,
    });
    await user.click(sendFeedbackBtn);

    expect(mockTransitionEntry).toHaveBeenCalledWith('blog-post', 'entry-123', {
      toStage: 'draft',
      comment: 'Please fix the typo in paragraph 2.',
    });
  });
});
