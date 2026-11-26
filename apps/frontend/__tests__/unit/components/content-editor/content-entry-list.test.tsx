import type { SchemaDefinition } from '@repo/types';
import type { SchemaRecord } from '@repo/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentEntryList } from '@/components/content-editor/content-entry-list';
const { mockList, mockDelete, mockGetWorkflow, mockHasPermission } = vi.hoisted(
  () => ({
    mockList: vi.fn(),
    mockDelete: vi.fn(),
    mockGetWorkflow: vi.fn(),
    mockHasPermission: vi.fn(() => true),
  }),
);
vi.mock('@/hooks/use-permissions', () => ({
  useHasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));
vi.mock('@/lib/api/content', () => ({
  listContentEntries: mockList,
  deleteContentEntry: mockDelete,
}));
vi.mock('@/lib/api/workflows', () => ({
  getWorkflowBySchemaId: mockGetWorkflow,
}));
const definition: SchemaDefinition = {
  fields: [
    {
      apiId: 'title',
      displayName: 'Title',
      dataType: 'text',
      isRequired: true,
      isUnique: false,
      isLocalized: false,
      isRepeatable: false,
      sortOrder: 0,
    },
  ],
};
const schema: SchemaRecord = {
  id: 'schema-1',
  name: 'Article',
  slug: 'article',
  type: 'collection',
  definition,
  status: 'published',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
function renderList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ContentEntryList schema={schema} />
    </QueryClientProvider>,
  );
}
describe('ContentEntryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWorkflow.mockResolvedValue(null);
    mockHasPermission.mockReturnValue(true);
  });
  it('shows an empty state when there are no entries', async () => {
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });
    renderList();
    await waitFor(() => {
      expect(screen.getByText(/no content entries found/i)).toBeInTheDocument();
    });
  });
  it('renders entries using the first text field as the title column', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'published',
          data: { title: 'Hello World' },
          publishedData: null,
          createdBy: 'Sarah Connor',
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    });
    renderList();
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
  });
  it('re-queries with a $contains filter on the title field when searching', async () => {
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });
    const user = userEvent.setup();
    renderList();
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/search by title/i),
      ).toBeInTheDocument();
    });
    await user.type(screen.getByRole('textbox'), 'World');
    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1)!;
      expect(lastCall[0]).toBe('article');
      expect(lastCall[1]).toMatchObject({
        filters: { title: { $contains: 'World' } },
      });
    });
  });
  it('deletes an entry when its Delete action is clicked', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Hello World' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    });
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderList();
    await waitFor(() =>
      expect(screen.getByText('Hello World')).toBeInTheDocument(),
    );
    await user.click(screen.getByTitle('Actions'));
    await user.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('article', 'entry-1');
    });
  });
  it('hides delete action when the user lacks delete permission', async () => {
    mockHasPermission.mockReturnValue(false);
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Hello World' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 1, pageCount: 1 } },
    });
    renderList();
    await waitFor(() =>
      expect(screen.getByText('Hello World')).toBeInTheDocument(),
    );
    expect(screen.queryByTitle('Actions')).not.toBeInTheDocument();
    expect(screen.getByTitle('Edit entry')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
  it('shows pagination controls only when there is more than one page', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Entry 1' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 25, total: 30, pageCount: 2 } },
    });
    renderList();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('filters entries by workflow stage when selected', async () => {
    mockGetWorkflow.mockResolvedValue({
      id: 'wf-1',
      name: 'Editorial Workflow',
      stages: [
        { id: 's-1', name: 'Draft', slug: 'draft', color: '#6b7280' },
        { id: 's-2', name: 'In Review', slug: 'in-review', color: '#f59e0b' },
        { id: 's-3', name: 'Approved', slug: 'approved', color: '#10b981' },
      ],
    });
    mockList.mockResolvedValue({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, total: 0, pageCount: 0 } },
    });
    const user = userEvent.setup();
    renderList();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /filter by workflow stage/i }),
      ).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button', {
      name: /filter by workflow stage/i,
    });
    await user.click(trigger);

    const stageOption = await screen.findByText('In Review');
    await user.click(stageOption);

    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1)!;
      expect(lastCall[0]).toBe('article');
      expect(lastCall[1]).toMatchObject({
        filters: { workflowStage: { $eq: 'in-review' } },
      });
    });

    // Reset button should now be visible
    const resetButton = screen.getByRole('button', { name: /reset filter/i });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);

    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1)!;
      expect(lastCall[1]?.filters).toBeUndefined();
    });
  });

  it('defaults to 10 rows per page and re-queries when rows per page changes', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: 'entry-1',
          status: 'draft',
          data: { title: 'Entry 1' },
          publishedData: null,
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { pagination: { page: 1, pageSize: 10, total: 30, pageCount: 3 } },
    });
    const user = userEvent.setup();
    renderList();

    await waitFor(() => {
      const firstCall = mockList.mock.calls[0]!;
      expect(firstCall[0]).toBe('article');
      expect(firstCall[1]).toMatchObject({
        page: 1,
        pageSize: 10,
      });
    });

    const select = await screen.findByRole('combobox', {
      name: /rows per page/i,
    });
    expect(select).toHaveValue('10');

    await user.selectOptions(select, '20');

    await waitFor(() => {
      const lastCall = mockList.mock.calls.at(-1)!;
      expect(lastCall[0]).toBe('article');
      expect(lastCall[1]).toMatchObject({
        page: 1,
        pageSize: 20,
      });
    });
  });
});
